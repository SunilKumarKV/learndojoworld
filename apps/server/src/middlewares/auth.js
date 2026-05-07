const prisma = require('../lib/prisma');
const { verifyAccessToken } = require('../modules/auth/auth.tokens');
const { userSelect } = require('../modules/auth/auth.service');
const { createAppError } = require('../utils/appError');

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

// eslint-disable-next-line no-unused-vars
async function authenticate(req, res, next) {
  try {
    const accessToken = getBearerToken(req.headers.authorization);

    if (!accessToken) {
      throw createAppError('Authentication required', 401);
    }

    const payload = verifyAccessToken(accessToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: userSelect,
    });

    if (!user) {
      throw createAppError('Authentication required', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.isOperational) {
      return next(error);
    }

    return next(createAppError('Invalid or expired access token', 401));
  }
}

function authorizeRoles(...allowedRoles) {
  const roles = allowedRoles.flat();

  // eslint-disable-next-line no-unused-vars
  return (req, res, next) => {
    if (!req.user) {
      return next(createAppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        createAppError(
          'You do not have permission to access this resource',
          403
        )
      );
    }

    return next();
  };
}

module.exports = { authenticate, authorizeRoles };
