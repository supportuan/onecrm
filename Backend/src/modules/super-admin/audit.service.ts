export const logSuperAdminAction = async (
  _actorId: number,
  _action: string,
  _targetTenantId?: number | null,
  _payload?: unknown,
): Promise<void> => {
  /* multi-tenant admin audit log removed */
};

export const listAudits = async (_limit = 200) => [];
