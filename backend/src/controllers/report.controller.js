const reportService = require('../services/report.service');
const emailService = require('../services/email.service');
const whatsappService = require('../services/whatsapp.service');
const { asyncHandler } = require('../middleware/error.middleware');

const dashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: reportService.getDashboardSummary() });
});

const daily = asyncHandler(async (req, res) => {
  res.json({ success: true, data: reportService.getDailyReport(req.query.date) });
});

const monthly = asyncHandler(async (req, res) => {
  res.json({ success: true, data: reportService.getMonthlyReport(req.query.year, req.query.month) });
});

const yearly = asyncHandler(async (req, res) => {
  res.json({ success: true, data: reportService.getYearlyReport(req.query.year) });
});

const custom = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  res.json({ success: true, data: reportService.getRangeReport(from, to) });
});

/** Manually triggers the daily closing summary (also runs on a schedule - see scheduler). */
const sendClosingSummaryNow = asyncHandler(async (req, res) => {
  const summary = reportService.getDailyClosingSummary(req.query.date);
  await Promise.all([
    emailService.sendDailyClosingSummary(summary),
    whatsappService.sendDailyClosingWhatsApp(summary),
  ]);
  res.json({ success: true, message: 'Daily closing summary sent.', data: summary });
});

module.exports = { dashboard, daily, monthly, yearly, custom, sendClosingSummaryNow };
