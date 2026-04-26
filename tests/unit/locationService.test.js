import { describe, it, expect } from 'vitest';
import {
  recordPing, getLastLocation, getLocationHistory, getLiveLocations,
  getInactiveTukTuks, getAllLocationHistory, getTukTukSummary,
  getSpeedAnomalies, getLocationSummary
} from '../../src/services/locationService.js';
import Province from '../../src/models/Province.js';
import District from '../../src/models/District.js';
import PoliceStation from '../../src/models/PoliceStation.js';
import TukTuk from '../../src/models/TukTuk.js';

let counter = 0;
async function seedTukTuk(overrides = {}) {
  counter++;
  const province = await Province.create({ name: `Province ${counter}`, code: `P${counter}` });
  const district = await District.create({ name: `District ${counter}`, code: `D${counter}`, province: province._id });
  const station  = await PoliceStation.create({ name: `Station ${counter}`, code: `S${counter}`, district: district._id, province: province._id });
  const tuktuk  = await TukTuk.create({
    registrationNumber: overrides.registrationNumber || `WP-${String(counter).padStart(4, '0')}`,
    deviceId:           overrides.deviceId           || `DEV-${counter}`,
    driverName:         'Test Driver',
    driverNIC:          overrides.driverNIC          || `1990${String(counter).padStart(8, '0')}`,
    driverContact:      '0771234567',
    province:           province._id,
    district:           district._id,
    station:            station._id,
    isActive:           overrides.isActive !== undefined ? overrides.isActive : true
  });
  return { tuktuk, province, district, station };
}

// ─── recordPing ──────────────────────────────────────────────────────────────

