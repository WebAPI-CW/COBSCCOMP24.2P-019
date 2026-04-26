import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createUser } from '../../src/services/userService.js';
import generateToken from '../../src/utils/generateToken.js';

async function getAdminToken() {
  const user = await createUser({ name: 'Admin', email: 'admin@sta.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

async function seedProvinceAndDistrict(token) {
  const pRes = await request(app)
    .post('/api/v1/provinces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Western Province', code: 'WP' });
  const dRes = await request(app)
    .post('/api/v1/districts')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Colombo', code: 'CMB', province: pRes.body._id });
  return { province: pRes.body, district: dRes.body };
}

describe('GET /api/v1/police-stations', () => {
  it('should return 200 with paginated data', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/police-stations').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/police-stations');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/police-stations', () => {
  it('should create a station and return 201 with Location header', async () => {
    const token = await getAdminToken();
    const { province, district } = await seedProvinceAndDistrict(token);
    const res = await request(app)
      .post('/api/v1/police-stations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Colombo Fort', code: 'CF', district: district._id, province: province._id });
    expect(res.status).toBe(201);
    expect(res.headers.location).toContain('/api/v1/police-stations/');
  });

  it('should return 400 for missing required fields', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/v1/police-stations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  it('should return 403 if STATION role tries to create', async () => {
    const stationUser = await createUser({ name: 'S', email: 'station@sta.com', password: 'Test@1234', role: 'STATION' });
    const stationToken = generateToken(stationUser._id, stationUser.role);
    const res = await request(app)
      .post('/api/v1/police-stations')
      .set('Authorization', `Bearer ${stationToken}`)
      .send({ name: 'T', code: 'T', district: '000000000000000000000000', province: '000000000000000000000000' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/police-stations/:id', () => {
  it('should return a single station by id', async () => {
    const token = await getAdminToken();
    const { province, district } = await seedProvinceAndDistrict(token);
    const created = await request(app).post('/api/v1/police-stations').set('Authorization', `Bearer ${token}`).send({ name: 'Single Station', code: 'SS1', district: district._id, province: province._id });
    const res = await request(app).get(`/api/v1/police-stations/${created.body._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Single Station');
  });

  it('should return 400 for invalid ObjectId', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/police-stations/not-valid').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/police-stations/:id', () => {
  it('should allow partial update', async () => {
    const token = await getAdminToken();
    const { province, district } = await seedProvinceAndDistrict(token);
    const createRes = await request(app)
      .post('/api/v1/police-stations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Fort', code: 'FT', district: district._id, province: province._id });
    const updateRes = await request(app)
      .patch(`/api/v1/police-stations/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Fort Updated' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Fort Updated');
    expect(updateRes.body.code).toBe('FT');
  });
});

describe('DELETE /api/v1/police-stations/:id', () => {
  it('should return 204 on successful delete', async () => {
    const token = await getAdminToken();
    const { province, district } = await seedProvinceAndDistrict(token);
    const createRes = await request(app)
      .post('/api/v1/police-stations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Fort', code: 'FT', district: district._id, province: province._id });
    const deleteRes = await request(app)
      .delete(`/api/v1/police-stations/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);
  });
});
