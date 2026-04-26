import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { registerUser } from '../../src/services/authService.js';
import generateToken from '../../src/utils/generateToken.js';
import Province from '../../src/models/Province.js';
import District from '../../src/models/District.js';
import PoliceStation from '../../src/models/PoliceStation.js';

async function getAdminToken() {
  const user = await registerUser({ name: 'Admin', email: 'admin@veh.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

async function getDeviceToken(vehicleId) {
  const user = await registerUser({ name: 'Device', email: 'device@veh.com', password: 'Device@1234', role: 'DEVICE' });
  return generateToken(user._id, user.role);
}

async function seedRefs() {
  const province = await Province.create({ name: 'Western Province', code: 'WP' });
  const district = await District.create({ name: 'Colombo', code: 'CMB', province: province._id });
  const station  = await PoliceStation.create({ name: 'Fort', code: 'FT', district: district._id, province: province._id });
  return { province, district, station };
}

async function seedVehicle(token, refs) {
  const res = await request(app)
    .post('/api/v1/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      registrationNumber: 'WP-0001',
      deviceId: 'DEV-001',
      driverName: 'Test Driver',
      driverNIC: '199012345678',
      driverContact: '0771234567',
      province: refs.province._id,
      district: refs.district._id,
      station: refs.station._id
    });
  return res.body;
}

describe('POST /api/v1/vehicles', () => {
  it('should create a vehicle and return 201 with Location header', async () => {
    const token = await getAdminToken();
    const refs   = await seedRefs();

    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        registrationNumber: 'WP-0001',
        deviceId: 'DEV-001',
        driverName: 'Test Driver',
        driverNIC: '199012345678',
        driverContact: '0771234567',
        province: refs.province._id,
        district: refs.district._id,
        station: refs.station._id
      });

    expect(res.status).toBe(201);
    expect(res.headers.location).toContain('/api/v1/vehicles/');
    expect(res.body.isActive).toBe(true);
  });
});

describe('PUT /api/v1/vehicles/:id/deactivate', () => {
  it('should set isActive to false', async () => {
    const token = await getAdminToken();
    const refs   = await seedRefs();
    const vehicle = await seedVehicle(token, refs);

    const res = await request(app)
      .put(`/api/v1/vehicles/${vehicle._id}/deactivate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicle.isActive).toBe(false);
  });
});

describe('POST /api/v1/vehicles/:id/ping', () => {
  it('should record a ping and return 201', async () => {
    const adminToken  = await getAdminToken();
    const deviceToken = await getDeviceToken();
    const refs        = await seedRefs();
    const vehicle     = await seedVehicle(adminToken, refs);

    const res = await request(app)
      .post(`/api/v1/vehicles/${vehicle._id}/ping`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ latitude: 6.9271, longitude: 79.8612, speed: 30, heading: 90 });

    expect(res.status).toBe(201);
    expect(res.body.latitude).toBe(6.9271);
  });

  it('should return 400 for out-of-range coordinates', async () => {
    const adminToken  = await getAdminToken();
    const deviceToken = await getDeviceToken();
    const refs        = await seedRefs();
    const vehicle     = await seedVehicle(adminToken, refs);

    const res = await request(app)
      .post(`/api/v1/vehicles/${vehicle._id}/ping`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ latitude: 99.0, longitude: 79.8612 }); // latitude out of Sri Lanka bounds

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/locations/live', () => {
  it('should return paginated live locations', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .get('/api/v1/locations/live')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('data');
  });
});
