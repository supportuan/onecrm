-- Where do User and RolePermission live, and do they have tenantId?
SELECT n.nspname AS schema, c.relname AS table, a.attname AS column
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE c.relname IN ('User', 'RolePermission', 'Tenant', 'TenantModule', 'HrEmployee')
  AND a.attname IN ('tenantId', 'id')
  AND a.attnum > 0
ORDER BY n.nspname, c.relname, a.attname;

-- Current session search_path
SHOW search_path;
