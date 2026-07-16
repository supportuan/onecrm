/**
 * Tests for services/studentCrmApi.js
 * Covers: Students, Applications, Documents, Payments, Lead→App, Checklists
 */

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: jest.fn(),
  authFetch: jest.fn(),
}));

const authFetch = require('@/lib/api').default;

// Mock localStorage for tenantFetch
beforeAll(() => {
  global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = String(v); },
    clear() { this._store = {}; },
  };
  global.window = global;
});

import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  advanceApplicationStage,
  addDocument,
  updateDocument,
  deleteDocument,
  getChecklist,
  getProcessStages,
  listStudentChecklists,
  updateChecklistValue,
  listMyPayments,
  getPaymentReceipt,
  createPaymentOrder,
  verifyPayment,
  convertLeadToApplication,
  listPromotableLeads,
  promoteLead,
  getStatistics,
  getMyStudent,
  updateMyStudent,
  patchStudentStatus,
  setStudentEnrolled,
} from '@/services/studentCrmApi';

const BASE = '/api/student-crm';

// Helper: successful response
const ok = (data) =>
  authFetch.mockResolvedValue({ ok: true, json: async () => data });

// Helper: error response
const err = (status = 400, message = 'Error') =>
  authFetch.mockResolvedValue({
    ok: false,
    json: async () => ({ message }),
  });

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('tenantId', 'test-tenant');
});

// ─── handleResponse ───────────────────────────────────────────
describe('handleResponse error handling', () => {
  it('throws an error with server message on non-ok response', async () => {
    err(400, 'Student not found');
    await expect(getStudent(99)).rejects.toThrow('Student not found');
  });

  it('throws a fallback HTTP error when no message in body', async () => {
    authFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(getStudent(99)).rejects.toThrow(/HTTP error/);
  });

  it('throws when json parsing itself fails', async () => {
    authFetch.mockResolvedValue({ ok: false, json: async () => { throw new Error('bad json'); } });
    await expect(getStudent(99)).rejects.toThrow();
  });
});

// ─── Students ────────────────────────────────────────────────
describe('listStudents', () => {
  it('calls GET /students with no params when none provided', async () => {
    ok([]);
    await listStudents();
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/students`);
  });

  it('appends search param', async () => {
    ok([]);
    await listStudents({ search: 'Alice' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('search=Alice');
  });

  it('appends limit param', async () => {
    ok([]);
    await listStudents({ limit: 20 });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('limit=20');
  });
});

describe('getStudent', () => {
  it('calls GET /students/:id', async () => {
    ok({ id: 1 });
    await getStudent(1);
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students/1`);
  });
});

