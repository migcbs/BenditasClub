process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');

describe('GET /api/health', () => {
  it('responds with ok status and confirms the DB connection', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
