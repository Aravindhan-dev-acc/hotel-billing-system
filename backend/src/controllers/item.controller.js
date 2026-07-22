const itemService = require('../services/item.service');
const { asyncHandler } = require('../middleware/error.middleware');

const list = asyncHandler(async (req, res) => {
  const result = itemService.list(req.query);
  res.json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const item = itemService.getById(req.params.id);
  res.json({ success: true, data: item });
});

const create = asyncHandler(async (req, res) => {
  const item = itemService.create(req.body);
  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const item = itemService.update(req.params.id, req.body);
  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const result = itemService.remove(req.params.id);
  res.json({
    success: true,
    message: result.softDeleted
      ? 'Item is used in existing bills, so it was marked unavailable instead of deleted.'
      : 'Item deleted successfully.',
  });
});

const categories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: itemService.listCategories() });
});

module.exports = { list, getById, create, update, remove, categories };
