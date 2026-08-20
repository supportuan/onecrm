'use client';

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { ROLE_PERMISSIONS, ALL_PERMISSIONS, SYSTEM_ROLES } from './rbac';
import { userCan } from './module-access';

const RBAC_BASE = '/api/rbac';

const PermissionsContext = createContext({
  permissionMap: ROLE_PERMISSIONS,
  catalog: ALL_PERMISSIONS,
  systemRoles: SYSTEM_ROLES,
  loading: true,
  can: () => false,
  refresh: async () => {},
  updateRole: async () => {},
  createRole: async () => {},
  deleteRole: async () => {},
  reset: async () => {},
});

export const PermissionsProvider = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [permissionMap, setPermissionMap] = useState(ROLE_PERMISSIONS);
  const [catalog, setCatalog] = useState(ALL_PERMISSIONS);
  const [systemRoles, setSystemRoles] = useState(SYSTEM_ROLES);
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );

  const applyPayload = useCallback((data) => {
    if (data?.roles) setPermissionMap(data.roles);
    if (Array.isArray(data?.catalog) && data.catalog.length) {
      setCatalog(data.catalog);
    }
    if (Array.isArray(data?.systemRoles) && data.systemRoles.length) {
      setSystemRoles(new Set(data.systemRoles));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setPermissionMap(ROLE_PERMISSIONS);
      setSystemRoles(SYSTEM_ROLES);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${RBAC_BASE}/permissions`, { headers: authHeaders() });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.data) {
        applyPayload(body.data);
      }
    } catch (_) {
      // Keep static defaults on failure.
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeaders, applyPayload]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateRole = useCallback(
    async (role, permissions) => {
      const res = await fetch(`${RBAC_BASE}/permissions/${encodeURIComponent(role)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ permissions }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to update permissions');
      }
      applyPayload(body?.data);
      return body?.data;
    },
    [authHeaders, applyPayload]
  );

  const createRole = useCallback(
    async (name, permissions = []) => {
      const res = await fetch(`${RBAC_BASE}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name, permissions }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to create role');
      }
      applyPayload(body?.data);
      return body?.data;
    },
    [authHeaders, applyPayload]
  );

  const deleteRole = useCallback(
    async (role, options = {}) => {
      const res = await fetch(`${RBAC_BASE}/roles/${encodeURIComponent(role)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(options),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || 'Failed to delete role');
      }
      applyPayload(body?.data);
      return body?.data;
    },
    [authHeaders, applyPayload]
  );

  const reset = useCallback(async () => {
    const res = await fetch(`${RBAC_BASE}/permissions/reset`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(body?.message || 'Failed to reset permissions');
    }
    applyPayload(body?.data);
    return body?.data;
  }, [authHeaders, applyPayload]);

  const can = useCallback(
    (permission) => {
      if (!user?.role) return false;
      return userCan(user, permission, permissionMap);
    },
    [user, permissionMap],
  );

  const value = useMemo(
    () => ({
      permissionMap,
      catalog,
      systemRoles,
      loading,
      can,
      refresh,
      updateRole,
      createRole,
      deleteRole,
      reset,
    }),
    [
      permissionMap,
      catalog,
      systemRoles,
      loading,
      can,
      refresh,
      updateRole,
      createRole,
      deleteRole,
      reset,
    ]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export const usePermissions = () => useContext(PermissionsContext);
