const bcrypt = require('bcrypt');
const request = require('supertest');

jest.mock('../../lib/prisma', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prismaMock.$transaction.mockImplementation(async (callback) =>
    callback(prismaMock)
  );

  return prismaMock;
});

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-auth-routes';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.BCRYPT_SALT_ROUNDS = '4';

const app = require('../../app');
const prisma = require('../../lib/prisma');
const { authorizeRoles } = require('../../middlewares/auth');
const { hashRefreshToken, signAccessToken } = require('./auth.tokens');

const baseUser = {
  id: 'user_1',
  email: 'learner@example.com',
  name: 'Test Learner',
  role: 'LEARNER',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback) =>
      callback(prisma)
    );
  });

  it('registers a learner with hashed password and tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      ...baseUser,
      email: data.email,
      name: data.name,
      role: data.role,
    }));
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh_1' });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Learner',
        email: 'LEARNER@example.com',
        password: 'Password123',
      })
      .expect(201);

    expect(response.body.status).toBe('success');
    expect(response.body.data.user).toMatchObject({
      email: 'learner@example.com',
      role: 'LEARNER',
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(response.body.data.tokens.refreshToken).toEqual(expect.any(String));

    const createPayload = prisma.user.create.mock.calls[0][0].data;
    expect(createPayload.passwordHash).not.toBe('Password123');
    await expect(
      bcrypt.compare('Password123', createPayload.passwordHash)
    ).resolves.toBe(true);
  });

  it('rejects duplicate registrations', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing_user' });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Learner',
        email: 'learner@example.com',
        password: 'Password123',
      })
      .expect(409);

    expect(response.body.message).toBe('Email is already registered');
  });

  it('rejects admin self-registration', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Password123',
        role: 'ADMIN',
      })
      .expect(400);

    expect(response.body.message).toBe('Validation failed');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('Password123', 4);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh_1' });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'learner@example.com',
        password: 'Password123',
      })
      .expect(200);

    expect(response.body.data.user.email).toBe(baseUser.email);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(response.body.data.tokens.refreshToken).toEqual(expect.any(String));
  });

  it('rejects invalid login credentials', async () => {
    const passwordHash = await bcrypt.hash('Password123', 4);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'learner@example.com',
        password: 'WrongPassword123',
      })
      .expect(401);

    expect(response.body.message).toBe('Invalid email or password');
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('returns the current user for a valid access token', async () => {
    prisma.user.findUnique.mockResolvedValue(baseUser);
    const accessToken = signAccessToken(baseUser);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.user).toMatchObject({
      email: baseUser.email,
      role: baseUser.role,
    });
  });

  it('rotates refresh tokens', async () => {
    const refreshToken = 'raw-refresh-token';
    const storedToken = {
      id: 'refresh_1',
      tokenHash: hashRefreshToken(refreshToken),
      userId: baseUser.id,
      user: baseUser,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    };
    prisma.refreshToken.findUnique.mockResolvedValue(storedToken);
    prisma.refreshToken.update.mockResolvedValue({
      ...storedToken,
      revokedAt: new Date(),
    });
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh_2' });

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: storedToken.id },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        tokenHash: expect.not.stringMatching(storedToken.tokenHash),
        userId: baseUser.id,
        expiresAt: expect.any(Date),
      },
    });
    expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken);
  });

  it('logs out idempotently by revoking the refresh token hash', async () => {
    const refreshToken = 'raw-refresh-token';
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken })
      .expect(200);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it('blocks users without an allowed role', () => {
    const req = { user: { role: 'LEARNER' } };
    const next = jest.fn();

    authorizeRoles('ADMIN')(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'You do not have permission to access this resource',
        statusCode: 403,
      })
    );
  });
});
