/**
 * Tests for services/agencyCrmApi.js
 * Covers: Partners, Statistics, Leads, Applications, Commissions, Referrals, Documents
 */

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: jest.fn(),
  authFetch: jest.fn(),
}));

const authFetch = require('@/lib/api').default;

beforeAll(() => {
  global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = String(v); },
    clear() { this._store = {}; },
  };
  global.window = global;
  // global.fetch is needed for resolvePublicReferralCode which calls fetch directly
  global.fetch = jest.fn();
});

import {
  getStatistics,
  listPartners,
  getPartner,
  getMyPartner,
  createPartner,
  updatePartner,
  updatePartnerStatus,
  listAgencyLeads,
  listAgencyApplications,
  listCommissions,
  getCommissionStatement,
  createCommission,
  updateCommission,
  listCommissionRules,
  saveCommissionRule,
  deleteCommissionRule,
  listPartnerDocuments,
  listPartnerActivities,
  logPartnerActivity,
  createReferral,
  resolvePublicReferralCode,
  sendAgentBroadcast,
  advanceOnboarding,
  signAgreement,
} from '@/services/agencyCrmApi';

const BASE = '/api/agency-crm';

const ok = (data) =>
  authFetch.mockResolvedValue({ ok: true, json: async () => data });

const okFetch = (data) =>
  fetch.mockResolvedValue({ ok: true, json: async () => data });

const err = (msg = 'Error') =>
  authFetch.mockResolvedValue({ ok: false, json: async () => ({ message: msg }) });

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('tenantId', 'test-tenant');
});

// ─── Error handling ───────────────────────────────────────────
describe('handleResponse error handling', () => {
  it('throws with server message on non-ok response', async () => {
    err('Partner not found');
    await expect(getPartner(99)).rejects.toThrow('Partner not found');
  });

  it('throws fallback HTTP error when body has no message', async () => {
    authFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(getPartner(99)).rejects.toThrow(/HTTP error/);
  });
});

// ─── Statistics ───────────────────────────────────────────────
describe('getStatistics', () => {
  it('calls GET /statistics with no params', async () => {
    ok({ totalReferrals: 5 });
    await getStatistics();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/statistics`);
  });

  it('appends agencyPartnerId when provided', async () => {
    ok({});
    await getStatistics({ agencyPartnerId: 7 });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('agencyPartnerId=7');
  });
});

// ─── Partners ─────────────────────────────────────────────────
describe('listPartners', () => {
  it('calls GET /partners with no filters', async () => {
    ok([]);
    await listPartners();
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/partners`);
  });

  it('appends search and status params', async () => {
    ok([]);
    await listPartners({ search: 'Acme', status: 'ACTIVE' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('search=Acme');
    expect(url).toContain('status=ACTIVE');
  });
});

describe('getPartner', () => {
  it('calls GET /partners/:id', async () => {
    ok({ id: 1 });
    await getPartner(1);
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/1`);
  });
});

describe('getMyPartner', () => {
  it('calls GET /partners/me', async () => {
    ok({ id: 5 });
    await getMyPartner();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/me`);
  });
});

