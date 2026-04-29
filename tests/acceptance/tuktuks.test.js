import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createUser } from '../../src/services/userService.js';
import generateToken from '../../src/utils/generateToken.js';
import Province from '../../src/models/Province.js';
import District from '../../src/models/District.js';
import PoliceStation from '../../src/models/PoliceStation.js';

async function getAdminToken() {
  const user = await createUser({ name: 'Admin', email: 'admin@veh.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

async function getDeviceToken() {
  const user = await createUser({ name: 'Device', email: 'device@veh.com', password: 'Device@1234', role: 'DEVICE', registrationNumber: 'WP-0001' });
  return generateToken(user._id, user.role);
}

async function seedRefs() {
  const province = await Province.create({ name: 'Western Province', code: 'WP' });
  const district = await District.create({ name: 'Colombo', code: 'CMB', province: province._id });
  const station  = await PoliceStation.create({ name: 'Fort', code: 'FT', district: district._id, province: province._id });
  return { province, district, station };
}

async function seedTukTuk(token, refs) {
  const res = await request(app)
    .post('/api/v1/tuktuks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      registrationNumber: 'WP-0001', deviceId: 'DEV-001', driverName: 'Test Driver',
      driverNIC: '199012345678', driverContact: '0771234567',
      province: refs.province.code, district: refs.district.code, station: refs.station.code
    });
  return res.body;
}

// ── TukTuk CRUD ────────────────────────────────────────────────────────────

describe('POST /api/v1/tuktuks', () => {
  it('should create a tukTuk and return 201 with Location header', async () => {
    const token = await getAdminToken();
    const refs  = await seedRefs();
    const res = await request(app)
      .post('/api/v1/tuktuks').set('Authorization', `Bearer ${token}`)
      .send({ registrationNumber: 'WP-0001', deviceId: 'DEV-001', driverName: 'Test Driver',
        driverNIC: '199012345678', driverContact: '0771234567',
        province: refs.province.code, district: refs.district.code, station: refs.station.code });
    expect(res.status).toBe(201);
    expect(res.headers.location).toContain('/api/v1/tuktuks/');
    expect(res.body.isActive).toBe(true);
  });
});

describe('GET /api/v1/tuktuks', () => {
  it('should return only matching tukTuks when registrationNumber filter applied', async () => {
    const token = await getAdminToken();
    const refs  = await seedRefs();
    await seedTukTuk(token, refs);
    const res = await request(app).get('/api/v1/tuktuks?registrationNumber=WP-0001').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach(v => expect(v.registrationNumber).toMatch(/WP-0001/i));
  });
});

describe('GET /api/v1/tuktuks/:registrationNumber', () => {
  it('should return a single tukTuk by registrationNumber', async () => {
    const token   = await getAdminToken();
    const refs    = await seedRefs();
    const tukTuk = await seedTukTuk(token, refs);
    const res = await request(app).get(`/api/v1/tuktuks/${tukTuk.registrationNumber}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.registrationNumber).toBe('WP-0001');
  });

  it('should return 404 for unknown registration number', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/tuktuks/UNKNOWN-9999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/tuktuks/:registrationNumber', () => {
  it('should update driverName and return 200', async () => {
    const token   = await getAdminToken();
    const refs    = await seedRefs();
    const tukTuk = await seedTukTuk(token, refs);
    const res = await request(app)
      .patch(`/api/v1/tuktuks/${tukTuk.registrationNumber}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ driverName: 'Updated Driver' });
    expect(res.status).toBe(200);
    expect(res.body.driverName).toBe('Updated Driver');
  });
});

describe('PATCH /api/v1/tuktuks/:registrationNumber (deactivate)', () => {
  it('should set isActive to false', async () => {
    const token   = await getAdminToken();
    const refs    = await seedRefs();
    const tukTuk = await seedTukTuk(token, refs);
    const res = await request(app).patch(`/api/v1/tuktuks/${tukTuk.registrationNumber}`).set('Authorization', `Bearer ${token}`).send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });
});

describe('PATCH /api/v1/tuktuks/:registrationNumber (activate)', () => {
  it('should reactivate a deactivated tukTuk', async () => {
    const token   = await getAdminToken();
    const refs    = await seedRefs();
    const tukTuk = await seedTukTuk(token, refs);
    await request(app).patch(`/api/v1/tuktuks/${tukTuk.registrationNumber}`).set('Authorization', `Bearer ${token}`).send({ isActive: false });
    const res = await request(app).patch(`/api/v1/tuktuks/${tukTuk.registrationNumber}`).set('Authorization', `Bearer ${token}`).send({ isActive: true });
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(true);
  });
});

describe('DELETE /api/v1/tuktuks/:registrationNumber', () => {
  it('should return 204 on successful delete', async () => {
    const token   = await getAdminToken();
    const refs    = await seedRefs();
    const tukTuk = await seedTukTuk(token, refs);
    const res = await request(app).delete(`/api/v1/tuktuks/${tukTuk.registrationNumber}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('should return 404 when fetching after delete', async () => {
    const token   = await getAdminToken();
    const refs    = await seedRefs();
    const tukTuk = await seedTukTuk(token, refs);
    await request(app).delete(`/api/v1/tuktuks/${tukTuk.registrationNumber}`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).get(`/api/v1/tuktuks/${tukTuk.registrationNumber}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ── Location Endpoints ──────────────────────────────────────────────────────

describe('POST /api/v1/tuktuks/:registrationNumber/ping', () => {
  it('should record a ping and return 201', async () => {
    const adminToken  = await getAdminToken();
    const deviceToken = await getDeviceToken();
    const refs        = await seedRefs();
    const tukTuk     = await seedTukTuk(adminToken, refs);
    const res = await request(app).post(`/api/v1/tuktuks/${tukTuk.registrationNumber}/ping`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ latitude: 6.9271, longitude: 79.8612, speed: 30, heading: 90 });
    expect(res.status).toBe(201);
    expect(res.body.latitude).toBe(6.9271);
  });

  it('should return 400 for out-of-range coordinates', async () => {
    const adminToken  = await getAdminToken();
    const deviceToken = await getDeviceToken();
    const refs        = await seedRefs();
    const tukTuk     = await seedTukTuk(adminToken, refs);
    const res = await request(app).post(`/api/v1/tuktuks/${tukTuk.registrationNumber}/ping`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ latitude: 99.0, longitude: 79.8612 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/tuktuks/:registrationNumber/location', () => {
  it('should return last known location after a ping', async () => {
    const adminToken  = await getAdminToken();
    const deviceToken = await getDeviceToken();
    const refs        = await seedRefs();
    const tukTuk     = await seedTukTuk(adminToken, refs);
    await request(app).post(`/api/v1/tuktuks/${tukTuk.registrationNumber}/ping`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ latitude: 6.9271, longitude: 79.8612, speed: 30 });
    const res = await request(app).get(`/api/v1/tuktuks/${tukTuk.registrationNumber}/location`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('lastLocation');
    expect(res.body.lastLocation.latitude).toBe(6.9271);
  });

  it('should return 404 if tukTuk has no pings', async () => {
    const token   = await getAdminToken();
    const refs    = await seedRefs();
    const tukTuk = await seedTukTuk(token, refs);
    const res = await request(app).get(`/api/v1/tuktuks/${tukTuk.registrationNumber}/location`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/tuktuks/:registrationNumber/history', () => {
  it('should return paginated location history', async () => {
    const adminToken  = await getAdminToken();
    const deviceToken = await getDeviceToken();
    const refs        = await seedRefs();
    const tukTuk     = await seedTukTuk(adminToken, refs);
    await request(app).post(`/api/v1/tuktuks/${tukTuk.registrationNumber}/ping`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ latitude: 6.9271, longitude: 79.8612, speed: 30 });
    const res = await request(app).get(`/api/v1/tuktuks/${tukTuk.registrationNumber}/history`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/v1/tuktuks/:registrationNumber/summary', () => {
  it('should return a summary with totalPings after a ping', async () => {
    const adminToken  = await getAdminToken();
    const deviceToken = await getDeviceToken();
    const refs        = await seedRefs();
    const tukTuk     = await seedTukTuk(adminToken, refs);
    await request(app).post(`/api/v1/tuktuks/${tukTuk.registrationNumber}/ping`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ latitude: 6.9271, longitude: 79.8612, speed: 30 });
    const res = await request(app).get(`/api/v1/tuktuks/${tukTuk.registrationNumber}/summary`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary.totalPings).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/v1/locations/live', () => {
  it('should return paginated live locations', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/locations/live').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
  });
});

describe('GET /api/v1/locations/inactive', () => {
  it('should return tukTuks with no recent pings', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/locations/inactive?hours=6').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cutoffHours', 6);
    expect(res.body).toHaveProperty('data');
  });
});

describe('GET /api/v1/locations/history', () => {
  it('should return 403 if user role is DEVICE', async () => {
    const token = await getDeviceToken();
    const from  = new Date(Date.now() - 60000).toISOString();
    const to    = new Date(Date.now() + 60000).toISOString();
    const res = await request(app).get(`/api/v1/locations/history?from=${from}&to=${to}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('should return 400 if from or to is missing', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/locations/history?from=2025-01-01T00:00:00Z').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('should return pings in the time window', async () => {
    const token = await getAdminToken();
    const from  = new Date(Date.now() - 60000).toISOString();
    const to    = new Date(Date.now() + 60000).toISOString();
    const res = await request(app).get(`/api/v1/locations/history?from=${from}&to=${to}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('timeWindow');
    expect(res.body).toHaveProperty('data');
  });
});

describe('GET /api/v1/locations/anomalies', () => {
  it('should return 200 with speed threshold and data', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/locations/anomalies?speedThreshold=70').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('speedThreshold', 70);
    expect(res.body).toHaveProperty('data');
  });
});

describe('GET /api/v1/locations/summary', () => {
  it('should return total and byProvince array', async () => {
    const token = await getAdminToken();
    const res = await request(app).get('/api/v1/locations/summary').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.byProvince)).toBe(true);
  });
});
