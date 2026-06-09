// TypeScript interfaces for HR module API shapes
export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  access_role: string;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  biometricId?: string | null;
  location?: string | null;
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
  description?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
}

export interface LeaveDefinition {
  plan_id: string;
  leave_type_id: string;
  name: string;
  annual_quota: number;
  carry_forward: boolean;
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
  createdAt: string;
  updatedAt: string;
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
  getTeam,
  assignAccessRole,
  bulkImportEmployees,
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
  getLeaveDefinitions,
  addLeaveDefinition,
  deleteLeaveDefinition,
  getLeavePlanEmployees,
  assignLeavePlanEmployees,
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
  createOfferLetter,
  updateOfferLetterStatus,
  getInterviews,
  scheduleInterview,
  updateInterviewStatus,
  submitInterviewFeedback,
  getJobPostings,
  createJobPosting,
  updateJobPostingStatus,
  getCandidates,
  addCandidate,
  updateCandidateStage,
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
