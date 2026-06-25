'use client';

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { ROLE_PERMISSIONS, ALL_PERMISSIONS, hasAnyPermission } from './rbac';

const RBAC_BASE = '/api/rbac';

const PermissionsContext = createContext({
  permissionMap: ROLE_PERMISSIONS,
  catalog: ALL_PERMISSIONS,
  loading: true,
  can: () => false,
  refresh: async () => {},
  updateRole: async () => {},
  reset: async () => {},
});

export const PermissionsProvider = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [permissionMap, setPermissionMap] = useState(ROLE_PERMISSIONS);
  const [catalog, setCatalog] = useState(ALL_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setPermissionMap(ROLE_PERMISSIONS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${RBAC_BASE}/permissions`, { headers: authHeaders() });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.data?.roles) {
        setPermissionMap(body.data.roles);
        if (Array.isArray(body.data.catalog) && body.data.catalog.length) {
          setCatalog(body.data.catalog);
        }
      }
    } catch (_) {
      // Keep static defaults on failure.
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeaders]);

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
      if (body?.data?.roles) {
        setPermissionMap(body.data.roles);
      }
      return body?.data;
    },
    [authHeaders]
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
    if (body?.data?.roles) {
      setPermissionMap(body.data.roles);
    }
    return body?.data;
  }, [authHeaders]);

  const can = useCallback(
    (permission) => {
      if (!user?.role) return false;
      const effectiveRole = user.permissionRole || user.role;
      return hasAnyPermission(effectiveRole, permission, permissionMap);
    },
    [user, permissionMap]
  );

  const value = useMemo(
    () => ({ permissionMap, catalog, loading, can, refresh, updateRole, reset }),
    [permissionMap, catalog, loading, can, refresh, updateRole, reset]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export const usePermissions = () => useContext(PermissionsContext);
