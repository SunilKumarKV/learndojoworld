const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { asyncHandler } = require('../../utils/asyncHandler');
const controller = require('./profile.controller');

const router = express.Router();
router.use(authenticate);

router.get('/me', asyncHandler(controller.getMe));
router.patch('/me', asyncHandler(controller.patchMe));
router.get('/discover', asyncHandler(controller.getProfiles));
router.post('/:userId/follow', asyncHandler(controller.follow));
router.delete('/:userId/follow', asyncHandler(controller.unfollow));
router.get('/:userId/followers', asyncHandler(controller.followers));
router.get('/:userId/following', asyncHandler(controller.following));

module.exports = router;
