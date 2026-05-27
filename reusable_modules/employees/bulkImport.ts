import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { PoolClient } from 'pg';
import { query } from '@/lib/db/postgres';
import { hashPassword } from '@/lib/auth/password';

export interface BulkEmployeeImportRow {
  rowNumber: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string | null;
  designation?: string | null;
  managerEmployeeId?: string | null;
  phone?: string | null;
  biometricId?: string | null;
  location?: string | null;
}

export interface RowValidationResult {
  rowNumber: number;
  normalized: BulkEmployeeImportRow | null;
  errors: string[];
}

export interface ParseImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: RowValidationResult[];
}

const HEADER_ALIASES: Record<keyof Omit<BulkEmployeeImportRow, 'rowNumber'>, string[]> = {
  employeeId: ['employeeid', 'employee_id', 'empid', 'emp_id', 'university_id'],
  firstName: ['firstname', 'first_name', 'name_first'],
  lastName: ['lastname', 'last_name', 'name_last', 'surname'],
  email: ['email', 'companyemail', 'company_email', 'workemail', 'work_email'],
  role: ['role', 'accessrole', 'access_role'],
  department: ['department', 'dept', 'businessunit', 'business_unit'],
  designation: ['designation', 'title', 'jobtitle', 'job_title'],
  managerEmployeeId: ['manageremployeeid', 'manager_employee_id', 'reportsto', 'reports_to'],
  phone: ['phone', 'phonenumber', 'phone_number', 'mobile'],
  biometricId: ['biometricid', 'biometric_id'],
  location: ['location', 'office', 'worklocation', 'work_location'],
};

const VALID_ROLES = new Set([
  'SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER', 'HR_EXECUTIVE',
  'PAYROLL_ADMIN', 'EXPENSE_MANAGER', 'IT_ADMIN', 'LEARNING_ADMIN',
  'MANAGER', 'TEAM_LEAD', 'EMPLOYEE', 'HOD', 'PRINCIPAL', 'DIRECTOR',
  'FACULTY', 'STAFF', 'NON_TEACHING', 'PENDING', 'TEACHING',
]);

function normalizeHeader(header: unknown): string {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getCell(record: Record<string, unknown>, aliases: string[]): string {
  for (const [key, value] of Object.entries(record)) {
    const normalized = normalizeHeader(key);
    if (aliases.includes(normalized)) {
      return String(value ?? '').trim();
    }
  }
  return '';
}

function normalizeRole(roleValue: string): string {
  return roleValue.trim().toUpperCase().replace(/[-\s]/g, '_');
}

function validateAndNormalizeRecord(record: Record<string, unknown>, rowNumber: number): RowValidationResult {
  const employeeId = getCell(record, HEADER_ALIASES.employeeId);
  const firstName = getCell(record, HEADER_ALIASES.firstName);
  const lastName = getCell(record, HEADER_ALIASES.lastName);
  const email = getCell(record, HEADER_ALIASES.email).toLowerCase();
  const roleRaw = getCell(record, HEADER_ALIASES.role) || 'EMPLOYEE';
  const role = normalizeRole(roleRaw);
  const department = getCell(record, HEADER_ALIASES.department) || null;
  const designation = getCell(record, HEADER_ALIASES.designation) || null;
  const managerEmployeeId = getCell(record, HEADER_ALIASES.managerEmployeeId) || null;
  const phone = getCell(record, HEADER_ALIASES.phone) || null;
  const biometricId = getCell(record, HEADER_ALIASES.biometricId) || employeeId || null;
  const location = getCell(record, HEADER_ALIASES.location) || null;

  const errors: string[] = [];

  if (!employeeId) errors.push('Employee ID is required');
  if (!firstName) errors.push('First name is required');
  if (!lastName) errors.push('Last name is required');
  if (!email) errors.push('Email is required');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email format is invalid');
  if (!VALID_ROLES.has(role)) errors.push(`Invalid role: ${roleRaw}`);

  if (errors.length > 0) {
    return {
      rowNumber,
      normalized: null,
      errors,
    };
  }

  return {
    rowNumber,
    normalized: {
      rowNumber,
      employeeId,
      firstName,
      lastName,
      email,
      role,
      department,
      designation,
      managerEmployeeId,
      phone,
      biometricId,
      location,
    },
    errors: [],
  };
}

export function parseEmployeeExcel(buffer: Buffer): ParseImportResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    return { totalRows: 0, validRows: 0, invalidRows: 0, rows: [] };
  }

  const sheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  const rows = rawRows.map((row, idx) => validateAndNormalizeRecord(row, idx + 2));

  const seenEmployeeId = new Set<string>();
  const seenEmail = new Set<string>();
  for (const row of rows) {
    if (!row.normalized) continue;
    const idKey = row.normalized.employeeId.toLowerCase();
    const emailKey = row.normalized.email.toLowerCase();
    if (seenEmployeeId.has(idKey)) row.errors.push('Duplicate Employee ID in file');
    if (seenEmail.has(emailKey)) row.errors.push('Duplicate Email in file');
    seenEmployeeId.add(idKey);
    seenEmail.add(emailKey);
    if (row.errors.length > 0) row.normalized = null;
  }

  const validRows = rows.filter((r) => r.normalized).length;
  return {
    totalRows: rows.length,
    validRows,
    invalidRows: rows.length - validRows,
    rows,
  };
}

