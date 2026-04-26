import { describe, it, expect } from 'vitest';
import { recordPing, getLastLocation, getLocationHistory, getLiveLocations } from '../../src/services/locationService.js';
import Province from '../../src/models/Province.js';
import District from '../../src/models/District.js';
import PoliceStation from '../../src/models/PoliceStation.js';
import Vehicle from '../../src/models/Vehicle.js';

async function seedVehicle(overrides = {}) {
  const province = await Province.create({ name: 'Western Province', code: 'WP' });
  const district = await District.create({ name: 'Colombo', code: 'CMB', province: province._id });
  const station  = await PoliceStation.create({ name: 'Fort', code: 'FT', district: district._id, province: province._id });
  const vehicle  = await Vehicle.create({
    registrationNumber: overrides.registrationNumber || 'WP-0001',
    deviceId: overrides.deviceId || 'DEV-001',
    driverName: 'Test Driver',
    driverNIC: overrides.driverNIC || '199012345678',
    driverContact: '0771234567',
    province: province._id,
    district: district._id,
    station: station._id,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true
  });
  return { vehicle, province, district, station };
}

describe('LocationService — recordPing', () => {
  it('should create a ping for an active vehicle', async () => {
    const { vehicle } = await seedVehicle();
    const ping = await recordPing(vehicle._id, { latitude: 6.9271, longitude: 79.8612, speed: 30, heading: 90 });

    expect(ping._id).toBeDefined();
    expect(ping.latitude).toBe(6.9271);
    expect(ping.longitude).toBe(79.8612);
  });

  it('should throw 404 for non-existent vehicle', async () => {
    await expect(
      recordPing('000000000000000000000000', { latitude: 6.9, longitude: 79.8 })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw 400 for inactive vehicle', async () => {
    const { vehicle } = await seedVehicle({ isActive: false, registrationNumber: 'WP-0002', deviceId: 'DEV-002', driverNIC: '199099999999' });

    await expect(
      recordPing(vehicle._id, { latitude: 6.9271, longitude: 79.8612 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('LocationService — getLastLocation', () => {
  it('should return the most recent ping', async () => {
    const { vehicle } = await seedVehicle();
    await recordPing(vehicle._id, { latitude: 6.9, longitude: 79.8, speed: 10 });
    await recordPing(vehicle._id, { latitude: 7.0, longitude: 80.0, speed: 50 });

    const { lastPing } = await getLastLocation(vehicle._id);
    expect(lastPing.latitude).toBe(7.0); // most recent
  });

  it('should throw 404 if no pings exist', async () => {
    const { vehicle } = await seedVehicle();
    await expect(
      getLastLocation(vehicle._id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('LocationService — getLocationHistory', () => {
  it('should return paginated history for a vehicle', async () => {
    const { vehicle } = await seedVehicle();
    await recordPing(vehicle._id, { latitude: 6.9, longitude: 79.8 });
    await recordPing(vehicle._id, { latitude: 7.0, longitude: 80.0 });

    const result = await getLocationHistory(vehicle._id, { page: 1, limit: 10 });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });
});

describe('LocationService — getLiveLocations', () => {
  it('should return paginated active vehicle locations', async () => {
    const province = await Province.create({ name: 'Live Province 1', code: 'LP1' });
    const district = await District.create({ name: 'Live District 1', code: 'LD1', province: province._id });
    const station  = await PoliceStation.create({ name: 'Live Station 1', code: 'LS1', district: district._id, province: province._id });
    await Vehicle.create([
      { registrationNumber: 'WP-0010', deviceId: 'DEV-010', driverName: 'D1', driverNIC: '199000000001', driverContact: '0770000001', province: province._id, district: district._id, station: station._id, isActive: true },
      { registrationNumber: 'WP-0011', deviceId: 'DEV-011', driverName: 'D2', driverNIC: '199000000002', driverContact: '0770000002', province: province._id, district: district._id, station: station._id, isActive: true }
    ]);

    const result = await getLiveLocations({ isActive: true }, { page: 1, limit: 10 });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.page).toBe(1);
  });

  it('should not include inactive vehicles', async () => {
    const province = await Province.create({ name: 'Live Province 2', code: 'LP2' });
    const district = await District.create({ name: 'Live District 2', code: 'LD2', province: province._id });
    const station  = await PoliceStation.create({ name: 'Live Station 2', code: 'LS2', district: district._id, province: province._id });
    await Vehicle.create([
      { registrationNumber: 'WP-0020', deviceId: 'DEV-020', driverName: 'D3', driverNIC: '199000000003', driverContact: '0770000003', province: province._id, district: district._id, station: station._id, isActive: true },
      { registrationNumber: 'WP-0021', deviceId: 'DEV-021', driverName: 'D4', driverNIC: '199000000004', driverContact: '0770000004', province: province._id, district: district._id, station: station._id, isActive: false }
    ]);

    const result = await getLiveLocations({ isActive: true }, { page: 1, limit: 10 });
    expect(result.total).toBe(1);
  });
});
