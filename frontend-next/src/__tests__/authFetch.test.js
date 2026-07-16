/**
 * Tests for lib/api.js — authFetch
 * Covers: token attachment, 401 refresh flow, session expiry
 */
import { authFetch } from '@/lib/api';

// Mock dependencies
jest.mock('@/lib/apiService', () => ({
  refreshAuthToken: jest.fn(),
}));
jest.mock('@/lib/auth/session', () => ({
  getAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
  expireSession: jest.fn(),
}));

const { refreshAuthToken } = require('@/lib/apiService');
const { getAccessToken, setAccessToken, expireSession } = require('@/lib/auth/session');

// Suppress localStorage not defined in node
beforeAll(() => {
  global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; },
    clear() { this._store = {}; },
  };
  global.window = global; // make `typeof window !== 'undefined'` pass
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  localStorage.clear();
});

describe('authFetch', () => {
  it('attaches Bearer token when accessToken is present', async () => {
    getAccessToken.mockReturnValue('tok_abc');
    fetch.mockResolvedValue({ status: 200, json: async () => ({}) });

    await authFetch('/api/test');

    expect(fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok_abc' }),
      })
    );
  });

  it('does not attach Authorization header when no accessToken', async () => {
    getAccessToken.mockReturnValue(null);
    fetch.mockResolvedValue({ status: 200 });

    await authFetch('/api/test');

    const [, init] = fetch.mock.calls[0];
    expect(init.headers?.Authorization).toBeUndefined();
  });

  it('returns response directly when status is not 401', async () => {
    getAccessToken.mockReturnValue('tok');
    const mockRes = { status: 200, json: async () => ({ data: 'ok' }) };
    fetch.mockResolvedValue(mockRes);

    const result = await authFetch('/api/test');
    expect(result).toBe(mockRes);
  });

  it('attempts token refresh on 401 and retries request', async () => {
    getAccessToken.mockReturnValue('old_token');
    localStorage.setItem('refreshToken', 'ref_tok');

    const fresh = { status: 200 };
    fetch
      .mockResolvedValueOnce({ status: 401 })   // first call → 401
      .mockResolvedValueOnce(fresh);             // retry → success

    refreshAuthToken.mockResolvedValue({
      data: { accessToken: 'new_access', refreshToken: 'new_refresh' },
    });

    const result = await authFetch('/api/secure');

    expect(refreshAuthToken).toHaveBeenCalledWith('ref_tok');
    expect(setAccessToken).toHaveBeenCalledWith('new_access');
    expect(localStorage.getItem('accessToken')).toBe('new_access');
    expect(localStorage.getItem('refreshToken')).toBe('new_refresh');
    expect(result).toBe(fresh);
  });

  it('expires session and returns original 401 when no refreshToken', async () => {
    getAccessToken.mockReturnValue('tok');
    const res401 = { status: 401 };
    fetch.mockResolvedValue(res401);
    localStorage.setItem('refreshToken', '');

    const result = await authFetch('/api/secure');

    expect(expireSession).toHaveBeenCalled();
    expect(result).toBe(res401);
  });

  it('expires session when refresh response has no new accessToken', async () => {
    getAccessToken.mockReturnValue('tok');
    localStorage.setItem('refreshToken', 'ref');
    fetch.mockResolvedValue({ status: 401 });
    refreshAuthToken.mockResolvedValue({ data: {} }); // no accessToken

    await authFetch('/api/secure');

    expect(expireSession).toHaveBeenCalled();
  });

  it('expires session when retry returns another 401', async () => {
    getAccessToken.mockReturnValue('tok');
    localStorage.setItem('refreshToken', 'ref');

    fetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 401 });

    refreshAuthToken.mockResolvedValue({
      data: { accessToken: 'new', refreshToken: 'ref2' },
    });

    await authFetch('/api/secure');

    expect(expireSession).toHaveBeenCalled();
  });

  it('expires session when refreshAuthToken throws', async () => {
    getAccessToken.mockReturnValue('tok');
    localStorage.setItem('refreshToken', 'ref');
    fetch.mockResolvedValue({ status: 401 });
    refreshAuthToken.mockRejectedValue(new Error('network'));

    await authFetch('/api/secure');

    expect(expireSession).toHaveBeenCalled();
  });

  it('passes through extra init options (method, body, headers)', async () => {
    getAccessToken.mockReturnValue('tok');
    fetch.mockResolvedValue({ status: 200 });

    await authFetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });

    const [, init] = fetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'Test' }));
    expect(init.headers['Content-Type']).toBe('application/json');
  });
});
