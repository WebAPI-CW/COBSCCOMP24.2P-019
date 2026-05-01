import { describe, it, expect } from 'vitest';
import {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation
} from '../../src/services/stationService.js';
import Province from '../../src/models/Province.js';
import District from '../../src/models/District.js';

async function seedRefs() {
  const province = await Province.create({ name: 'Western Province', code: 'WP' });
  const district = await District.create({ name: 'Colombo', code: 'CMB', province: province._id });
  return { province, district };
}

describe('StationService — createStation', () => {
  it('should create a station and return it', async () => {
    const { province, district } = await seedRefs();
    const station = await createStation({
      name: 'Colombo Fort',
      code: 'ST001',
      district: district._id,
      province: province._id
    });

    expect(station._id).toBeDefined();
    expect(station.name).toBe('Colombo Fort');
    expect(station.code).toBe('ST001');
  });
});

describe('StationService — getAllStations', () => {
  it('should return paginated list', async () => {
    const { province, district } = await seedRefs();
    await createStation({ name: 'Fort', code: 'FT', district: district._id, province: province._id });
    await createStation({ name: 'Pettah', code: 'PT', district: district._id, province: province._id });

    const result = await getAllStations({}, { page: 1, limit: 10 });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should filter by district', async () => {
    const { province, district } = await seedRefs();
    const district2 = await District.create({ name: 'Gampaha', code: 'GPH', province: province._id });

    await createStation({ name: 'Fort', code: 'FT', district: district._id, province: province._id });
    await createStation({ name: 'Negombo', code: 'NGM', district: district2._id, province: province._id });

    const result = await getAllStations({ district: district._id }, { page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.data[0].name).toBe('Fort');
  });
});

describe('StationService — getStationById', () => {
  it('should return the station with province and district populated', async () => {
    const { province, district } = await seedRefs();
    const created = await createStation({ name: 'Fort', code: 'FT', district: district._id, province: province._id });

    const found = await getStationById(created._id);
    expect(found.name).toBe('Fort');
    expect(found.province.name).toBe('Western Province');
    expect(found.district.name).toBe('Colombo');
  });

  it('should throw 404 for unknown ID', async () => {
    await expect(
      getStationById('000000000000000000000000')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('StationService — updateStation', () => {
  it('should allow partial update', async () => {
    const { province, district } = await seedRefs();
    const created = await createStation({ name: 'Fort', code: 'FT', district: district._id, province: province._id });

    const updated = await updateStation(created._id, { name: 'Fort Updated' });
    expect(updated.name).toBe('Fort Updated');
    expect(updated.code).toBe('FT'); // unchanged
  });

  it('should throw 404 for unknown ID', async () => {
    await expect(
      updateStation('000000000000000000000000', { name: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('StationService — deleteStation', () => {
  it('should delete and confirm it is gone', async () => {
    const { province, district } = await seedRefs();
    const created = await createStation({ name: 'Fort', code: 'FT', district: district._id, province: province._id });

    await expect(deleteStation(created._id)).resolves.not.toThrow();
    await expect(getStationById(created._id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw 404 when deleting non-existent station', async () => {
    await expect(
      deleteStation('000000000000000000000000')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
