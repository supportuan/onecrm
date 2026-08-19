import { Response } from 'express';

const omitTenantIdDeep = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value == null || typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => omitTenantIdDeep(item, seen));
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'tenantId') continue;
    out[key] = omitTenantIdDeep(nested, seen);
  }
  return out;
};

export const sendSuccess = (res: Response, message: string, data: any = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: omitTenantIdDeep(data),
  });
};

export const sendError = (res: Response, message: string, errors: any = null, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
