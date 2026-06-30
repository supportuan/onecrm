// TypeScript interfaces for HR module API shapes
export interface Employee {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  firstName?: string | null;
  lastName?: string | null;
  employeeId: string;
  employee_id: string;
  email: string;
  access_role: string;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  biometricId?: string | null;
  location?: string | null;
  joiningDate?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
  resignedAt?: string | null;
  terminatedAt?: string | null;
  exitReason?: string | null;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  type: 'OFFER_LETTER' | 'ID_PROOF' | 'CONTRACT' | 'OTHER';
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  uploadedAt: string;
  expiresAt?: string | null;
  notes?: string | null;
  sourceOfferLetterId?: string | null;
}

export interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceIp: string;
  status: 'online' | 'offline';
  lastSync: string;
  settings: Record<string, any>;
}

export interface NetworkWhitelist {
  id: string;
  ip_address_or_range: string;
  label: string;
  is_active: boolean;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  device_id: string | null;
}

export interface Regularization {
  id: string;
  employee_id: string;
  name: string;
  date: string;
  type: string;
  time: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverRemarks?: string;
  createdAt: string;
}

export interface LeavePlan {
  id: string;
  name: string;
  cycle: string;
  description?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
}

export interface LeaveDefinition {
  id: string;
  plan_id: string;
  leave_type_id: string;
  name: string;
  annual_quota: number;
  carry_forward: boolean;
  // Display fields surfaced from the joined HrLeaveType row.
  type_code: string;
  type_name: string;
  leave_type_code: string;
  leave_type_name: string;
  // Frontend-only metadata (not currently persisted; safe defaults).
  is_unlimited: boolean;
  accrual_type: string;
  accrual_rate: number;
  year_end_policy: string;
  carry_forward_max: number;
  min_days_per_request: number;
  max_days_per_request: number;
  gender_restriction: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  is_restricted: boolean;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  name: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'DRAFT' | 'PAID';
}

export interface OnboardingItem {
  id: string;
  category: 'DOCUMENTS' | 'ACCESS' | 'TRAINING';
  title: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED';
  completedAt?: string;
  completedBy?: string;
  dueDate?: string;
  assignee?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  role?: string;
  items: OnboardingTemplateItem[];
  createdAt: string;
}

export interface OnboardingTemplateItem {
  id: string;
  category: 'DOCUMENTS' | 'ACCESS' | 'TRAINING';
  title: string;
  description?: string;
  dueOffsetDays: number;
  assigneeRole?: string;
  sortOrder: number;
}

export interface OnboardingChecklist {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  items: OnboardingItem[];
  createdAt: string;
}

