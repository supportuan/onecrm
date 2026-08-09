import { getTenantContext } from '../../middleware/tenant-context.js';
import { getDefaultTenantId } from '../../utils/tenant-default.js';

/**
 * Resolve tenantId for CRM creates (Student / Application / linked User).
 * Prefer explicit value → request ALS context → actor/default tenant.
 */
export const resolveCrmTenantId = async (
  preferred?: number | null,
  fromUserId?: number | null,
): Promise<number | null> => {
  if (preferred != null && Number.isFinite(Number(preferred))) {
    return Number(preferred);
  }
  const ctx = getTenantContext();
  if (ctx?.tenantId != null) return ctx.tenantId;
  return getDefaultTenantId(fromUserId ?? null);
};
