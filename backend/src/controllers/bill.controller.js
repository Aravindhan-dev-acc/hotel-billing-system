const billService = require('../services/bill.service');
const emailService = require('../services/email.service');
const whatsappService = require('../services/whatsapp.service');
const licenseService = require('../services/license.service');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

const create = asyncHandler(async (req, res) => {
  const bill = billService.createBill(req.body, req.user.id);

  // Fire-and-forget notifications - do not block the HTTP response on external services
  emailService.sendBillNotification(bill, bill.items).catch((e) => logger.error(e));
  whatsappService.sendBillWhatsApp(bill).catch((e) => logger.error(e));

  res.status(201).json({ success: true, data: bill, license: licenseService.getLicenseState() });
});

const list = asyncHandler(async (req, res) => {
  const result = billService.listBills(req.query);
  res.json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const bill = billService.getBillById(req.params.id);
  res.json({ success: true, data: bill });
});

const cancel = asyncHandler(async (req, res) => {
  const bill = billService.cancelBill(req.params.id);
  res.json({ success: true, data: bill });
});

module.exports = { create, list, getById, cancel };
