import { describe, it, expect } from 'vitest';
import { createUser, updateUser, getUserById, getAllUsers } from '../../src/services/userService.js';
import { APIError } from '../../src/utils/apiError.js';

describe('UserService — createUser', () => {
  it('should create a new user and return the user object without password', async () => {
    const user = await createUser({
      name: 'Test Admin',
      email: 'admin_create@test.com',
      password: 'Test@1234',
      role: 'HQ_ADMIN'
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('admin_create@test.com');
    expect(user.role).toBe('HQ_ADMIN');
    expect(user.password).toBeUndefined(); // Should be excluded
  });

  it('should throw APIError 409 if email already exists', async () => {
    await createUser({ name: 'A', email: 'dup_user@test.com', password: 'Test@1234', role: 'STATION' });

    await expect(
      createUser({ name: 'B', email: 'dup_user@test.com', password: 'Test@1234', role: 'STATION' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('UserService — updateUser', () => {
  it('should update user fields and return user without password', async () => {
    const user = await createUser({
      name: 'Old Name',
      email: 'update_user@test.com',
      password: 'Test@1234',
      role: 'STATION'
    });

    const updated = await updateUser(user._id, { name: 'New Name', isActive: false });
    expect(updated.name).toBe('New Name');
    expect(updated.isActive).toBe(false);
    expect(updated.password).toBeUndefined();
  });

  it('should throw 400 if updating isActive to the same state', async () => {
    const user = await createUser({
      name: 'Test',
      email: 'same_state@test.com',
      password: 'Test@1234',
      role: 'STATION'
    });

    await expect(updateUser(user._id, { isActive: true })).rejects.toMatchObject({ statusCode: 400 });
  });
});
