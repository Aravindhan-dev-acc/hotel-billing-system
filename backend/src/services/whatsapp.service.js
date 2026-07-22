/**
 * WhatsApp notification service.
 * Supports two providers, selected via WHATSAPP_PROVIDER env var:
 *   - 'twilio' : Twilio WhatsApp API (https://www.twilio.com/whatsapp)
 *   - 'meta'   : Meta WhatsApp Cloud API (https://developers.facebook.com/docs/whatsapp)
 *   - 'none'   : disabled (default) - messages are logged only.
 *
 * Uses global fetch (Node 18+) for the Meta API to avoid extra dependencies,
 * and the official 'twilio' pattern via raw REST call (no SDK dependency needed
 * to keep the install lightweight - swap in the official 'twilio' npm package
 * if preferred).
 */
const config = require('../config');
const db = require('../db/database');
const logger = require('../utils/logger');

function logNotification(event, recipient, status, errorMessage = null) {
  db.prepare(`
    INSERT INTO notification_log (type, event, recipient, status, error_message)
    VALUES ('WHATSAPP', ?, ?, ?, ?)
  `).run(event, recipient, status, errorMessage);
}

async function sendViaTwilio(message) {
  const { accountSid, authToken, from, ownerNumber } = config.whatsapp.twilio;
  if (!accountSid || !authToken || !from || !ownerNumber) {
    throw new Error('Twilio WhatsApp credentials are not fully configured.');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({ From: from, To: ownerNumber, Body: message });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio error (${res.status}): ${text}`);
  }
  return ownerNumber;
}

async function sendViaMeta(message) {
  const { phoneNumberId, accessToken, recipientNumber } = config.whatsapp.meta;
  if (!phoneNumberId || !accessToken || !recipientNumber) {
    throw new Error('Meta WhatsApp Cloud API credentials are not fully configured.');
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipientNumber,
      type: 'text',
      text: { body: message },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta WhatsApp error (${res.status}): ${text}`);
  }
  return recipientNumber;
}

/** Sends a plain-text WhatsApp message to the owner using the configured provider. */
async function sendWhatsAppMessage(message, event = 'GENERIC') {
  const provider = config.whatsapp.provider;

  if (provider === 'none') {
    logger.warn('WhatsApp notifications disabled (WHATSAPP_PROVIDER=none). Skipped.');
    logNotification(event, null, 'FAILED', 'WhatsApp provider not configured.');
    return { skipped: true };
  }

  try {
    const recipient =
      provider === 'twilio' ? await sendViaTwilio(message) : await sendViaMeta(message);
    logNotification(event, recipient, 'SENT');
    logger.info(`WhatsApp message sent via ${provider}.`);
    return { success: true };
  } catch (err) {
    logNotification(event, null, 'FAILED', err.message);
    logger.error(`WhatsApp send failed via ${provider}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function sendBillWhatsApp(bill) {
  const message =
    `New Bill Generated\n` +
    `Bill No: ${bill.bill_number}\n` +
    `Customer: ${bill.customer_name || 'Walk-in'}\n` +
    `Amount: ${bill.total_amount.toFixed(2)}\n` +
    `Payment: ${bill.payment_method}`;
  return sendWhatsAppMessage(message, 'BILL_CREATED');
}

async function sendDailyClosingWhatsApp(summary) {
  const message =
    `Daily Closing Summary - ${summary.date}\n` +
    `Total Bills: ${summary.totalBills}\n` +
    `Total Sales: ${summary.totalSales.toFixed(2)}\n` +
    `Total Tax: ${summary.totalTax.toFixed(2)}`;
  return sendWhatsAppMessage(message, 'DAILY_CLOSING');
}

module.exports = { sendWhatsAppMessage, sendBillWhatsApp, sendDailyClosingWhatsApp };
