const nodemailer = require('nodemailer');
const config = require('../config');
const db = require('../db/database');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (!config.email.enabled) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  return transporter;
}

function logNotification(event, recipient, status, errorMessage = null) {
  db.prepare(`
    INSERT INTO notification_log (type, event, recipient, status, error_message)
    VALUES ('EMAIL', ?, ?, ?, ?)
  `).run(event, recipient, status, errorMessage);
}

async function sendMail({ to, subject, html, event = 'GENERIC' }) {
  const t = getTransporter();
  if (!t) {
    logger.warn(`Email disabled - skipped sending "${subject}" to ${to}`);
    logNotification(event, to, 'FAILED', 'Email notifications disabled in settings.');
    return { skipped: true };
  }

  try {
    await t.sendMail({ from: config.email.from, to, subject, html });
    logNotification(event, to, 'SENT');
    logger.info(`Email sent: "${subject}" to ${to}`);
    return { success: true };
  } catch (err) {
    logNotification(event, to, 'FAILED', err.message);
    logger.error(`Email failed: "${subject}" to ${to} - ${err.message}`);
    return { success: false, error: err.message };
  }
}

/** Sends the owner a notification after every bill is generated. */
async function sendBillNotification(bill, items) {
  if (!config.email.ownerEmail) return;
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px;border:1px solid #ddd">${i.item_name}</td><td style="padding:4px 8px;border:1px solid #ddd">${i.quantity}</td><td style="padding:4px 8px;border:1px solid #ddd">${i.line_total.toFixed(2)}</td></tr>`
    )
    .join('');

  const html = `
    <h2>New Bill Generated - #${bill.bill_number}</h2>
    <p><strong>Customer:</strong> ${bill.customer_name || 'Walk-in'}</p>
    <p><strong>Total Amount:</strong> ${bill.total_amount.toFixed(2)}</p>
    <p><strong>Payment Method:</strong> ${bill.payment_method}</p>
    <table style="border-collapse:collapse">
      <tr><th style="padding:4px 8px;border:1px solid #ddd">Item</th><th style="padding:4px 8px;border:1px solid #ddd">Qty</th><th style="padding:4px 8px;border:1px solid #ddd">Total</th></tr>
      ${rows}
    </table>
  `;

  return sendMail({
    to: config.email.ownerEmail,
    subject: `New Bill #${bill.bill_number} - ${bill.total_amount.toFixed(2)}`,
    html,
    event: 'BILL_CREATED',
  });
}

/** Sends the daily closing summary email to the owner. */
async function sendDailyClosingSummary(summary) {
  if (!config.email.ownerEmail) return;
  const html = `
    <h2>Daily Closing Summary - ${summary.date}</h2>
    <p><strong>Total Bills:</strong> ${summary.totalBills}</p>
    <p><strong>Total Sales:</strong> ${summary.totalSales.toFixed(2)}</p>
    <p><strong>Total Tax Collected:</strong> ${summary.totalTax.toFixed(2)}</p>
    <h3>Top Selling Items</h3>
    <ul>${summary.topItems.map((i) => `<li>${i.name} - ${i.qty} sold</li>`).join('')}</ul>
  `;
  return sendMail({
    to: config.email.ownerEmail,
    subject: `Daily Closing Summary - ${summary.date}`,
    html,
    event: 'DAILY_CLOSING',
  });
}

module.exports = { sendMail, sendBillNotification, sendDailyClosingSummary };
