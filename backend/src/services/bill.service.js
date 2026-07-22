const db = require('../db/database');
const { AppError } = require('../middleware/error.middleware');
const settingsService = require('./settings.service');
const licenseService = require('./license.service');

/** Generates a sequential, human-friendly bill number, e.g. INV-20260721-0007 */
function generateBillNumber() {
  const prefix = settingsService.get('invoice_prefix') || 'INV';
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

  const countToday = db
    .prepare(`SELECT COUNT(*) AS c FROM bills WHERE date(created_at) = date('now')`)
    .get().c;

  const sequence = String(countToday + 1).padStart(4, '0');
  return `${prefix}-${datePart}-${sequence}`;
}

/**
 * Creates a bill and its line items in a single transaction.
 * Recalculates totals server-side from the item master (never trusts client-sent prices)
 * to prevent price tampering.
 */
function createBill(payload, userId) {
  const { items, customerName, customerPhone, roomNumber, discountAmount = 0, paymentMethod = 'CASH' } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one item is required to generate a bill.', 400);
  }

  const txn = db.transaction(() => {
    let subtotal = 0;
    let taxAmount = 0;
    const resolvedItems = [];

    for (const line of items) {
      const item = db.prepare('SELECT * FROM items WHERE id = ?').get(line.itemId);
      if (!item) throw new AppError(`Item with id ${line.itemId} not found.`, 404);
      if (!item.is_available) throw new AppError(`Item "${item.name}" is currently unavailable.`, 400);

      const qty = Number(line.quantity);
      if (!qty || qty <= 0) throw new AppError(`Invalid quantity for item "${item.name}".`, 400);

      const lineSubtotal = item.price * qty;
      const lineTax = (lineSubtotal * item.tax_percent) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      resolvedItems.push({
        item_id: item.id,
        item_name: item.name,
        item_code: item.item_code,
        unit_price: item.price,
        quantity: qty,
        tax_percent: item.tax_percent,
        line_total: Math.round(lineTotal * 100) / 100,
      });
    }

    const totalAmount = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
    if (totalAmount < 0) throw new AppError('Discount cannot exceed the bill subtotal + tax.', 400);

    const billNumber = generateBillNumber();

    const billResult = db
      .prepare(
        `INSERT INTO bills
         (bill_number, customer_name, customer_phone, room_number, subtotal, tax_amount,
          discount_amount, total_amount, payment_method, payment_status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?)`
      )
      .run(
        billNumber,
        customerName || null,
        customerPhone || null,
        roomNumber || null,
        Math.round(subtotal * 100) / 100,
        Math.round(taxAmount * 100) / 100,
        discountAmount,
        totalAmount,
        paymentMethod,
        userId
      );

    const billId = billResult.lastInsertRowid;
    const insertLine = db.prepare(
      `INSERT INTO bill_items (bill_id, item_id, item_name, item_code, unit_price, quantity, tax_percent, line_total)
       VALUES (@bill_id, @item_id, @item_name, @item_code, @unit_price, @quantity, @tax_percent, @line_total)`
    );
    for (const li of resolvedItems) {
      insertLine.run({ bill_id: billId, ...li });
    }

    licenseService.incrementTrialBillCount();

    return { billId, billNumber };
  });

  const { billId } = txn();
  return getBillById(billId);
}

function getBillById(id) {
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
  if (!bill) throw new AppError('Bill not found.', 404);
  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(id);
  return { ...bill, items };
}

function listBills({ page = 1, limit = 20, search = '', from, to, paymentStatus }) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (page - 1) * limit;

  const where = [];
  const params = {};

  if (search) {
    where.push('(bill_number LIKE @search OR customer_name LIKE @search OR customer_phone LIKE @search)');
    params.search = `%${search}%`;
  }
  if (from) {
    where.push('date(created_at) >= date(@from)');
    params.from = from;
  }
  if (to) {
    where.push('date(created_at) <= date(@to)');
    params.to = to;
  }
  if (paymentStatus) {
    where.push('payment_status = @paymentStatus');
    params.paymentStatus = paymentStatus;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS c FROM bills ${whereClause}`).get(params).c;
  const rows = db
    .prepare(`SELECT * FROM bills ${whereClause} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });

  return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

function cancelBill(id) {
  const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
  if (!bill) throw new AppError('Bill not found.', 404);
  db.prepare("UPDATE bills SET payment_status = 'CANCELLED' WHERE id = ?").run(id);
  return getBillById(id);
}

module.exports = { createBill, getBillById, listBills, cancelBill, generateBillNumber };
