import { describe, it, expect } from 'vitest';
import { getPaginationData } from '../../src/utils/paginationHelper.js';
import Province from '../../src/models/Province.js';

// Seed helper
async function seedProvinces(count) {
  const docs = Array.from({ length: count }, (_, i) => ({
    name: `Province ${i + 1}`,
    code: `P${i + 1}`
  }));
  return Province.insertMany(docs);
}

describe('getPaginationData — basic structure', () => {
  it('should return page, limit, total, offset, next, previous, data', async () => {
    await seedProvinces(5);
    const result = await getPaginationData(Province, { page: 1, limit: 3 });

    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('offset');
    expect(result).toHaveProperty('next');
    expect(result).toHaveProperty('previous');
    expect(result).toHaveProperty('data');
  });

  it('should return correct total count', async () => {
    await seedProvinces(7);
    const result = await getPaginationData(Province, { page: 1, limit: 3 });
    expect(result.total).toBe(7);
  });

  it('should return the correct number of records for the page', async () => {
    await seedProvinces(7);
    const result = await getPaginationData(Province, { page: 1, limit: 3 });
    expect(result.data).toHaveLength(3);
  });
});

describe('getPaginationData — next and previous links', () => {
  it('should have next link and no previous on the first page', async () => {
    await seedProvinces(5);
    const result = await getPaginationData(Province, { page: 1, limit: 2 });
    expect(result.previous).toBeNull();
    expect(result.next).not.toBeNull();
  });

  it('should have previous link and no next on the last page', async () => {
    await seedProvinces(4);
    const result = await getPaginationData(Province, { page: 2, limit: 2 });
    expect(result.previous).not.toBeNull();
    expect(result.next).toBeNull();
  });

  it('should have both next and previous on a middle page', async () => {
    await seedProvinces(9);
    const result = await getPaginationData(Province, { page: 2, limit: 3 });
    expect(result.previous).not.toBeNull();
    expect(result.next).not.toBeNull();
  });

  it('should have no next and no previous when all records fit on one page', async () => {
    await seedProvinces(3);
    const result = await getPaginationData(Province, { page: 1, limit: 10 });
    expect(result.previous).toBeNull();
    expect(result.next).toBeNull();
  });
});

describe('getPaginationData — defaults', () => {
  it('should default to page 1 when no page is given', async () => {
    await seedProvinces(3);
    const result = await getPaginationData(Province, {});
    expect(result.page).toBe(1);
  });

  it('should return empty data array when collection is empty', async () => {
    const result = await getPaginationData(Province, { page: 1, limit: 10 });
    expect(result.total).toBe(0);
    expect(result.data).toHaveLength(0);
    expect(result.next).toBeNull();
    expect(result.previous).toBeNull();
  });
});
