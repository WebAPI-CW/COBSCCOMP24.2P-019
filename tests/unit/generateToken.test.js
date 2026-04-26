import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import generateToken from '../../src/utils/generateToken.js';

beforeAll(() => {
  // Ensure env vars are set for this test file
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_unit_tests';
  process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
});

describe('generateToken', () => {
  it('should return a non-empty string', () => {
    const token = generateToken('507f1f77bcf86cd799439011', 'HQ_ADMIN');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should produce a valid JWT that can be decoded', () => {
    const token = generateToken('507f1f77bcf86cd799439011', 'HQ_ADMIN');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded).toBeDefined();
  });

  it('should embed the correct id in the token payload', () => {
    const id = '507f1f77bcf86cd799439011';
    const token = generateToken(id, 'STATION');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(id);
  });

  it('should embed the correct role in the token payload', () => {
    const token = generateToken('507f1f77bcf86cd799439011', 'PROVINCIAL');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.role).toBe('PROVINCIAL');
  });

  it('should produce different tokens for different users', () => {
    const token1 = generateToken('507f1f77bcf86cd799439011', 'HQ_ADMIN');
    const token2 = generateToken('507f1f77bcf86cd799439012', 'STATION');
    expect(token1).not.toBe(token2);
  });
});
