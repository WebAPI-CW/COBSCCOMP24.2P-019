import { describe, it, expect } from 'vitest';
import {
  getAllDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict
} from '../../src/services/districtService.js';
import Province from '../../src/models/Province.js';

async function seedProvince() {
  return Province.create({ name: 'Western Province', code: 'WP' });
}

describe('DistrictService — createDistrict', () => {
  it('should create a district and return it', async () => {
    const province = await seedProvince();
    const district = await createDistrict({ name: 'Colombo', code: 'CMB', province: province._id });

    expect(district._id).toBeDefined();
    expect(district.name).toBe('Colombo');
    expect(district.code).toBe('CMB');
  });
});

describe('DistrictService — getAllDistricts', () => {
  it('should return paginated list', async () => {
    const province = await seedProvince();
    await createDistrict({ name: 'Colombo', code: 'CMB', province: province._id });
    await createDistrict({ name: 'Gampaha', code: 'GPH', province: province._id });

    const result = await getAllDistricts({}, { page: 1, limit: 10 });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should filter by province', async () => {
    const wp = await seedProvince();
    const cp = await Province.create({ name: 'Central Province', code: 'CP' });
    await createDistrict({ name: 'Colombo', code: 'CMB', province: wp._id });
    await createDistrict({ name: 'Kandy', code: 'KDY', province: cp._id });

    const result = await getAllDistricts({ province: wp._id }, { page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.data[0].name).toBe('Colombo');
  });
});

describe('DistrictService — getDistrictById', () => {
  it('should return the district with province populated', async () => {
    const province = await seedProvince();
    const created = await createDistrict({ name: 'Colombo', code: 'CMB', province: province._id });

    const found = await getDistrictById(created._id);
    expect(found.name).toBe('Colombo');
    expect(found.province.name).toBe('Western Province');
  });

  it('should throw 404 for unknown ID', async () => {
    await expect(
      getDistrictById('000000000000000000000000')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('DistrictService — updateDistrict', () => {
  it('should allow partial update', async () => {
    const province = await seedProvince();
    const created = await createDistrict({ name: 'Colombo', code: 'CMB', province: province._id });

    const updated = await updateDistrict(created._id, { name: 'Colombo Updated' });
    expect(updated.name).toBe('Colombo Updated');
    expect(updated.code).toBe('CMB'); // unchanged
  });

  it('should throw 404 for unknown ID', async () => {
    await expect(
      updateDistrict('000000000000000000000000', { name: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('DistrictService — deleteDistrict', () => {
  it('should delete and confirm it is gone', async () => {
    const province = await seedProvince();
    const created = await createDistrict({ name: 'Colombo', code: 'CMB', province: province._id });

    await expect(deleteDistrict(created._id)).resolves.not.toThrow();
    await expect(getDistrictById(created._id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw 404 when deleting non-existent district', async () => {
    await expect(
      deleteDistrict('000000000000000000000000')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
