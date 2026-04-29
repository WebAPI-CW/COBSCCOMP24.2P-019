import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createUser } from '../../src/services/userService.js';
import generateToken from '../../src/utils/generateToken.js';

async function getAdminToken() {
  const user = await createUser({ name: 'Admin', email: 'admin@prov.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

async function getStationToken() {
  const user = await createUser({ name: 'Station', email: 'station@prov.com', password: 'Test@1234', role: 'STATION' });
  return generateToken(user._id, user.role);
}

describe('GET /api/v1/provinces', () => {
  it('should return 200 with paginated data', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/provinces').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('page');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/provinces');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/provinces', () => {
  it('should create a province and return 201 with Location header', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Western Province', code: 'WP' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Western Province');
    expect(res.headers.location).toContain('/api/v1/provinces/');
  });

  it('should return 400 for missing required field', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Code Province' });
    expect(res.status).toBe(400);
  });

  it('should return 403 if STATION role tries to create', async () => {
    const token = await getStationToken();
    const res = await request(app)
      .post('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Western Province', code: 'WP' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/provinces/:code', () => {
  it('should return a single province by code', async () => {
    const token = await getAdminToken();
    await request(app).post('/api/v1/provinces').set('Authorization', `Bearer ${token}`).send({ name: 'Single Test Province', code: 'STP' });
    const res = await request(app).get('/api/v1/provinces/STP').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Single Test Province');
  });

  it('should return 404 for unknown province code', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/provinces/UNKNOWN').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/provinces/:code', () => {
  it('should allow partial update (only name, not code)', async () => {
    const token = await getAdminToken();
    await request(app).post('/api/v1/provinces').set('Authorization', `Bearer ${token}`).send({ name: 'Western Province', code: 'WP' });
    const updateRes = await request(app)
      .patch('/api/v1/provinces/WP')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Western' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Updated Western');
    expect(updateRes.body.code).toBe('WP');
  });
});

describe('DELETE /api/v1/provinces/:code', () => {
  it('should return 204 after successful delete', async () => {
    const token = await getAdminToken();
    await request(app).post('/api/v1/provinces').set('Authorization', `Bearer ${token}`).send({ name: 'Delete Me', code: 'DM' });
    const deleteRes = await request(app).delete('/api/v1/provinces/DM').set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);
  });

  it('should return 404 for unknown province code', async () => {
    const token = await getAdminToken();
    const res = await request(app).delete('/api/v1/provinces/NOTEXIST').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
