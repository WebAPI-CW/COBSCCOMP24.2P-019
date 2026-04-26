import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { registerUser } from '../../src/services/authService.js';
import generateToken from '../../src/utils/generateToken.js';
import Province from '../../src/models/Province.js';

async function getAdminToken() {
  const user = await registerUser({ name: 'Admin', email: 'admin@dist.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

async function seedProvince(token) {
  const res = await request(app)
    .post('/api/v1/provinces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Western Province', code: 'WP' });
  return res.body;
}

describe('GET /api/v1/districts', () => {
  it('should return 200 with paginated data', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/districts').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/districts');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/districts', () => {
  it('should create a district and return 201 with Location header', async () => {
    const token    = await getAdminToken();
    const province = await seedProvince(token);

    const res = await request(app)
      .post('/api/v1/districts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Colombo', code: 'CMB', province: province._id });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Colombo');
    expect(res.headers.location).toContain('/api/v1/districts/');
  });

  it('should return 400 for missing province field', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/v1/districts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Colombo', code: 'CMB' }); // no province

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/v1/districts/:id', () => {
  it('should allow partial update', async () => {
    const token    = await getAdminToken();
    const province = await seedProvince(token);

    const createRes = await request(app)
      .post('/api/v1/districts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Colombo', code: 'CMB', province: province._id });

    const id = createRes.body._id;

    const updateRes = await request(app)
      .put(`/api/v1/districts/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Colombo Updated' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Colombo Updated');
    expect(updateRes.body.code).toBe('CMB');
  });
});

describe('DELETE /api/v1/districts/:id', () => {
  it('should return 204 on successful delete', async () => {
    const token    = await getAdminToken();
    const province = await seedProvince(token);

    const createRes = await request(app)
      .post('/api/v1/districts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Colombo', code: 'CMB', province: province._id });

    const deleteRes = await request(app)
      .delete(`/api/v1/districts/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);
  });

  it('should return 400 for invalid ObjectId', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .delete('/api/v1/districts/not-an-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