describe('createStudent', () => {
  it('calls POST /students with JSON body', async () => {
    ok({ id: 5 });
    const payload = { fullName: 'Alice', email: 'alice@test.com' };
    await createStudent(payload);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});

describe('updateStudent', () => {
  it('calls PUT /students/:id with JSON body', async () => {
    ok({ id: 5 });
    await updateStudent(5, { fullName: 'Alice B' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students/5`);
    expect(init.method).toBe('PUT');
  });
});

describe('patchStudentStatus', () => {
  it('calls /students/:id/status with status payload', async () => {
    ok({ id: 5 });
    await patchStudentStatus(5, { status: 'ACTIVE' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students/5/status`);
    // Service spreads json() helper which sets method:'POST' internally
    expect(JSON.parse(init.body)).toEqual({ status: 'ACTIVE' });
  });
});

describe('setStudentEnrolled', () => {
  it('calls /students/:id/enrolled with isEnrolled body', async () => {
    ok({});
    await setStudentEnrolled(5, true);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students/5/enrolled`);
    // Service spreads json() helper which sets method:'POST' internally
    expect(JSON.parse(init.body)).toEqual({ isEnrolled: true });
  });
});

// ─── Applications ────────────────────────────────────────────
describe('listApplications', () => {
  it('calls GET /applications with no params', async () => {
    ok([]);
    await listApplications();
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/applications`);
  });

  it('appends studentId and stage params', async () => {
    ok([]);
    await listApplications({ studentId: 3, stage: 'APPLIED' });
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('studentId=3');
    expect(url).toContain('stage=APPLIED');
  });
});

describe('getApplication', () => {
  it('calls GET /applications/:id', async () => {
    ok({ id: 2 });
    await getApplication(2);
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/2`);
  });
});

describe('createApplication', () => {
  it('calls POST /applications with JSON body', async () => {
    ok({ id: 10 });
    const payload = { studentId: 1, university: 'Oxford' };
    await createApplication(payload);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});

describe('updateApplication', () => {
  it('calls PUT /applications/:id', async () => {
    ok({ id: 10 });
    await updateApplication(10, { stage: 'CONDITIONAL_OFFER' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/10`);
    expect(init.method).toBe('PUT');
  });
});

describe('advanceApplicationStage', () => {
  it('calls POST /applications/:id/advance', async () => {
    ok({ stage: 'INTERVIEW' });
    await advanceApplicationStage(3, { stage: 'INTERVIEW' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/3/advance`);
    expect(init.method).toBe('POST');
  });
});

// ─── Documents ───────────────────────────────────────────────
describe('addDocument', () => {
  it('calls POST /applications/:id/documents', async () => {
    ok({ id: 1 });
    await addDocument(5, { type: 'PASSPORT' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/5/documents`);
    expect(init.method).toBe('POST');
  });
});

describe('updateDocument', () => {
  it('calls PUT /applications/:appId/documents/:docId', async () => {
    ok({ id: 1 });
    await updateDocument(5, 2, { status: 'VERIFIED' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/5/documents/2`);
    expect(init.method).toBe('PUT');
  });
});

describe('deleteDocument', () => {
  it('calls DELETE /applications/:appId/documents/:docId', async () => {
    ok({});
    await deleteDocument(5, 2);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/5/documents/2`);
    expect(init.method).toBe('DELETE');
  });
});

// ─── Checklist & Process Stages ──────────────────────────────
describe('getChecklist', () => {
  it('calls GET /checklist?country=IN', async () => {
    ok([]);
    await getChecklist('IN');
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain(`${BASE}/checklist`);
    expect(url).toContain('country=IN');
  });

  it('appends university when provided', async () => {
    ok([]);
    await getChecklist('IN', 'Oxford');
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('university=Oxford');
  });
});

describe('getProcessStages', () => {
  it('calls GET /process-stages?country=UK', async () => {
    ok([]);
    await getProcessStages('UK');
    const [url] = authFetch.mock.calls[0];
    expect(url).toContain('country=UK');
  });

  it('calls GET /process-stages with no params when country is absent', async () => {
    ok([]);
    await getProcessStages();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/process-stages`);
  });
});

describe('listStudentChecklists', () => {
  it('calls GET /students/:id/checklists', async () => {
    ok([]);
    await listStudentChecklists(7);
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students/7/checklists`);
  });
});

describe('updateChecklistValue', () => {
  it('calls PUT /students/:id/checklists/:checkListId', async () => {
    ok({});
    await updateChecklistValue(7, 3, { value: 'YES' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students/7/checklists/3`);
    expect(init.method).toBe('PUT');
  });
});

// ─── Payments ────────────────────────────────────────────────
describe('listMyPayments', () => {
  it('calls GET /payments/me', async () => {
    ok([]);
    await listMyPayments();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/payments/me`);
  });
});

describe('getPaymentReceipt', () => {
  it('calls GET /payments/:id/receipt', async () => {
    ok({ receipt: 'pdf' });
    await getPaymentReceipt(42);
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/payments/42/receipt`);
  });
});

describe('createPaymentOrder', () => {
  it('calls POST /applications/:appId/payments/create-order with feeId', async () => {
    ok({ orderId: 'ord_123' });
    await createPaymentOrder(10, 5);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/10/payments/create-order`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ feeId: 5 });
  });
});

describe('verifyPayment', () => {
  it('calls POST /applications/:id/payments/verify with payload', async () => {
    ok({ success: true });
    const payload = { razorpay_payment_id: 'pay_xyz', razorpay_signature: 'sig' };
    await verifyPayment(10, payload);
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/10/payments/verify`);
    expect(JSON.parse(init.body)).toEqual(payload);
  });
});

// ─── Lead → Application ───────────────────────────────────────
describe('convertLeadToApplication', () => {
  it('calls POST /applications/from-lead/:leadId with payload', async () => {
    ok({ id: 11 });
    await convertLeadToApplication(33, { university: 'MIT' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/applications/from-lead/33`);
    expect(init.method).toBe('POST');
  });
});

describe('listPromotableLeads', () => {
  it('calls GET /leads/promotable', async () => {
    ok([]);
    await listPromotableLeads();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/leads/promotable`);
  });
});

describe('promoteLead', () => {
  it('calls POST /leads/:id/promote', async () => {
    ok({ promoted: true });
    await promoteLead(15, { note: 'Moving forward' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/leads/15/promote`);
    expect(init.method).toBe('POST');
  });

  it('promotes with empty payload by default', async () => {
    ok({});
    await promoteLead(15);
    const [, init] = authFetch.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({});
  });
});

// ─── Statistics & Student Profile ────────────────────────────
describe('getStatistics', () => {
  it('calls GET /statistics', async () => {
    ok({ total: 5 });
    await getStatistics();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/statistics`);
  });
});

describe('getMyStudent', () => {
  it('calls GET /students/me', async () => {
    ok({ id: 1 });
    await getMyStudent();
    const [url] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students/me`);
  });
});

describe('updateMyStudent', () => {
  it('calls PUT /students/me with payload', async () => {
    ok({ id: 1 });
    await updateMyStudent({ phone: '9999999999' });
    const [url, init] = authFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/students/me`);
    expect(init.method).toBe('PUT');
  });
});
