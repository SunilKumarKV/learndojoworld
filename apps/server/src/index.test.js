const request = require('supertest');
const app = require('./app');

describe('Server foundation', () => {
  it('responds with health metadata', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Service healthy');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('timestamp');
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/unknown').expect(404);

    expect(response.body.status).toBe('error');
    expect(response.body.message).toMatch(/Route not found/);
  });
});
