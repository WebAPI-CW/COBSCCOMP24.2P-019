import { describe, it, expect } from 'vitest';
import {
  getAllProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince
} from '../../src/services/provinceService.js';

describe('ProvinceService — createProvince', () => {
  it('should create a province and return it', async () => {
    const province = await createProvince({ name: 'Western Province', code: 'WP' });
    expect(province._id).toBeDefined();
    expect(province.name).toBe('Western Province');
    expect(province.code).toBe('WP');
  });
});

describe('ProvinceService — getAllProvinces', () => {
  it('should return a paginated list with total', async () => {
    await createProvince({ name: 'Western Province', code: 'WP' });
    await createProvince({ name: 'Central Province', code: 'CP' });

    const result = await getAllProvinces({}, { page: 1, limit: 10 });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
    expect(result.page).toBe(1);
  });

  it('should paginate correctly', async () => {
    await createProvince({ name: 'Western Province', code: 'WP' });
    await createProvince({ name: 'Central Province', code: 'CP' });
    await createProvince({ name: 'Southern Province', code: 'SP' });

    const result = await getAllProvinces({}, { page: 1, limit: 2 });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.next).not.toBeNull();
    expect(result.previous).toBeNull();
  });
});

describe('ProvinceService — getProvinceById', () => {
  it('should return the correct province', async () => {
    const created = await createProvince({ name: 'Western Province', code: 'WP' });
    const found = await getProvinceById(created._id);
    expect(found.name).toBe('Western Province');
  });

  it('should throw APIError 404 for unknown ID', async () => {
    await expect(
      getProvinceById('000000000000000000000000')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ProvinceService — updateProvince', () => {
  it('should update only the supplied field (partial update)', async () => {
    const created = await createProvince({ name: 'Western Province', code: 'WP' });
    const updated = await updateProvince(created._id, { name: 'Updated Western' });

    expect(updated.name).toBe('Updated Western');
    expect(updated.code).toBe('WP'); // unchanged
  });

  it('should throw APIError 404 for unknown ID', async () => {
    await expect(
      updateProvince('000000000000000000000000', { name: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ProvinceService — deleteProvince', () => {
  it('should delete a province without error', async () => {
    const created = await createProvince({ name: 'Western Province', code: 'WP' });
    await expect(deleteProvince(created._id)).resolves.not.toThrow();

    // Should be gone now
    await expect(getProvinceById(created._id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('should throw APIError 404 when deleting non-existent province', async () => {
    await expect(
      deleteProvince('000000000000000000000000')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
