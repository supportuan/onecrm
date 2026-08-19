/** Multi-tenant administration APIs are retired. Routes return 410. */

export const createTenant = async (_input: unknown): Promise<{ tenant: { id: number } }> => {
  throw new Error('Multi-tenant administration has been removed');
};

export const seedHrDefaults = async () => {
  const { seedHrDefaults: seed } = await import('./hr-seed-backfill.js');
  return seed();
};

export const listTenants = async () => [];
export const getTenant = async (_id: number) => {
  throw new Error('Multi-tenant administration has been removed');
};
export const updateTenant = async (_id: number, _data: unknown) => {
  throw new Error('Multi-tenant administration has been removed');
};
export const setTenantModules = async (_id: number, _modules: unknown) => {
  throw new Error('Multi-tenant administration has been removed');
};
export const updateTenantModules = setTenantModules;
export const uploadTenantLogo = async (_id: number, _fileUrl: string) => {
  throw new Error('Multi-tenant administration has been removed');
};
export const resetAdminPassword = async (
  _id: number,
  _password?: string,
): Promise<{ email: string }> => {
  throw new Error('Multi-tenant administration has been removed');
};
export const resetPrimaryAdminPassword = resetAdminPassword;
