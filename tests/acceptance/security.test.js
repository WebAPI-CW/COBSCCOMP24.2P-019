import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { registerUser } from '../../src/services/authService.js';
import generateToken from '../../src/utils/generateToken.js';

async function getAdminToken() {
  const user = await registerUser({ name: 'Admin', email: 'admin@sec.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

describe('Security Headers (Helmet)', () => {
  it('should set X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should set X-Frame-Options to deny clickjacking', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('should remove X-Powered-By header', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('should set X-DNS-Prefetch-Control', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });
});

describe('Rate Limit Headers', () => {
  it('should include RateLimit headers on API responses', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`);

    // express-rate-limit with standardHeaders: true adds these headers
    const hasRateLimit =
      res.headers['ratelimit-limit'] !== undefined ||
      res.headers['x-ratelimit-limit'] !== undefined;

    expect(hasRateLimit).toBe(true);
  });

  it('should decrement RateLimit-Remaining on each request', async () => {
    const token = await getAdminToken();

    const res1 = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`);

    const res2 = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`);

    const remaining1 = parseInt(res1.headers['ratelimit-remaining'] || res1.headers['x-ratelimit-remaining']);
    const remaining2 = parseInt(res2.headers['ratelimit-remaining'] || res2.headers['x-ratelimit-remaining']);

    expect(remaining2).toBeLessThan(remaining1);
  });
});

describe('404 Catch-All Handler', () => {
  it('should return 404 for a completely unknown route', async () => {
    const res = await request(app).get('/api/v1/unknown-resource');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('404');
    expect(res.body.message).toBeDefined();
  });

  it('should return 404 for a non-existent top-level path', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('406 Accept Header Validation', () => {
  it('should return 406 when client only accepts text/html', async () => {
    const res = await request(app)
      .get('/api/v1/provinces')
      .set('Accept', 'text/html');

    expect(res.status).toBe(406);
    expect(res.body.code).toBe('406');
    expect(res.body.message).toBe('Not Acceptable');
  });

  it('should allow requests with Accept: application/json', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');

    // Should not be blocked by the 406 middleware (may still be 401 without token for other tests)
    expect(res.status).not.toBe(406);
  });

  it('should allow requests with Accept: */*', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', '*/*');

    expect(res.status).not.toBe(406);
  });
});
