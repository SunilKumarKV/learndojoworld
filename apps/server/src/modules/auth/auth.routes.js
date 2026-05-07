const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { asyncHandler } = require('../../utils/asyncHandler');
const { login, logout, me, refresh, register } = require('./auth.controller');
const {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} = require('./auth.validation');

const router = express.Router();

router.post(
  '/register',
  validateRequest(registerSchema),
  asyncHandler(register)
);
router.post('/login', validateRequest(loginSchema), asyncHandler(login));
router.post('/logout', validateRequest(logoutSchema), asyncHandler(logout));
router.post('/refresh', validateRequest(refreshSchema), asyncHandler(refresh));
router.get('/me', authenticate, asyncHandler(me));

module.exports = router;