describe('LocationService — recordPing', () => {
  it('should create a ping for an active tuktuk', async () => {
    const { tuktuk } = await seedTukTuk();
    const ping = await recordPing(tuktuk._id, { latitude: 6.9271, longitude: 79.8612, speed: 30, heading: 90 });
    expect(ping._id).toBeDefined();
    expect(ping.latitude).toBe(6.9271);
  });

  it('should throw 404 for non-existent tuktuk', async () => {
    await expect(recordPing('000000000000000000000000', { latitude: 6.9, longitude: 79.8 }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw 400 for inactive tuktuk', async () => {
    const { tuktuk } = await seedTukTuk({ isActive: false });
    await expect(recordPing(tuktuk._id, { latitude: 6.9271, longitude: 79.8612 }))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── getLastLocation ─────────────────────────────────────────────────────────

describe('LocationService — getLastLocation', () => {
  it('should return the most recent ping', async () => {
    const { tuktuk } = await seedTukTuk();
    await recordPing(tuktuk._id, { latitude: 6.9, longitude: 79.8, speed: 10 });
    await recordPing(tuktuk._id, { latitude: 7.0, longitude: 80.0, speed: 50 });
    const { lastPing } = await getLastLocation(tuktuk._id);
    expect(lastPing.latitude).toBe(7.0);
  });

  it('should throw 404 if no pings exist', async () => {
    const { tuktuk } = await seedTukTuk();
    await expect(getLastLocation(tuktuk._id)).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getLocationHistory ──────────────────────────────────────────────────────

describe('LocationService — getLocationHistory', () => {
  it('should return paginated history for a tuktuk', async () => {
    const { tuktuk } = await seedTukTuk();
    await recordPing(tuktuk._id, { latitude: 6.9, longitude: 79.8 });
    await recordPing(tuktuk._id, { latitude: 7.0, longitude: 80.0 });
    const result = await getLocationHistory(tuktuk._id, { page: 1, limit: 10 });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });
});

// ─── getLiveLocations ────────────────────────────────────────────────────────

describe('LocationService — getLiveLocations', () => {
  it('should return paginated active tuktuk locations', async () => {
    await seedTukTuk(); await seedTukTuk();
    const result = await getLiveLocations({ isActive: true }, { page: 1, limit: 10 });
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.page).toBe(1);
  });

  it('should not include inactive tuktuks', async () => {
    const before = await getLiveLocations({ isActive: true }, { page: 1, limit: 100 });
    await seedTukTuk({ isActive: false });
    const after = await getLiveLocations({ isActive: true }, { page: 1, limit: 100 });
    expect(after.total).toBe(before.total); // inactive tuktuk not counted
  });
});

// ─── getInactiveTukTuks ─────────────────────────────────────────────────────

describe('LocationService — getInactiveTukTuks', () => {
  it('should return tuktuks that have never pinged as never_pinged', async () => {
    await seedTukTuk(); // active but no ping
    const result = await getInactiveTukTuks({ isActive: true }, 6);
    expect(result.total).toBeGreaterThanOrEqual(1);
    const neverPinged = result.data.filter(d => d.status === 'never_pinged');
    expect(neverPinged.length).toBeGreaterThanOrEqual(1);
  });

  it('should return cutoffHours in response', async () => {
    const result = await getInactiveTukTuks({ isActive: true }, 12);
    expect(result.cutoffHours).toBe(12);
  });
});

// ─── getAllLocationHistory ────────────────────────────────────────────────────

describe('LocationService — getAllLocationHistory', () => {
  it('should throw 400 if from or to is missing', async () => {
    await expect(getAllLocationHistory({}, { from: '2025-01-01' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('should return pings within the time window', async () => {
    const { tuktuk } = await seedTukTuk();
    await recordPing(tuktuk._id, { latitude: 6.9, longitude: 79.8 });

    const from = new Date(Date.now() - 60 * 1000).toISOString();
    const to   = new Date(Date.now() + 60 * 1000).toISOString();
    const result = await getAllLocationHistory({ isActive: true }, { from, to, page: 1, limit: 10 });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.timeWindow.from).toBe(from);
  });
});

// ─── getTukTukSummary ───────────────────────────────────────────────────────

describe('LocationService — getTukTukSummary', () => {
  it('should return a summary with totalPings and distance for a tuktuk with pings', async () => {
    const { tuktuk } = await seedTukTuk();
    await recordPing(tuktuk._id, { latitude: 6.9271, longitude: 79.8612, speed: 30 });
    await recordPing(tuktuk._id, { latitude: 6.9300, longitude: 79.8650, speed: 40 });

    const result = await getTukTukSummary(tuktuk._id, {});
    expect(result.summary.totalPings).toBe(2);
    expect(result.summary.approximateDistanceKm).toBeGreaterThanOrEqual(0);
    expect(result.summary.averageSpeedKmph).toBe(35);
  });

  it('should return a no-data message when tuktuk has no pings', async () => {
    const { tuktuk } = await seedTukTuk();
    const result = await getTukTukSummary(tuktuk._id, {});
    expect(result.summary.totalPings).toBe(0);
    expect(result.summary.message).toBeDefined();
  });

  it('should throw 404 for non-existent tuktuk', async () => {
    await expect(getTukTukSummary('000000000000000000000000', {}))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── getSpeedAnomalies ───────────────────────────────────────────────────────

describe('LocationService — getSpeedAnomalies', () => {
  it('should return pings exceeding the speed threshold', async () => {
    const { tuktuk } = await seedTukTuk();
    await recordPing(tuktuk._id, { latitude: 6.9, longitude: 79.8, speed: 30 }); // normal
    await recordPing(tuktuk._id, { latitude: 6.9, longitude: 79.8, speed: 90 }); // anomaly

    const result = await getSpeedAnomalies({ isActive: true }, { speedThreshold: 70, page: 1, limit: 10 });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.data[0].speed).toBeGreaterThanOrEqual(70);
  });

  it('should include tukTukInfo in each result', async () => {
    const { tuktuk } = await seedTukTuk();
    await recordPing(tuktuk._id, { latitude: 6.9, longitude: 79.8, speed: 80 });

    const result = await getSpeedAnomalies({ isActive: true }, { speedThreshold: 70, page: 1, limit: 10 });
    expect(result.data[0].tukTukInfo).toBeDefined();
    expect(result.data[0].tukTukInfo.registrationNumber).toBeDefined();
  });
});

// ─── getLocationSummary ──────────────────────────────────────────────────────

describe('LocationService — getLocationSummary', () => {
  it('should return total and byProvince array', async () => {
    await seedTukTuk();
    const result = await getLocationSummary();
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('byProvince');
    expect(Array.isArray(result.byProvince)).toBe(true);
  });

  it('total should equal sum of all byProvince activeTukTuks', async () => {
    const result = await getLocationSummary();
    const sum = result.byProvince.reduce((acc, p) => acc + p.activeTukTuks, 0);
    expect(result.total).toBe(sum);
  });
});
