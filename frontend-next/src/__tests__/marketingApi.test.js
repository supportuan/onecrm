/**
 * Tests for services/marketingApi.js
 * Covers: Leads, Campaigns, Dashboard — URL building, HTTP methods, error handling
 */

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: jest.fn(),
  authFetch: jest.fn(),
}));

const authFetch = require('@/lib/api').default;

import {
  getMarketingDashboard,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  assignLeadCounsellor,
  getLeadActivities,
  logLeadActivity,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  associateCampaignLeads,
  launchCampaign,
  getSources,
} from '@/services/marketingApi';

// Helper: mock a successful JSON response
const mockOk = (data) =>
  authFetch.mockResolvedValue({ status: 200, json: async () => data });

beforeEach(() => jest.clearAllMocks());

// ─── Dashboard ───────────────────────────────────────────────
describe('getMarketingDashboard', () => {
  it('calls GET /api/marketing/dashboard and returns json', async () => {
    mockOk({ leads: 10 });
    const result = await getMarketingDashboard();
    expect(authFetch).toHaveBeenCalledWith('/api/marketing/dashboard');
    expect(result).toEqual({ leads: 10 });
  });
});

// ─── Leads ───────────────────────────────────────────────────
describe('getLeads', () => {
  it('calls correct URL with no filters', async () => {
    mockOk({ items: [] });
    await getLeads();
    expect(authFetch).toHaveBeenCalledWith('/api/marketing/leads?');
  });

  it('appends search param when provided', async () => {
    mockOk({ items: [] });
    await getLeads({ search: 'John' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('search=John');
  });

  it('appends status param when provided', async () => {
    mockOk({});
    await getLeads({ status: 'NEW' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('status=NEW');
  });

  it('appends page and limit params', async () => {
    mockOk({});
    await getLeads({ page: 2, limit: 25 });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('page=2');
    expect(url).toContain('limit=25');
  });

  it('ignores null/undefined filters', async () => {
    mockOk({});
    await getLeads({ search: null, status: undefined });
    const [url] = authFetch.mock.calls[0];
    expect(url).not.toContain('search');
    expect(url).not.toContain('status');
  });
});

describe('getLeadById', () => {
  it('calls GET /api/marketing/leads/:id', async () => {
    mockOk({ id: 7 });
    const result = await getLeadById(7);
    expect(authFetch).toHaveBeenCalledWith('/api/marketing/leads/7');
    expect(result).toEqual({ id: 7 });
  });
});

describe('createLead', () => {
  it('calls POST /api/marketing/leads with JSON body', async () => {
    mockOk({ id: 1 });
    const payload = { name: 'Alice', email: 'alice@test.com' };
    await createLead(payload);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/leads',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });
});

describe('updateLead', () => {
  it('calls PUT /api/marketing/leads/:id with JSON body', async () => {
    mockOk({ id: 3 });
    const data = { name: 'Bob Updated' };
    await updateLead(3, data);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/leads/3',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(data),
      })
    );
  });
});

describe('deleteLead', () => {
  it('calls DELETE /api/marketing/leads/:id', async () => {
    mockOk({ deleted: true });
    await deleteLead(5);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/leads/5',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

describe('updateLeadStatus', () => {
  it('calls PATCH /api/marketing/leads/:id/status with status body', async () => {
    mockOk({ status: 'QUALIFIED' });
    await updateLeadStatus(4, 'QUALIFIED');
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/leads/4/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'QUALIFIED' }),
      })
    );
  });
});

describe('assignLeadCounsellor', () => {
  it('calls PATCH /api/marketing/leads/:id/assign-counsellor', async () => {
    mockOk({ counsellorId: 9 });
    await assignLeadCounsellor(2, 9);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/leads/2/assign-counsellor',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ counsellorId: 9 }),
      })
    );
  });
});

describe('getLeadActivities', () => {
  it('calls GET /api/marketing/leads/:id/activities', async () => {
    mockOk([]);
    await getLeadActivities(11);
    expect(authFetch).toHaveBeenCalledWith('/api/marketing/leads/11/activities');
  });
});

describe('logLeadActivity', () => {
  it('calls POST /api/marketing/leads/:id/activities with body', async () => {
    mockOk({ id: 1 });
    const activity = { type: 'EMAIL', note: 'Sent intro email' };
    await logLeadActivity(11, activity);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/leads/11/activities',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(activity),
      })
    );
  });
});

describe('getSources', () => {
  it('calls GET /api/marketing/sources', async () => {
    mockOk([{ id: 1, name: 'Website' }]);
    const result = await getSources();
    expect(authFetch).toHaveBeenCalledWith('/api/marketing/sources');
    expect(result).toEqual([{ id: 1, name: 'Website' }]);
  });
});

// ─── Campaigns ───────────────────────────────────────────────
describe('getCampaigns', () => {
  it('calls GET /api/marketing/campaigns with no filters', async () => {
    mockOk({ items: [] });
    await getCampaigns();
    expect(authFetch).toHaveBeenCalledWith('/api/marketing/campaigns?');
  });

  it('appends type and status filters', async () => {
    mockOk({});
    await getCampaigns({ type: 'EMAIL', status: 'ACTIVE' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('type=EMAIL');
    expect(url).toContain('status=ACTIVE');
  });

  it('appends sortBy and sortOrder params', async () => {
    mockOk({});
    await getCampaigns({ sortBy: 'createdAt', sortOrder: 'desc' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('sortBy=createdAt');
    expect(url).toContain('sortOrder=desc');
  });
});

describe('getCampaignById', () => {
  it('calls GET /api/marketing/campaigns/:id', async () => {
    mockOk({ id: 5, name: 'Summer Push' });
    const result = await getCampaignById(5);
    expect(authFetch).toHaveBeenCalledWith('/api/marketing/campaigns/5');
    expect(result.name).toBe('Summer Push');
  });
});

describe('createCampaign', () => {
  it('calls POST /api/marketing/campaigns with JSON body', async () => {
    mockOk({ id: 1 });
    const payload = { name: 'New Campaign', type: 'EMAIL' };
    await createCampaign(payload);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/campaigns',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });
});

describe('updateCampaign', () => {
  it('calls PUT /api/marketing/campaigns/:id', async () => {
    mockOk({ id: 2 });
    await updateCampaign(2, { name: 'Updated' });
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/campaigns/2',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'Updated' }) })
    );
  });
});

describe('deleteCampaign', () => {
  it('calls DELETE /api/marketing/campaigns/:id', async () => {
    mockOk({ deleted: true });
    await deleteCampaign(3);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/campaigns/3',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

describe('associateCampaignLeads', () => {
  it('calls POST /api/marketing/campaigns/:id/leads with lead data', async () => {
    mockOk({ linked: 3 });
    const leadData = { leadIds: [1, 2, 3] };
    await associateCampaignLeads(10, leadData);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/campaigns/10/leads',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(leadData) })
    );
  });
});

describe('launchCampaign', () => {
  it('calls POST /api/marketing/campaigns/:id/launch with payload', async () => {
    mockOk({ launched: true });
    const payload = { mediaType: 'IMAGE', imageHash: 'abc123' };
    await launchCampaign(7, payload);
    expect(authFetch).toHaveBeenCalledWith(
      '/api/marketing/campaigns/7/launch',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    );
  });

  it('sends empty object when no payload provided', async () => {
    mockOk({ launched: true });
    await launchCampaign(7);
    const [, init] = authFetch.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({});
  });
});
