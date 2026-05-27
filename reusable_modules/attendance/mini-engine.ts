import { query } from '@/lib/db/postgres';
import { attendanceEvents } from '@/lib/utils/events';
import { assertTenantUuid, BIOMETRIC_TENANT_SQL_UUID_REGEX } from '@/lib/utils/uuid';

/**
 * FAST PATH: Processes attendance for a single employee on a specific day.
 * Designed to be called immediately after a biometric log is received.
 */
export async function processSingleEmployeeAttendance(biometricId: string, tenantId: string, dateStr: string) {
  try {
    const tid = assertTenantUuid(tenantId, 'mini-engine');
    console.log(`[MINI-ENGINE] Processing real-time attendance for BioID: ${biometricId} on ${dateStr}`);

    // 0. Fetch Skip Roles and IDs from Tenant Settings
    const tenantRes = await query('SELECT settings FROM tenants WHERE id = $1', [tid]);
    const settings = tenantRes.rows[0]?.settings || {};
    const skipRoles = Array.isArray(settings.skip_attendance_roles)
      ? settings.skip_attendance_roles.map((x: unknown) => String(x))
      : [];
    const skipIds = Array.isArray(settings.skip_attendance_employee_ids)
      ? settings.skip_attendance_employee_ids.map((x: unknown) => String(x))
      : [];

    // 1. Calculate punches for this specific employee using the most recent logs
    const sql = `
      WITH employee_data AS (
        SELECT e.id FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE TRIM(e.biometric_id::TEXT) = TRIM($1::TEXT) AND lower(trim(e.tenant_id::text)) = lower(trim($2::text))
          AND (u.role IS NULL OR NOT (u.role = ANY($4::text[])))
          AND (e.employee_id IS NULL OR NOT (e.employee_id = ANY($5::text[])))
        LIMIT 1
      ),
      daily_punches AS (
        SELECT 
          MIN(bl.timestamp) as first_punch,
          MAX(bl.timestamp) as last_punch
        FROM (
          SELECT * FROM biometric_logs bl0
          WHERE bl0.tenant_id::text ~ '${BIOMETRIC_TENANT_SQL_UUID_REGEX}'
        ) bl
        WHERE TRIM(bl.device_user_id) = TRIM($1::TEXT) 
          AND lower(trim(bl.tenant_id::text)) = lower(trim($2::text))
          AND bl.timestamp >= $3::DATE 
          AND bl.timestamp < ($3::DATE + INTERVAL '1 day')
      )
      INSERT INTO attendance (employee_id, tenant_id, date, check_in, check_out, working_hours, source, status)
      SELECT 
        ed.id, 
        $2::uuid, 
        $3, 
        dp.first_punch, 
        CASE WHEN dp.first_punch = dp.last_punch THEN NULL ELSE dp.last_punch END, 
        ROUND(EXTRACT(EPOCH FROM (dp.last_punch - dp.first_punch)) / 3600, 2),
        'biometric_realtime',
        COALESCE(
          CASE 
            WHEN w.status = 'approved' THEN 'WFH'
            WHEN dp.first_punch::TIME > '10:00:00'::TIME THEN 'LATE'
            ELSE 'PRESENT'
          END,
          'PRESENT'
        ) as status
      FROM employee_data ed
      CROSS JOIN daily_punches dp
      LEFT JOIN wfh_requests w ON w.employee_id = ed.id AND w.request_date = $3::DATE AND w.status = 'approved'
        AND lower(trim(w.tenant_id::text)) = lower(trim($2::text))
      WHERE dp.first_punch IS NOT NULL
      ON CONFLICT (employee_id, tenant_id, date) DO UPDATE SET
        check_in = CASE WHEN attendance.source = 'manual' THEN attendance.check_in ELSE EXCLUDED.check_in END,
        check_out = CASE WHEN attendance.source = 'manual' THEN attendance.check_out ELSE EXCLUDED.check_out END,
        working_hours = CASE WHEN attendance.source = 'manual' THEN attendance.working_hours ELSE EXCLUDED.working_hours END,
        status = CASE WHEN attendance.source = 'manual' THEN attendance.status ELSE COALESCE(EXCLUDED.status, attendance.status, 'PRESENT') END,
        source = CASE WHEN attendance.source = 'manual' THEN attendance.source ELSE EXCLUDED.source END,
        updated_at = CASE WHEN attendance.source = 'manual' THEN attendance.updated_at ELSE NOW() END
      RETURNING *;
    `;

    const result = await query(sql, [biometricId, tid, dateStr, skipRoles, skipIds]);

    if (result.rows && result.rows.length > 0) {
      const record = result.rows[0];
      console.log(`[MINI-ENGINE] ✅ Updated attendance for ${biometricId}: ${record.status} (In: ${record.check_in})`);

      try {
        const empRes = await query('SELECT first_name, last_name FROM employees WHERE id = $1', [record.employee_id]);
        const employeeName = empRes.rows[0] ? `${empRes.rows[0].first_name} ${empRes.rows[0].last_name}`.trim() : biometricId;

        attendanceEvents.emit('attendance_event', {
          channel: 'biometric',
          type: record?.check_out ? 'check_out' : 'check_in',
          employeeId: biometricId,
          employeeName,
          tenantId: tid,
          timestamp: new Date().toISOString(),
          data: record,
        });
      } catch (eventError) {
        console.warn('[MINI-ENGINE] Failed to emit biometric real-time event', eventError);
      }

      
      return record;
    }

    return null;
  } catch (error) {
    console.error(`[MINI-ENGINE] ❌ Failed to process real-time attendance:`, error);
    return null;
  }
}
