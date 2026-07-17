/**
 * Tests for services/userApi.js
 * Covers: getUsers, registerUser, createUser, updateUser, deleteUser, getCounsellors
 */

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: jest.fn(),
  authFetch: jest.fn(),
}));

const authFetch = require('@/lib/api').default;

beforeAll(() => {
  global.fetch = jest.fn(); // registerUser uses raw fetch
});

import {
  getUsers,
  registerUser,
  createUser,
  updateUser,
  deleteUser,
  getCounsellors,
} from '@/services/userApi';

const BASE = '/api/users';

// Helper for ok responses
const okAuth = (data) =>
  authFetch.mockResolvedValue({ ok: true, json: async () => data });

const okFetch = (data) =>
  fetch.mockResolvedValue({ ok: true, json: async () => data });

// handleResponse in userApi returns { success: false, message } instead of throwing
const errAuth = (status, message = 'Bad request') =>
  authFetch.mockResolvedValue({
    ok: false,
    json: async () => ({ message }),
    status,
  });

beforeEach(() => jest.clearAllMocks());

// ─── getUsers ─────────────────────────────────────────────────
describe('getUsers', () => {
  it('calls GET /api/users without role param', async () => {
    okAuth({ data: [] });
    await getUsers();
    expect(authFetch).toHaveBeenCalledWith('/api/users');
  });

  it('appends role param when role is provided', async () => {
    okAuth({ data: [] });
    await getUsers('COUNSELLOR');
    expect(authFetch).toHaveBeenCalledWith('/api/users?role=COUNSELLOR');
  });

  it('returns data from handleResponse', async () => {
    const users = [{ id: 1, fullName: 'Admin' }];
    okAuth(users);
    const result = await getUsers();
    expect(result).toEqual(users);
  });

  it('returns { success: false, message } on error response', async () => {
    errAuth(403, 'Forbidden');
    const result = await getUsers();
    expect(result).toEqual({ success: false, message: 'Forbidden' });
  });
});

// ─── registerUser ─────────────────────────────────────────────
describe('registerUser', () => {
  it('calls plain fetch (not authFetch) at /api/users/register', async () => {
    okFetch({ success: true, data: { id: 1 } });
    const payload = { fullName: 'Alice', email: 'alice@test.com', password: 'pass123', role: 'STUDENT' };
    await registerUser(payload);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/register`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    expect(authFetch).not.toHaveBeenCalled();
  });

  it('returns the parsed JSON on success', async () => {
    okFetch({ id: 5, email: 'alice@test.com' });
    const result = await registerUser({ email: 'alice@test.com' });
    expect(result).toEqual({ id: 5, email: 'alice@test.com' });
  });
});

// ─── createUser ───────────────────────────────────────────────
describe('createUser', () => {
  it('calls POST /api/users with JSON body', async () => {
    okAuth({ id: 3 });
    const userData = { fullName: 'Bob', email: 'bob@test.com', role: 'COUNSELLOR' };
    await createUser(userData);

    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(BASE);
    expect(init.method).toBe('POST');
    const sent = JSON.parse(init.body);
    expect(sent.fullName).toBe('Bob');
    expect(sent.email).toBe('bob@test.com');
  });

  it('generates a random password when none is supplied', async () => {
    okAuth({ id: 4 });
    await createUser({ fullName: 'Carol', email: 'carol@test.com' });
    const [, init] = authFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(typeof body.password).toBe('string');
    expect(body.password.length).toBeGreaterThan(0);
  });

  it('uses provided password when supplied', async () => {
    okAuth({ id: 4 });
    await createUser({ fullName: 'Dave', email: 'dave@test.com', password: 'secret123' });
    const [, init] = authFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.password).toBe('secret123');
  });

  it('returns { success: false } on non-ok response', async () => {
    errAuth(409, 'Email already exists');
    const result = await createUser({ email: 'dup@test.com' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Email already exists');
  });
});

// ─── updateUser ───────────────────────────────────────────────
describe('updateUser', () => {
  it('calls PUT /api/users/:id with JSON body', async () => {
    okAuth({ id: 2 });
    const updates = { fullName: 'Alice Updated', isActive: false };
    await updateUser(2, updates);

    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/2`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual(updates);
  });

  it('returns { success: false, message } on error', async () => {
    errAuth(404, 'User not found');
    const result = await updateUser(999, {});
    expect(result).toEqual({ success: false, message: 'User not found' });
  });
});

// ─── deleteUser ───────────────────────────────────────────────
describe('deleteUser', () => {
  it('calls DELETE /api/users/:id', async () => {
    okAuth({ deleted: true });
    await deleteUser(7);

    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/7`);
    expect(init.method).toBe('DELETE');
  });

  it('returns { success: false } when user not found', async () => {
    errAuth(404, 'User not found');
    const result = await deleteUser(9999);
    expect(result.success).toBe(false);
  });
});

// ─── getCounsellors ───────────────────────────────────────────
describe('getCounsellors', () => {
  it('calls GET /api/counsellors', async () => {
    okAuth([{ id: 1, fullName: 'Counsellor A' }]);
    const result = await getCounsellors();
    expect(authFetch).toHaveBeenCalledWith('/api/counsellors');
    expect(result).toEqual([{ id: 1, fullName: 'Counsellor A' }]);
  });

  it('returns { success: false } on error', async () => {
    errAuth(500, 'Internal Server Error');
    const result = await getCounsellors();
    expect(result.success).toBe(false);
  });
});
