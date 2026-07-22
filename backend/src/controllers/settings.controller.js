const settingsService = require('../services/settings.service');
const { asyncHandler } = require('../middleware/error.middleware');

const getAll = asyncHandler(async (req, res) => {
  res.json({ success: true, data: settingsService.getAll() });
});

const update = asyncHandler(async (req, res) => {
  const data = settingsService.updateMany(req.body);
  res.json({ success: true, data });
});

module.exports = { getAll, update };
