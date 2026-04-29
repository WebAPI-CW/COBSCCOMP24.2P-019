import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createUser } from '../../src/services/userService.js';
import generateToken from '../../src/utils/generateToken.js';

async function getAdminToken() {
  const user = await createUser({ name: 'Admin', email: 'admin@etag.com', password: 'Admin@1234', role: 'HQ_ADMIN' });
  return generateToken(user._id, user.role);
}

// ─── ETag Conditional GET (RFC 7232) ─────────────────────────────────────────

describe('ETag — Conditional GET (RFC 7232)', () => {
  it('should return an ETag header on a successful GET', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['etag']).toBeDefined();
    expect(res.headers['etag']).toMatch(/^"[a-f0-9]+"$/); // strong ETag format
  });

  it('should return 304 Not Modified when If-None-Match matches current ETag', async () => {
    const token = await getAdminToken();

    // First request — get the ETag
    const res1 = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`);

    const etag = res1.headers['etag'];
    expect(etag).toBeDefined();

    // Second request — send the ETag back
    const res2 = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .set('If-None-Match', etag);

    expect(res2.status).toBe(304);
    expect(res2.body).toEqual({}); // no body on 304
  });

  it('should return 200 when If-None-Match does not match current ETag', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .get('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .set('If-None-Match', '"000000000000000000000000"');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('should return 412 Precondition Failed when If-Match does not match', async () => {
    const token = await getAdminToken();

    // Create a province first so we have something to PATCH
    await request(app)
      .post('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Province', code: 'TP' });

    // PATCH with a wrong If-Match value — should be rejected
    const res = await request(app)
      .patch('/api/v1/provinces/TP')
      .set('Authorization', `Bearer ${token}`)
      .set('If-Match', '"wrongetag"')
      .send({ name: 'Updated Province' });

    expect(res.status).toBe(412);
    expect(res.body.code).toBe('412');
  });

  it('should return 200 when If-Match matches the current ETag (valid round-trip)', async () => {
    const token = await getAdminToken();

    // Create a province to work with
    await request(app)
      .post('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Round Trip Province', code: 'RT' });

    // GET to obtain the current ETag
    const getRes = await request(app)
      .get('/api/v1/provinces/RT')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    const etag = getRes.headers['etag'];
    expect(etag).toBeDefined();

    // PATCH with the correct ETag — must succeed (no 412)
    const patchRes = await request(app)
      .patch('/api/v1/provinces/RT')
      .set('Authorization', `Bearer ${token}`)
      .set('If-Match', etag)
      .send({ name: 'Round Trip Province Updated' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.name).toBe('Round Trip Province Updated');
  });
});

// ─── HEAD ─────────────────────────────────────────────────────────────────────

describe('HEAD — collection and individual resources', () => {
  it('should return 200 with headers but no body for HEAD /api/v1/provinces', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .head('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({});
  });

  it('should return 200 with ETag header for HEAD /api/v1/provinces', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .head('/api/v1/provinces')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['etag']).toBeDefined();
  });

  it('should return 200 with headers but no body for HEAD /api/v1/districts', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .head('/api/v1/districts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('should return 200 with headers but no body for HEAD /api/v1/tuktuks', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .head('/api/v1/tuktuks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });
});

// ─── Sorting ─────────────────────────────────────────────────────────────────

describe('Sorting — ?sort=field:asc', () => {
  it('should return provinces sorted by name ascending', async () => {
    const token = await getAdminToken();

    await request(app).post('/api/v1/provinces').set('Authorization', `Bearer ${token}`).send({ name: 'Zulu Province', code: 'ZP' });
    await request(app).post('/api/v1/provinces').set('Authorization', `Bearer ${token}`).send({ name: 'Alpha Province', code: 'AP' });

    const res = await request(app)
      .get('/api/v1/provinces?sort=name:asc&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map(p => p.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it('should return provinces sorted by name descending', async () => {
    const token = await getAdminToken();

    await request(app).post('/api/v1/provinces').set('Authorization', `Bearer ${token}`).send({ name: 'Zulu Province', code: 'ZP' });
    await request(app).post('/api/v1/provinces').set('Authorization', `Bearer ${token}`).send({ name: 'Alpha Province', code: 'AP' });

    const res = await request(app)
      .get('/api/v1/provinces?sort=name:desc&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map(p => p.name);
    const sorted = [...names].sort().reverse();
    expect(names).toEqual(sorted);
  });
});

// ─── Nested Resource Route ────────────────────────────────────────────────────

describe('GET /api/v1/provinces/:code/districts (nested resource)', () => {
  it('should return 200 with paginated districts belonging to the province', async () => {
    const token = await getAdminToken();

    // Seed a province and a district linked to it
    await request(app).post('/api/v1/provinces').set('Authorization', `Bearer ${token}`).send({ name: 'Western', code: 'WP' });
    await request(app).post('/api/v1/districts').set('Authorization', `Bearer ${token}`).send({ name: 'Colombo', code: 'COL', province: 'WP' });

    const res = await request(app)
      .get('/api/v1/provinces/WP/districts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].code).toBe('COL');
  });

  it('should return 404 when province code does not exist', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/api/v1/provinces/UNKNOWN/districts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
