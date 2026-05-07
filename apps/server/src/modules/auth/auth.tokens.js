const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '15m';
const DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;
const REFRESH_TOKEN_BYTES = 64;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function getRequiredAccessTokenSecret() {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT access token secret is not configured');
  }

  return secret;
}

function getAccessTokenExpiresIn() {
  return process.env.JWT_ACCESS_EXPIRES_IN || DEFAULT_ACCESS_TOKEN_EXPIRES_IN;
}

function getRefreshTokenExpiresInDays() {
  const configuredDays = Number.parseInt(
    process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
    10
  );
  return Number.isNaN(configuredDays)
    ? DEFAULT_REFRESH_TOKEN_EXPIRES_IN_DAYS
    : configuredDays;
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    getRequiredAccessTokenSecret(),
    {
      expiresIn: getAccessTokenExpiresIn(),
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getRequiredAccessTokenSecret());
}

function generateRefreshToken() {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

function hashRefreshToken(refreshToken) {
  return crypto.createHash('sha256').update(refreshToken).digest('hex');
}

function getRefreshTokenExpiresAt() {
  return new Date(
    Date.now() + getRefreshTokenExpiresInDays() * MILLISECONDS_PER_DAY
  );
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
};
