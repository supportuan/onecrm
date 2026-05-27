import { query } from '@/lib/db/postgres';
import { assertTenantUuid, BIOMETRIC_TENANT_SQL_UUID_REGEX, resolveSyncTenantId } from '@/lib/utils/uuid';

/**
 * Batch insert raw biometric logs (Standard schema: device_user_id, timestamp, tenant_id)
 */
export async function batchInsertLogs(logs: any[], tenantId: string, deviceId: string) {
  const tid = resolveSyncTenantId(tenantId);
  if (!tid) {
    console.error('[batchInsertLogs] Skipping insert: invalid tenant_id', tenantId);
    return 0;
  }

  if (!logs.length) return 0;

  let totalInserted = 0;
  const CHUNK_SIZE = 500; // Safe chunk size for SQL parameters

  for (let i = 0; i < logs.length; i += CHUNK_SIZE) {
    const chunk = logs.slice(i, i + CHUNK_SIZE);
    const values: any[] = [];
    const placeholders: string[] = [];
    let index = 1;

    for (const log of chunk) {
      // Highly resilient log field detection
      const userId = String(log.deviceUserId || log.userId || log.uid || log.userSn || log.pin || log.userid || '').trim();
      const time = log.recordTime || log.timestamp || log.time || log.checkTime;
      
      if (!userId || !time) continue;

      placeholders.push(`($${index++}, $${index++}, $${index++}, $${index++}, $${index++})`);
      values.push(
        userId, 
        new Date(time), 
        tid,
        deviceId || 'UNKNOWN-DEVICE', 
        JSON.stringify(log)
      );
    }

    if (placeholders.length > 0) {
      const sql = `
        INSERT INTO biometric_logs (device_user_id, timestamp, tenant_id, device_id, raw_data)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (device_user_id, timestamp, tenant_id) DO NOTHING;
      `;
      await query(sql, values);
      totalInserted += chunk.length;
    }
  }

  return totalInserted;
}

/**
 * PRODUCTION-READY Attendance Calculation
 * Standardized Mapping: biometric_logs.device_user_id → employees.biometric_id
 */
export async function processAttendance(tenantId: string, dateStr: string) {
  try {
    const tid = assertTenantUuid(tenantId, 'processAttendance');

    // 0. Fetch Skip Roles and IDs from Tenant Settings
    const tenantRes = await query('SELECT settings FROM tenants WHERE id = $1', [tid]);
    const settings = tenantRes.rows[0]?.settings || {};
    const skipRoles = Array.isArray(settings.skip_attendance_roles)
      ? settings.skip_attendance_roles.map((x: unknown) => String(x))
      : [];
    const skipIds = Array.isArray(settings.skip_attendance_employee_ids)
      ? settings.skip_attendance_employee_ids.map((x: unknown) => String(x))
      : [];

    // Optimized: Single query to calculate punches for all mapped employees at once
    const result = await query(
      `WITH daily_punches AS (
         SELECT 
           e.id as employee_uuid,
           bl.device_user_id,
           MIN(bl.timestamp) as first_punch,
           MAX(bl.timestamp) as last_punch
         FROM (
           SELECT * FROM biometric_logs bl0
           WHERE bl0.tenant_id::text ~ '${BIOMETRIC_TENANT_SQL_UUID_REGEX}'
         ) bl
         JOIN employees e ON TRIM(bl.device_user_id) = TRIM(e.biometric_id::TEXT)
           AND lower(trim(bl.tenant_id::text)) = lower(trim($1::text))
         LEFT JOIN users u ON e.user_id = u.id
         WHERE lower(trim(bl.tenant_id::text)) = lower(trim($1::text))
           AND bl.timestamp >= $2::DATE 
           AND bl.timestamp < ($2::DATE + INTERVAL '1 day')
           AND (u.role IS NULL OR NOT (u.role = ANY($3::text[])))
           AND (e.employee_id IS NULL OR NOT (e.employee_id = ANY($4::text[])))
         GROUP BY e.id, bl.device_user_id
       )
       INSERT INTO attendance (employee_id, tenant_id, date, check_in, check_out, working_hours, source, status)
       SELECT 
         dp.employee_uuid, 
         $1::uuid, 
         $2, 
         dp.first_punch, 
         CASE WHEN dp.first_punch = dp.last_punch THEN NULL ELSE dp.last_punch END, 
         ROUND(EXTRACT(EPOCH FROM (dp.last_punch - dp.first_punch)) / 3600, 2),
         'biometric',
         COALESCE(
           CASE 
             WHEN w.status = 'approved' THEN 'WFH'
             WHEN dp.first_punch::TIME > '10:00:00'::TIME THEN 'LATE'
             ELSE 'PRESENT'
           END,
           'PRESENT'
         ) as status
       FROM daily_punches dp
       LEFT JOIN wfh_requests w ON w.employee_id = dp.employee_uuid AND w.request_date = $2::DATE AND w.status = 'approved'
         AND lower(trim(w.tenant_id::text)) = lower(trim($1::text))
       ON CONFLICT (employee_id, tenant_id, date) DO UPDATE SET
         check_in = CASE WHEN attendance.source = 'manual' THEN attendance.check_in ELSE EXCLUDED.check_in END,
         check_out = CASE WHEN attendance.source = 'manual' THEN attendance.check_out ELSE EXCLUDED.check_out END,
         working_hours = CASE WHEN attendance.source = 'manual' THEN attendance.working_hours ELSE EXCLUDED.working_hours END,
         status = CASE WHEN attendance.source = 'manual' THEN attendance.status ELSE COALESCE(EXCLUDED.status, attendance.status, 'PRESENT') END,
         updated_at = CASE WHEN attendance.source = 'manual' THEN attendance.updated_at ELSE NOW() END
       RETURNING employee_id`,
      [tid, dateStr, skipRoles, skipIds]
    );

    return { 
      processed: result.rowCount, 
      records: result.rowCount, 
      skipped: 0 
    };
  } catch (error) {
    console.error(`[ENGINE] Failed to process attendance for ${dateStr}:`, error);
    throw error;
  }
}

