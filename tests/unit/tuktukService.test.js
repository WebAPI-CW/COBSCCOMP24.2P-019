import { describe, it, expect } from 'vitest';
import {
  createTukTuk,
  getAllTukTuks,
  getTukTukById,
  updateTukTuk,
  deleteTukTuk
} from '../../src/services/tuktukService.js';
import Province from '../../src/models/Province.js';
import District from '../../src/models/District.js';
import PoliceStation from '../../src/models/PoliceStation.js';

async function createRefs() {
  const province = await Province.create({ name: 'Western Province', code: 'WP' });
  const district = await District.create({ name: 'Colombo', code: 'CMB', province: province._id });
  const station  = await PoliceStation.create({ name: 'Colombo Fort', code: 'CF', district: district._id, province: province._id });
  return { province, district, station };
}

function tuktukData(refs, overrides = {}) {
  return {
    registrationNumber: 'WP-1234', deviceId: 'DEV-001', driverName: 'Test Driver',
    driverNIC: '199012345678', driverContact: '0771234567',
    province: refs.province._id, district: refs.district._id, station: refs.station._id,
    ...overrides
  };
}

describe('TukTukService — createTukTuk', () => {
  it('should create a tuktuk and return it', async () => {
    const refs    = await createRefs();
    const tuktuk = await createTukTuk(tuktukData(refs));
    expect(tuktuk._id).toBeDefined();
    expect(tuktuk.registrationNumber).toBe('WP-1234');
    expect(tuktuk.isActive).toBe(true);
  });

  it('should throw 400 if registrationNumber is duplicate', async () => {
    const refs = await createRefs();
    await createTukTuk(tuktukData(refs));
    await expect(
      createTukTuk(tuktukData(refs, { deviceId: 'DEV-002', driverNIC: '199099999999' }))
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('TukTukService — getAllTukTuks (registration search)', () => {
  it('should return all tuktuks with no filter', async () => {
    const refs = await createRefs();
    await createTukTuk(tuktukData(refs, { registrationNumber: 'WP-1001', deviceId: 'D1', driverNIC: '111111111111' }));
    await createTukTuk(tuktukData(refs, { registrationNumber: 'CP-2002', deviceId: 'D2', driverNIC: '222222222222' }));
    const result = await getAllTukTuks({}, { page: 1, limit: 10 });
    expect(result.total).toBe(2);
  });

  it('should filter by registrationNumber regex', async () => {
    const refs = await createRefs();
    await createTukTuk(tuktukData(refs, { registrationNumber: 'WP-1001', deviceId: 'D3', driverNIC: '333333333333' }));
    await createTukTuk(tuktukData(refs, { registrationNumber: 'CP-2002', deviceId: 'D4', driverNIC: '444444444444' }));
    const result = await getAllTukTuks(
      { registrationNumber: { $regex: 'WP', $options: 'i' } },
      { page: 1, limit: 10 }
    );
    expect(result.total).toBe(1);
    expect(result.data[0].registrationNumber).toBe('WP-1001');
  });
});

describe('TukTukService — updateTukTuk (mass-assignment protection)', () => {
  it('should update only whitelisted fields', async () => {
    const refs    = await createRefs();
    const tuktuk = await createTukTuk(tuktukData(refs));
    const updated = await updateTukTuk(tuktuk._id, { driverName: 'New Driver', isActive: false });
    expect(updated.driverName).toBe('New Driver');
    expect(updated.isActive).toBe(false); // isActive is now whitelisted
  });

  it('should throw 400 if updating isActive to the same state', async () => {
    const refs    = await createRefs();
    const tuktuk = await createTukTuk(tuktukData(refs));
    await expect(updateTukTuk(tuktuk._id, { isActive: true }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('should throw 404 for non-existent tuktuk', async () => {
    await expect(updateTukTuk('000000000000000000000000', { driverName: 'X' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});


describe('TukTukService — deleteTukTuk', () => {
  it('should delete the tuktuk', async () => {
    const refs    = await createRefs();
    const tuktuk = await createTukTuk(tuktukData(refs));
    await expect(deleteTukTuk(tuktuk._id)).resolves.not.toThrow();
    await expect(getTukTukById(tuktuk._id)).rejects.toMatchObject({ statusCode: 404 });
  });
});
