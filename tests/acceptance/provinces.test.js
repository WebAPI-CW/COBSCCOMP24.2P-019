import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { registerUser } from '../../src/services/authService.js';
import generateToken from '../../src/utils/generateToken.js';

async function getAdminToken() {
  const user = await registerUser({ name: 'Admin', email: 'admin@prov.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

async function getStationToken() {
  const user = await registerUser({ name: 'Station', email: 'station@prov.com', password: 'Test@1234', role: 'STATION' });
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
      .send({ name: 'No Code Province' }); // missing code

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

describe('PUT /api/v1/provinces/:id', () => {
  it('should allow partial update (only name, not code)', async () => {
    const token = await getAdminToken();

    // Create
    const createRes = await request(app)
      .post('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Western Province', code: 'WP' });

    const id = createRes.body._id;

    // Partial update — only name
    const updateRes = await request(app)
      .put(`/api/v1/provinces/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Western' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Updated Western');
    expect(updateRes.body.code).toBe('WP'); // code unchanged
  });
});

describe('DELETE /api/v1/provinces/:id', () => {
  it('should return 204 after successful delete', async () => {
    const token = await getAdminToken();

    const createRes = await request(app)
      .post('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Delete Me', code: 'DM' });

    const id = createRes.body._id;

    const deleteRes = await request(app)
      .delete(`/api/v1/provinces/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);
  });

  it('should return 400 for invalid ObjectId format', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .delete('/api/v1/provinces/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
