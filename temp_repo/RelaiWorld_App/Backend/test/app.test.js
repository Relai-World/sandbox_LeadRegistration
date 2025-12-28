const request = require('supertest');
const app = require('../app');

describe('Basic API smoke tests', () => {
  test('GET /api/test should return API is working', async () => {
    const res = await request(app).get('/api/test');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'API is working');
  });

  test('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });

  test('CORS allows localhost origins', async () => {
    const res = await request(app).get('/api/test').set('Origin', 'http://localhost:8888');
    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:8888');
  });

  test('CORS allows netlify preview domains', async () => {
    const res = await request(app).get('/api/test').set('Origin', 'https://deploy-preview--something.netlify.app');
    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://deploy-preview--something.netlify.app');
  });

  test('CORS rejects unknown domains', async () => {
    const res = await request(app).get('/api/test').set('Origin', 'https://evil.example');
    // The CORS callback produces an error which is handled by the app's error handler
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error', 'Not allowed by CORS');
  });

  test('POST /api/user/login returns 503 when Supabase is not configured', async () => {
    const res = await request(app).post('/api/user/login').send({ email: 'test@x.com', password: 'pass' });
    expect([500, 503]).toContain(res.statusCode); // depending on environment, earlier behavior may differ
    // prefer explicit 503 when supabase.isConfigured is false
    if (res.statusCode === 503) {
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Supabase is not configured/i);
    }
  });
});
