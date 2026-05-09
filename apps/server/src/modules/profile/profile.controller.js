const { successResponse } = require('../../utils/apiResponse');
const profileService = require('./profile.service');

async function getMe(req, res) {
  const profile = await profileService.getMyProfile(req.user.id);
  return successResponse(res, { profile });
}

async function patchMe(req, res) {
  const profile = await profileService.updateMyProfile(req.user.id, req.body || {});
  return successResponse(res, { profile }, 'Profile updated');
}

async function getProfiles(req, res) {
  const profiles = await profileService.listProfiles(req.user.id, req.query.search || '');
  return successResponse(res, { profiles });
}

async function follow(req, res) {
  await profileService.followUser(req.user.id, req.params.userId);
  return successResponse(res, { ok: true }, 'Followed user');
}

async function unfollow(req, res) {
  await profileService.unfollowUser(req.user.id, req.params.userId);
  return successResponse(res, { ok: true }, 'Unfollowed user');
}

async function followers(req, res) {
  const profiles = await profileService.listFollowers(req.params.userId || req.user.id);
  return successResponse(res, { profiles });
}

async function following(req, res) {
  const profiles = await profileService.listFollowing(req.params.userId || req.user.id);
  return successResponse(res, { profiles });
}

module.exports = { getMe, patchMe, getProfiles, follow, unfollow, followers, following };
