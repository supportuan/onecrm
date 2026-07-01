-- Remove the four demo HR employees that earlier seed runs inserted
-- (E001 Raju Kalla, E002 Jane Admin, E003 Alice Smith, E004 Bob Johnson).
-- All employee-scoped child rows (attendance, leave assignments, salary,
-- payslips, payroll deductions, onboarding, performance reviews, etc.)
-- are removed via the existing onDelete: Cascade relations on HrEmployee.

SET search_path TO "onecrm", public;

DELETE FROM "HrEmployee"
WHERE "employeeCode" IN ('E001', 'E002', 'E003', 'E004');
