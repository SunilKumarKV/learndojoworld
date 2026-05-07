const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { createAppError } = require('../../utils/appError');
const { PUBLIC_REGISTRATION_ROLES, ROLES } = require('./auth.constants');
const {
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
  signAccessToken,
} = require('./auth.tokens');

const DEFAULT_BCRYPT_SALT_ROUNDS = 12;

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const userWithPasswordSelect = {
  ...userSelect,
  passwordHash: true,
};

function getBcryptSaltRounds() {
  const configuredRounds = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
  return Number.isNaN(configuredRounds)
    ? DEFAULT_BCRYPT_SALT_ROUNDS
    : configuredRounds;
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function createTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: getRefreshTokenExpiresAt(),
    },
  });

  return {
    user: toPublicUser(user),
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

async function registerUser(payload) {
  const role = payload.role || ROLES.LEARNER;

  if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
    throw createAppError('Admin users cannot self-register', 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (existingUser) {
    throw createAppError('Email is already registered', 409);
  }

  const passwordHash = await bcrypt.hash(
    payload.password,
    getBcryptSaltRounds()
  );
  const user = await prisma.user.create({
    data: {
      email: payload.email,
      name: payload.name,
      passwordHash,
      role,
    },
    select: userSelect,
  });

  return createTokenPair(user);
}

async function loginUser(payload) {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: userWithPasswordSelect,
  });

  if (!user) {
    throw createAppError('Invalid email or password', 401);
  }

  const passwordMatches = await bcrypt.compare(
    payload.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw createAppError('Invalid email or password', 401);
  }

  return createTokenPair(user);
}

async function logoutUser(refreshToken) {
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

async function refreshUserSession(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    throw createAppError('Refresh token is invalid or expired', 401);
  }

  const nextRefreshToken = generateRefreshToken();
  const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);
  const revokedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt },
    });

    await tx.refreshToken.create({
      data: {
        tokenHash: nextRefreshTokenHash,
        userId: storedToken.userId,
        expiresAt: getRefreshTokenExpiresAt(),
      },
    });
  });

  return {
    user: toPublicUser(storedToken.user),
    tokens: {
      accessToken: signAccessToken(storedToken.user),
      refreshToken: nextRefreshToken,
    },
  };
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  toPublicUser,
  userSelect,
};