const ATTENDANCE_TZ = 'Asia/Kolkata';

/** Calendar YYYY-MM-DD strings in Asia/Kolkata for the last `days` natural days (inclusive of today). */
export function kolkataLookbackDates(days: number): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const shifted = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
    out.push(shifted.toLocaleDateString('en-CA', { timeZone: ATTENDANCE_TZ }));
  }
  return [...new Set(out)];
}

/** Distinct punch dates from raw ZK rows (used after sync to recompute attendance, not only today). */
export function datesFromBiometricLogs(logs: any[], options?: { maxDaysBack?: number }): string[] {
  const maxBack = options?.maxDaysBack ?? 45;
  const oldest = kolkataLookbackDates(maxBack + 1).at(-1);
  if (!oldest) return [];
  const seen = new Set<string>();
  for (const log of logs) {
    const time = log.recordTime || log.timestamp || log.time;
    if (!time) continue;
    const ms = new Date(time).getTime();
    if (Number.isNaN(ms)) continue;
    const key = new Date(ms).toLocaleDateString('en-CA', { timeZone: ATTENDANCE_TZ });
    if (key < oldest) continue;
    seen.add(key);
  }
  return Array.from(seen).sort();
}

/** Re-run biometric aggregation for each calendar day (Keka-style “recalculate from logs”). */
export async function processAttendanceLookback(tenantId: string, days: number) {
  const dates = kolkataLookbackDates(days);
  let totalRecords = 0;
  for (const ds of dates) {
    const r = await processAttendance(tenantId, ds);
    totalRecords += r.records ?? 0;
  }
  return { daysProcessed: dates.length, totalRecords, dates };
}

/**
 * AUTO-LINK: Triggered after employee creation
 * Ensures historical logs are processed for the new employee
 */
export async function autoLinkBiometric(biometricId: string, tenantId: string) {
  if (!biometricId) return;

  try {
    const tid = assertTenantUuid(tenantId, 'autoLinkBiometric');
    // 1. Check if logs already exist for this ID
    const logsExist = await query(
      'SELECT 1 FROM biometric_logs WHERE device_user_id = $1 AND lower(trim(tenant_id::text)) = lower(trim($2::text)) LIMIT 1',
      [biometricId, tid]
    );

    if (logsExist.rows.length > 0) {
      console.log(`[AUTO-LINK] Found historical logs for ${biometricId}. Triggering processing...`);
      
      // 2. Process attendance for the last 7 days (to be safe/efficient)
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      });

      for (const date of dates) {
        await processAttendance(tid, date);
      }
    }
  } catch (err) {
    console.error(`[AUTO-LINK] Failure for ${biometricId}:`, err);
  }
}
