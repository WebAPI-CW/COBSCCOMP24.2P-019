import { describe, it, expect } from 'vitest';
import { APIError } from '../../src/utils/apiError.js';

describe('APIError', () => {
  it('should be an instance of Error', () => {
    const err = new APIError(404, 'Not Found', 'Resource does not exist');
    expect(err instanceof Error).toBe(true);
  });

  it('should correctly set statusCode, message and description', () => {
    const err = new APIError(400, 'Bad Request', 'Validation failed');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad Request');
    expect(err.description).toBe('Validation failed');
  });

  it('should default moreInfo to empty string when not provided', () => {
    const err = new APIError(500, 'Internal Server Error', 'Something broke');
    expect(err.moreInfo).toBe('');
  });

  it('should accept a custom moreInfo value', () => {
    const err = new APIError(401, 'Unauthorized', 'Token expired', 'https://docs.example.com/auth');
    expect(err.moreInfo).toBe('https://docs.example.com/auth');
  });

  it('should work for all standard HTTP error codes', () => {
    const codes = [400, 401, 403, 404, 409, 422, 429, 500];
    codes.forEach(code => {
      const err = new APIError(code, 'Error', 'desc');
      expect(err.statusCode).toBe(code);
    });
  });
});