describe('createPartner', () => {
  it('calls POST /partners with JSON body', async () => {
    ok({ id: 10 });
    const payload = { agencyName: 'Acme', email: 'acme@test.com' };
    await createPartner(payload);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});

describe('updatePartner', () => {
  it('calls PUT /partners/:id with JSON body', async () => {
    ok({ id: 1 });
    await updatePartner(1, { agencyName: 'Updated' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/1`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ agencyName: 'Updated' });
  });
});

describe('updatePartnerStatus', () => {
  it('calls PUT /partners/:id/status with status body', async () => {
    ok({ id: 1, status: 'ACTIVE' });
    await updatePartnerStatus(1, 'ACTIVE');
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/1/status`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ status: 'ACTIVE' });
  });
});

describe('advanceOnboarding', () => {
  it('calls POST /partners/:id/onboarding with stage', async () => {
    ok({});
    await advanceOnboarding(2, 'DOCS_UPLOADED');
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/2/onboarding`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ stage: 'DOCS_UPLOADED' });
  });
});

describe('signAgreement', () => {
  it('calls POST /partners/:id/sign-agreement', async () => {
    ok({});
    await signAgreement(3);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/3/sign-agreement`);
    expect(init.method).toBe('POST');
  });
});

// ─── Agency Leads ──────────────────────────────────────────────
describe('listAgencyLeads', () => {
  it('calls GET /leads with no params', async () => {
    ok({ items: [] });
    await listAgencyLeads();
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/leads`);
  });

  it('appends page, limit and search params', async () => {
    ok({});
    await listAgencyLeads({ page: 2, limit: 10, search: 'Bob' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
    expect(url).toContain('search=Bob');
  });

  it('appends agencyPartnerId param', async () => {
    ok({});
    await listAgencyLeads({ agencyPartnerId: 5 });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('agencyPartnerId=5');
  });
});

// ─── Agency Applications ───────────────────────────────────────
describe('listAgencyApplications', () => {
  it('calls GET /applications with no params', async () => {
    ok({ items: [] });
    await listAgencyApplications();
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/applications`);
  });

  it('appends agencyPartnerId and search', async () => {
    ok({});
    await listAgencyApplications({ agencyPartnerId: 3, search: 'MIT' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('agencyPartnerId=3');
    expect(url).toContain('search=MIT');
  });
});

// ─── Commissions ──────────────────────────────────────────────
describe('listCommissions', () => {
  it('calls GET /commissions with no params', async () => {
    ok({ items: [] });
    await listCommissions();
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/commissions`);
  });

  it('appends status and agencyPartnerId params', async () => {
    ok({});
    await listCommissions({ status: 'PAID', agencyPartnerId: 4 });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('status=PAID');
    expect(url).toContain('agencyPartnerId=4');
  });
});

describe('getCommissionStatement', () => {
  it('calls GET /commissions/statement with period', async () => {
    ok({ total: 1000 });
    await getCommissionStatement({ agencyPartnerId: 2, period: '2025-01' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/commissions/statement`);
    expect(url).toContain('period=2025-01');
  });
});

describe('createCommission', () => {
  it('calls POST /commissions with JSON body', async () => {
    ok({ id: 1 });
    const payload = { agencyPartnerId: 1, amount: 500 };
    await createCommission(payload);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/commissions`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});

describe('updateCommission', () => {
  it('calls PUT /commissions/:id with payload', async () => {
    ok({ id: 3 });
    await updateCommission(3, { status: 'APPROVED' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/commissions/3`);
    expect(init.method).toBe('PUT');
  });
});

// ─── Commission Rules ─────────────────────────────────────────
describe('listCommissionRules', () => {
  it('calls GET /commission-rules with agencyPartnerId', async () => {
    ok([]);
    await listCommissionRules(2);
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/commission-rules`);
    expect(url).toContain('agencyPartnerId=2');
  });

  it('calls without param when agencyPartnerId is absent', async () => {
    ok([]);
    await listCommissionRules();
    const [url] = authFetch.mock.calls[0];
    expect(url).not.toContain('agencyPartnerId');
  });
});

describe('saveCommissionRule', () => {
  it('calls POST /commission-rules with payload', async () => {
    ok({ id: 1 });
    await saveCommissionRule({ rate: 10, type: 'FLAT' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/commission-rules`);
    expect(init.method).toBe('POST');
  });
});

describe('deleteCommissionRule', () => {
  it('calls DELETE /commission-rules/:id', async () => {
    ok({});
    await deleteCommissionRule(5);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/commission-rules/5`);
    expect(init.method).toBe('DELETE');
  });
});

// ─── Partner Documents & Activities ────────────────────────────
describe('listPartnerDocuments', () => {
  it('calls GET /partners/:id/documents', async () => {
    ok([]);
    await listPartnerDocuments(1);
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/1/documents`);
  });
});

describe('listPartnerActivities', () => {
  it('calls GET /partners/:id/activities', async () => {
    ok([]);
    await listPartnerActivities(2);
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/2/activities`);
  });
});

describe('logPartnerActivity', () => {
  it('calls POST /partners/:id/activities with payload', async () => {
    ok({ id: 1 });
    await logPartnerActivity(3, { type: 'CALL', note: 'Discussed onboarding' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/partners/3/activities`);
    expect(init.method).toBe('POST');
  });
});

// ─── Referrals ─────────────────────────────────────────────────
describe('createReferral', () => {
  it('calls POST /referrals with payload', async () => {
    ok({ id: 1 });
    const payload = { agencyPartnerId: 1, leadId: 5 };
    await createReferral(payload);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/referrals`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});

describe('resolvePublicReferralCode', () => {
  it('calls public fetch (no auth) for referral code', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ agencyName: 'Acme' }) });
    const result = await resolvePublicReferralCode('REF-123');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/agency-crm/public/referral/REF-123')
    );
    expect(result).toEqual({ agencyName: 'Acme' });
  });
});

// ─── Broadcasts ────────────────────────────────────────────────
describe('sendAgentBroadcast', () => {
  it('calls POST /broadcasts with payload', async () => {
    ok({ sent: true });
    await sendAgentBroadcast({ message: 'Hello agents!' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/broadcasts`);
    expect(init.method).toBe('POST');
  });
});
