import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createUser } from '../../src/services/userService.js';
import generateToken from '../../src/utils/generateToken.js';

// Helper to get a valid admin token
async function getAdminToken() {
  const user = await createUser({
    name: 'Admin',
    email: 'admin@accept.com',
    password: 'Admin@1234',
    role: 'HQ_ADMIN'
  });
  return generateToken(user._id, user.role);
}

describe('POST /api/v1/auth/login', () => {
  it('should return 200 and a token with valid credentials', async () => {
    await createUser({ name: 'Login', email: 'login@accept.com', password: 'Login@1234', role: 'STATION' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@accept.com', password: 'Login@1234' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('STATION');
  });

  it('should return 401 for wrong password', async () => {
    await createUser({ name: 'Login', email: 'wrong@accept.com', password: 'Login@1234', role: 'STATION' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@accept.com', password: 'BadPassword' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('401');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return 200 and the user profile', async () => {
    const user = await createUser({ name: 'Me User', email: 'me@accept.com', password: 'Test@1234', role: 'STATION' });
    const token = generateToken(user._id, user.role);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@accept.com');
    expect(res.body.password).toBeUndefined();
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
