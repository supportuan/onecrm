-- Where does Tenant actually live?
SELECT n.nspname AS schema, c.relname AS table
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'Tenant';

-- And what's the current search_path?
SHOW search_path;

-- And rows?
SELECT count(*) FROM "Tenant";