export interface OfferLetter {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  offeredSalary: number;
  joiningDate: string;
  expiryDate: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  policyTemplate: string;
  templateId?: string;
  renderedHtml?: string;
  conditional: boolean;
  acceptedAt?: string;
  rejectedAt?: string;
  employeeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferLetterTemplate {
  id: string;
  name: string;
  description?: string;
  bodyHtml: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateStageEvent {
  id: string;
  candidateId: string;
  fromStage?: string;
  toStage: string;
  changedById?: string;
  changedByName?: string;
  notes?: string;
  createdAt: string;
}

export interface InterviewFeedback {
  rating: number;
  technicalScore?: number;
  communicationScore?: number;
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'NO_HIRE';
  notes: string;
  submittedBy: string;
  submittedAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  round: string;
  type: 'IN_PERSON' | 'VIRTUAL' | 'PHONE';
  scheduledAt: string;
  duration: number;
  interviewers: string[];
  meetingLink?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  feedback?: InterviewFeedback;
  createdAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  description: string;
  requirements: string;
  salaryRange: string;
  status: 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED';
  applicantsCount: number;
  hiringManager: string;
  postedAt?: string;
  closingDate?: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  currentStage: string;
  status: 'ACTIVE' | 'REJECTED' | 'HIRED' | 'WITHDRAWN';
  appliedAt: string;
}

export interface ProcessingMetric {
  id: string;
  period: string;
  totalApplications: number;
  processedApplications: number;
  accurateApplications: number;
  avgTurnaroundDays: number;
  reviewsCompleted: number;
  pendingReviews: number;
}

export interface KPIDefinition {
  id: string;
  role: string;
  name: string;
  description?: string;
  target: number;
  unit: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  isActive: boolean;
}

export interface KPIMetric {
  id: string;
  kpiId: string;
  userId?: string;
  userRole: string;
  period: string;
  actualValue: number;
  targetValue: number;
  notes?: string;
  recordedAt: string;
}

export interface MarketingPerformance {
  id: string;
  period: string;
  leadsGenerated: number;
  costPerLead: number;
  totalBudget: number;
  channel: string;
  conversions: number;
}

export interface CounsellorPerformance {
  id: string;
  counsellorId: string;
  counsellorName: string;
  period: string;
  leadsHandled: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export interface PayrollDeduction {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  leaveDays: number;
  leaveDeduction: number;
  taxAmount: number;
  otherDeductions: number;
  totalDeductions: number;
}

export interface PerformanceReview {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  cycle: string;
  manager: string;
  rating: number;
  status: string;
  date: string;
}

// Re-export all service functions from Prisma implementation
export {
  getEmployees,
  getEmployeeById,
  getTeam,
  assignAccessRole,
  updateEmployee,
  bulkImportEmployees,
  getEmployeeDocuments,
  createEmployeeDocument,
  deleteEmployeeDocument,
  getAttendanceSettings,
  updateAttendanceSettings,
  getDevices,
  createDevice,
  deleteDevice,
  getNetworks,
  createNetwork,
  deleteNetwork,
  getBiometricUsers,
  getAttendanceEvents,
  processBiometricLogs,
  submitRemoteClockIn,
  getTeamCalendar,
  getRegularizations,
  requestRegularization,
  processRegularization,
  getLeavePlans,
  createLeavePlan,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getLeaveDefinitions,
  addLeaveDefinition,
  deleteLeaveDefinition,
  getLeavePlanEmployees,
  assignLeavePlanEmployees,
  removeLeavePlanEmployee,
  getHolidays,
  createHoliday,
  deleteHoliday,
  getSalaryStructures,
  updateSalaryStructure,
  getPayslips,
  calculatePayroll,
  getOnboardingChecklists,
  getOnboardingChecklist,
  createOnboardingChecklist,
  updateOnboardingItem,
  getOfferLetters,
  getOfferLetterById,
  createOfferLetter,
  updateOfferLetterStatus,
  acceptOfferLetter,
  rejectOfferLetter,
  getOfferLetterTemplates,
  getOfferLetterTemplate,
  createOfferLetterTemplate,
  updateOfferLetterTemplate,
  deleteOfferLetterTemplate,
  renderOfferLetterHtml,
  getInterviews,
  scheduleInterview,
  rescheduleInterview,
  updateInterviewStatus,
  submitInterviewFeedback,
  getJobPostings,
  createJobPosting,
  updateJobPosting,
  updateJobPostingStatus,
  getCandidates,
  addCandidate,
  updateCandidate,
  updateCandidateStage,
  updateCandidateStatus,
  getCandidateStageEvents,
  getOnboardingTemplates,
  createOnboardingTemplate,
  deleteOnboardingTemplate,
  createOnboardingChecklistFromTemplate,
  getProcessingMetrics,
  addProcessingMetric,
  getKPIDefinitions,
  createKPIDefinition,
  updateKPIDefinition,
  deleteKPIDefinition,
  getKPIMetrics,
  recordKPIMetric,
  getMarketingPerformance,
  addMarketingPerformance,
  getCounsellorPerformance,
  addCounsellorPerformance,
  getPayrollDeductions,
  upsertPayrollDeduction,
  getPerformanceReviews,
  createPerformanceReview,
  updatePerformanceReview,
  getLeaveRequests,
  createLeaveRequest,
  processLeaveRequest,
  cancelLeaveRequest,
  getHrDashboardSummary,
  getHrMe,
  getMyAttendance,
} from './hr.prisma.service.js';
