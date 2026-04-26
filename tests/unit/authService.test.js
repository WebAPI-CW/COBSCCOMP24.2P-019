import { describe, it, expect } from 'vitest';
import { loginUser, getUserById } from '../../src/services/authService.js';
import { createUser } from '../../src/services/userService.js';
import { APIError } from '../../src/utils/apiError.js';


describe('AuthService — loginUser', () => {
  it('should return the user when credentials are correct', async () => {
    await createUser({ name: 'Login User', email: 'login@test.com', password: 'Test@1234', role: 'STATION' });

    const user = await loginUser('login@test.com', 'Test@1234');
    expect(user).toBeDefined();
    expect(user.email).toBe('login@test.com');
  });

  it('should throw APIError 401 for wrong password', async () => {
    await createUser({ name: 'Login User', email: 'wrong@test.com', password: 'Test@1234', role: 'STATION' });

    await expect(
      loginUser('wrong@test.com', 'WrongPassword')
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('should throw APIError 401 for non-existent email', async () => {
    await expect(
      loginUser('nobody@test.com', 'Test@1234')
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('AuthService — getUserById', () => {
  it('should return a user with populated fields, without password', async () => {
    const created = await createUser({ name: 'Get Me', email: 'getme@test.com', password: 'Test@1234', role: 'STATION' });
    const user = await getUserById(created._id);

    expect(user).toBeDefined();
    expect(user.email).toBe('getme@test.com');
    // Password and __v must be excluded
    expect(user.password).toBeUndefined();
    expect(user.__v).toBeUndefined();
  });

  it('should throw APIError 404 for non-existent ID', async () => {
    const fakeId = '000000000000000000000000';
    await expect(getUserById(fakeId)).rejects.toMatchObject({ statusCode: 404 });
  });
});
