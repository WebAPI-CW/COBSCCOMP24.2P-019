import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createUser } from '../../src/services/userService.js';
import generateToken from '../../src/utils/generateToken.js';

async function getAdminToken() {
  const user = await createUser({ name: 'Admin', email: 'admin@usr.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

describe('GET /api/v1/users', () => {
  it('should return 200 with paginated data for HQ_ADMIN', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('should return 403 for non-admin role', async () => {
    const u = await createUser({ name: 'S', email: 'station@usr.com', password: 'Test@1234', role: 'STATION' });
    const token = generateToken(u._id, u.role);
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('should not expose passwords in the response', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    res.body.data.forEach(user => expect(user.password).toBeUndefined());
  });

  it('should filter by role', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/users?role=HQ_ADMIN').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach(user => expect(user.role).toBe('HQ_ADMIN'));
  });
});

describe('GET /api/v1/users/:id', () => {
  it('should return a single user without password', async () => {
    const token = await getAdminToken();
    const list = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    const userId = list.body.data[0]._id;
    const res = await request(app).get(`/api/v1/users/${userId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(userId);
    expect(res.body.password).toBeUndefined();
  });

  it('should return 400 for invalid ObjectId', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/users/not-valid-id').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/users/:id', () => {
  it('should update name and not expose password', async () => {
    const token = await getAdminToken();
    const list = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    const userId = list.body.data[0]._id;
    const res = await request(app).patch(`/api/v1/users/${userId}`).set('Authorization', `Bearer ${token}`).send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body.password).toBeUndefined();
  });
});

describe('PATCH /api/v1/users/:id (deactivate)', () => {
  it('should return 200 with isActive false', async () => {
    const token = await getAdminToken();
    const target = await createUser({ name: 'Target', email: 'target@usr.com', password: 'Test@1234', role: 'STATION' });
    const res = await request(app).patch(`/api/v1/users/${target._id}`).set('Authorization', `Bearer ${token}`).send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });
});

describe('POST /api/v1/users', () => {
  it('should return 201 and user for valid data', async () => {
    const adminToken = await getAdminToken();

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Station User', email: 'station@accept.com', password: 'Station@1234', role: 'STATION' });

    expect(res.status).toBe(201);
    expect(res.headers.location).toContain('/api/v1/users/');
    expect(res.body.email).toBe('station@accept.com');
  });

  it('should return 400 for duplicate email', async () => {
    const adminToken = await getAdminToken();

    await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'User', email: 'dup@accept.com', password: 'Test@1234', role: 'STATION' });

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'User', email: 'dup@accept.com', password: 'Test@1234', role: 'STATION' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('409');
  });
});

