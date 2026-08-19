export const tenantContextMiddleware = (
  _req: unknown,
  _res: unknown,
  next: () => void,
) => {
  next();
};

export const getTenantContext = () => undefined;
