const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/error.middleware');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = authService.login(email, password);
  res.json({ success: true, data: result });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = authService.refresh(refreshToken);
  res.json({ success: true, data: result });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = { login, refresh, me, changePassword };
