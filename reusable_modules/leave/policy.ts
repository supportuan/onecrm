import { query } from '@/lib/db/postgres';

export type WfhPolicy = {
  weekly_max_days: number;
  monthly_max_days: number;
  dept_max_concurrent_approved: number;
  approval_levels: number;
  require_remote_clockin_for_approved_wfh: boolean;
  role_overrides: Record<string, Partial<WfhPolicy>>;
  department_overrides: Record<string, Partial<WfhPolicy>>;
};

const DEFAULT_POLICY: WfhPolicy = {
  weekly_max_days: 5,
  monthly_max_days: 12,
  dept_max_concurrent_approved: 3,
  approval_levels: 1,
  require_remote_clockin_for_approved_wfh: false,
  role_overrides: {},
  department_overrides: {},
};

export async function getTenantSettings(tenantId: string): Promise<Record<string, any>> {
  const tenantSettingsRes = await query('SELECT settings FROM tenants WHERE id = $1', [tenantId]);
  const settingsRow = tenantSettingsRes.rows[0]?.settings;
  return typeof settingsRow === 'string' ? JSON.parse(settingsRow) : settingsRow || {};
}

export function resolveWfhPolicy(
  settings: Record<string, any>,
  role: string,
  departmentId?: string | null
): WfhPolicy {
  const base = { ...DEFAULT_POLICY, ...(settings?.wfh_policy || {}) } as WfhPolicy;
  const normalizedRole = (role || '').toUpperCase().replace(/[-\s]/g, '_');
  const roleOverride = base.role_overrides?.[normalizedRole] || {};
  const deptOverride = departmentId ? base.department_overrides?.[departmentId] || {} : {};
  return { ...base, ...roleOverride, ...deptOverride };
}

export function eachDateInclusive(startYmd: string, endYmd: string): string[] {
  const out: string[] = [];
  const start = new Date(`${startYmd}T00:00:00Z`);
  const end = new Date(`${endYmd}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

export function calculateRequestedDays(
  startYmd: string,
  endYmd: string,
  isHalfDay: boolean
): number {
  const dates = eachDateInclusive(startYmd, endYmd);
  if (dates.length <= 0) return 0;
  if (isHalfDay) return 0.5;
  return dates.length;
}

export async function resolveEmployeeContext(
  tenantId: string,
  payload: { internalEmployeeId?: string; userId?: string; email?: string }
): Promise<{ employeeId: string | null; departmentId: string | null }> {
  if (payload.internalEmployeeId) {
    const r = await query(
      `SELECT id, department_id FROM employees WHERE tenant_id = $2
       AND (id::text = $1 OR employee_id::text = $1 OR university_id::text = $1) LIMIT 1`,
      [payload.internalEmployeeId, tenantId]
    );
    if (r.rows[0]) return { employeeId: r.rows[0].id, departmentId: r.rows[0].department_id || null };
  }
  if (payload.userId) {
    const r = await query('SELECT id, department_id FROM employees WHERE user_id = $1::uuid AND tenant_id = $2', [
      payload.userId,
      tenantId,
    ]);
    if (r.rows[0]) return { employeeId: r.rows[0].id, departmentId: r.rows[0].department_id || null };
  }
  if (payload.email) {
    const r = await query('SELECT id, department_id FROM employees WHERE email = $1 AND tenant_id = $2 LIMIT 1', [
      payload.email,
      tenantId,
    ]);
    if (r.rows[0]) return { employeeId: r.rows[0].id, departmentId: r.rows[0].department_id || null };
  }
  return { employeeId: null, departmentId: null };
}

