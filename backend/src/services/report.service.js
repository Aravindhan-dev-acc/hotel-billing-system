const db = require('../db/database');

const PAID_ONLY = "payment_status != 'CANCELLED'";

/** Dashboard summary: today's sales, monthly sales, recent bills, top items. */
function getDashboardSummary() {
  const today = db
    .prepare(`SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*) AS count FROM bills
               WHERE date(created_at) = date('now') AND ${PAID_ONLY}`)
    .get();

  const month = db
    .prepare(`SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*) AS count FROM bills
               WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND ${PAID_ONLY}`)
    .get();

  const recentBills = db
    .prepare(`SELECT id, bill_number, customer_name, total_amount, payment_method, created_at
               FROM bills ORDER BY created_at DESC LIMIT 10`)
    .all();

  const topItems = db
    .prepare(`SELECT bi.item_name AS name, SUM(bi.quantity) AS totalQty, SUM(bi.line_total) AS totalRevenue
               FROM bill_items bi
               JOIN bills b ON b.id = bi.bill_id
               WHERE ${PAID_ONLY.replace('payment_status', 'b.payment_status')}
               GROUP BY bi.item_id
               ORDER BY totalQty DESC
               LIMIT 5`)
    .all();

  const last7Days = db
    .prepare(`SELECT date(created_at) AS day, COALESCE(SUM(total_amount),0) AS total
               FROM bills
               WHERE date(created_at) >= date('now', '-6 days') AND ${PAID_ONLY}
               GROUP BY day ORDER BY day ASC`)
    .all();

  return {
    todaySales: { total: today.total, count: today.count },
    monthlySales: { total: month.total, count: month.count },
    recentBills,
    topSellingItems: topItems,
    last7DaysTrend: last7Days,
  };
}

/** Generic range report: daily/monthly/yearly/custom - all reduce to a date range. */
function getRangeReport(from, to) {
  const totals = db
    .prepare(`SELECT COALESCE(SUM(subtotal),0) AS subtotal, COALESCE(SUM(tax_amount),0) AS tax,
               COALESCE(SUM(discount_amount),0) AS discount, COALESCE(SUM(total_amount),0) AS total,
               COUNT(*) AS billCount
               FROM bills
               WHERE date(created_at) BETWEEN date(?) AND date(?) AND ${PAID_ONLY}`)
    .get(from, to);

  const byDay = db
    .prepare(`SELECT date(created_at) AS day, COUNT(*) AS billCount, COALESCE(SUM(total_amount),0) AS total
               FROM bills
               WHERE date(created_at) BETWEEN date(?) AND date(?) AND ${PAID_ONLY}
               GROUP BY day ORDER BY day ASC`)
    .all(from, to);

  const byPaymentMethod = db
    .prepare(`SELECT payment_method, COUNT(*) AS billCount, COALESCE(SUM(total_amount),0) AS total
               FROM bills
               WHERE date(created_at) BETWEEN date(?) AND date(?) AND ${PAID_ONLY}
               GROUP BY payment_method`)
    .all(from, to);

  const topItems = db
    .prepare(`SELECT bi.item_name AS name, bi.item_code AS code, SUM(bi.quantity) AS totalQty,
               SUM(bi.line_total) AS totalRevenue
               FROM bill_items bi
               JOIN bills b ON b.id = bi.bill_id
               WHERE date(b.created_at) BETWEEN date(?) AND date(?) AND ${PAID_ONLY.replace('payment_status', 'b.payment_status')}
               GROUP BY bi.item_id ORDER BY totalRevenue DESC LIMIT 20`)
    .all(from, to);

  const bills = db
    .prepare(`SELECT id, bill_number, customer_name, total_amount, payment_method, payment_status, created_at
               FROM bills WHERE date(created_at) BETWEEN date(?) AND date(?) ORDER BY created_at DESC`)
    .all(from, to);

  return { range: { from, to }, totals, byDay, byPaymentMethod, topItems, bills };
}

/** Convenience wrappers matching the requested report periods. */
function getDailyReport(dateStr) {
  const d = dateStr || new Date().toISOString().slice(0, 10);
  return getRangeReport(d, d);
}

function getMonthlyReport(year, month) {
  const y = year || new Date().getFullYear();
  const m = String(month || new Date().getMonth() + 1).padStart(2, '0');
  const from = `${y}-${m}-01`;
  const lastDay = new Date(y, Number(m), 0).getDate();
  const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  return getRangeReport(from, to);
}

function getYearlyReport(year) {
  const y = year || new Date().getFullYear();
  return getRangeReport(`${y}-01-01`, `${y}-12-31`);
}

/** Builds the closing summary object used by both email and WhatsApp notifications. */
function getDailyClosingSummary(dateStr) {
  const d = dateStr || new Date().toISOString().slice(0, 10);
  const report = getDailyReport(d);
  return {
    date: d,
    totalBills: report.totals.billCount,
    totalSales: report.totals.total,
    totalTax: report.totals.tax,
    topItems: report.topItems.slice(0, 5).map((i) => ({ name: i.name, qty: i.totalQty })),
  };
}

module.exports = {
  getDashboardSummary,
  getRangeReport,
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getDailyClosingSummary,
};
