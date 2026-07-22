/**
 * Lightweight in-process scheduler (no external cron dependency needed).
 * Checks every minute whether it's the configured closing time (default 23:55)
 * and, if so, sends the daily closing summary via email + WhatsApp exactly once per day.
 */
const reportService = require('../services/report.service');
const emailService = require('../services/email.service');
const whatsappService = require('../services/whatsapp.service');
const logger = require('../utils/logger');

const CLOSING_HOUR = 23;
const CLOSING_MINUTE = 55;
let lastRunDate = null;

async function runDailyClosingIfDue() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (
    now.getHours() === CLOSING_HOUR &&
    now.getMinutes() === CLOSING_MINUTE &&
    lastRunDate !== today
  ) {
    lastRunDate = today;
    try {
      const summary = reportService.getDailyClosingSummary(today);
      await Promise.all([
        emailService.sendDailyClosingSummary(summary),
        whatsappService.sendDailyClosingWhatsApp(summary),
      ]);
      logger.info(`Daily closing summary sent automatically for ${today}.`);
    } catch (err) {
      logger.error(`Automatic daily closing summary failed: ${err.message}`);
    }
  }
}

function startScheduler() {
  setInterval(runDailyClosingIfDue, 60 * 1000);
  logger.info(`Daily closing scheduler started (fires at ${CLOSING_HOUR}:${CLOSING_MINUTE}).`);
}

module.exports = { startScheduler };
