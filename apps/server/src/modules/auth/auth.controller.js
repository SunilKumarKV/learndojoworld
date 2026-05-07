const { successResponse } = require('../../utils/apiResponse');
const {
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
} = require('./auth.service');

async function register(req, res) {
  const session = await registerUser(req.body);
  return successResponse(res, session, 'Registration successful', 201);
}

async function login(req, res) {
  const session = await loginUser(req.body);
  return successResponse(res, session, 'Login successful');
}

async function logout(req, res) {
  await logoutUser(req.body.refreshToken);
  return successResponse(res, null, 'Logout successful');
}

async function refresh(req, res) {
  const session = await refreshUserSession(req.body.refreshToken);
  return successResponse(res, session, 'Token refreshed');
}

async function me(req, res) {
  return successResponse(res, { user: req.user }, 'Current user retrieved');
}

module.exports = { register, login, logout, refresh, me };