export async function validateRowsAgainstDatabase(tenantId: string, rows: RowValidationResult[]): Promise<RowValidationResult[]> {
  const validRows = rows.filter((r) => r.normalized).map((r) => r.normalized!) as BulkEmployeeImportRow[];
  if (validRows.length === 0) return rows;

  const employeeIds = validRows.map((r) => r.employeeId);
  const emails = validRows.map((r) => r.email);

  const existingRes = await query(
    `SELECT employee_id, email
     FROM employees
     WHERE tenant_id = $1
       AND (employee_id = ANY($2::text[]) OR LOWER(email) = ANY($3::text[]))`,
    [tenantId, employeeIds, emails.map((e) => e.toLowerCase())]
  );

  const existingEmployeeIds = new Set(existingRes.rows.map((r: any) => String(r.employee_id || '').toLowerCase()));
  const existingEmails = new Set(existingRes.rows.map((r: any) => String(r.email || '').toLowerCase()));

  for (const row of rows) {
    if (!row.normalized) continue;
    const empId = row.normalized.employeeId.toLowerCase();
    const email = row.normalized.email.toLowerCase();
    if (existingEmployeeIds.has(empId)) row.errors.push('Employee ID already exists');
    if (existingEmails.has(email)) row.errors.push('Email already exists');
    if (row.errors.length > 0) row.normalized = null;
  }
  return rows;
}

async function ensureDepartment(client: PoolClient, tenantId: string, name: string | null | undefined): Promise<string | null> {
  if (!name) return null;
  const res = await client.query(
    `INSERT INTO departments (tenant_id, name)
     VALUES ($1, $2)
     ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [tenantId, name]
  );
  return res.rows[0]?.id ?? null;
}

async function ensureDesignation(client: PoolClient, tenantId: string, name: string | null | undefined): Promise<string | null> {
  if (!name) return null;
  const res = await client.query(
    `INSERT INTO designations (tenant_id, name)
     VALUES ($1, $2)
     ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [tenantId, name]
  );
  return res.rows[0]?.id ?? null;
}

async function resolveManagerId(client: PoolClient, tenantId: string, managerEmployeeId: string | null | undefined): Promise<string | null> {
  if (!managerEmployeeId) return null;
  const res = await client.query(
    `SELECT id
     FROM employees
     WHERE tenant_id = $1
       AND (employee_id = $2 OR university_id = $2)
     LIMIT 1`,
    [tenantId, managerEmployeeId]
  );
  return res.rows[0]?.id ?? null;
}

export async function createEmployeeFromImportRow(
  client: PoolClient,
  tenantId: string,
  row: BulkEmployeeImportRow
): Promise<{ employeeId: string; userId: string }> {
  const departmentId = await ensureDepartment(client, tenantId, row.department);
  const designationId = await ensureDesignation(client, tenantId, row.designation);
  const managerId = await resolveManagerId(client, tenantId, row.managerEmployeeId);

  const tempPassword = crypto.randomBytes(6).toString('hex');
  const passwordHash = await hashPassword(tempPassword);
  const verificationToken = crypto.randomUUID();
  const verificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const employeeInsert = await client.query(
    `INSERT INTO employees (
      university_id, employee_id, first_name, last_name, email, role,
      department_id, designation_id, manager_id, tenant_id, is_active, biometric_id, location
    ) VALUES (
      $1, $1, $2, $3, $4, $5,
      $6, $7, $8, $9, true, $10, $11
    ) RETURNING id`,
    [
      row.employeeId,
      row.firstName,
      row.lastName,
      row.email,
      row.role,
      departmentId,
      designationId,
      managerId,
      tenantId,
      row.biometricId || row.employeeId,
      row.location,
    ]
  );

  const createdEmployeeId = employeeInsert.rows[0].id as string;

  const userInsert = await client.query(
    `INSERT INTO users (
      name, email, password_hash, role, tenant_id, employee_id, is_active,
      is_verified, verification_token, verification_token_expires
    ) VALUES (
      $1, $2, $3, $4, $5, $6, true, false, $7, $8
    ) RETURNING id`,
    [
      `${row.firstName} ${row.lastName}`.trim(),
      row.email,
      passwordHash,
      row.role,
      tenantId,
      row.employeeId,
      verificationToken,
      verificationExpires,
    ]
  );

  return { employeeId: createdEmployeeId, userId: userInsert.rows[0].id as string };
}
