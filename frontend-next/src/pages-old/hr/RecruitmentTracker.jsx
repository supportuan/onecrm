'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Briefcase,
  Plus,
  CheckCircle2,
  Search,
  X,
  ArrowRight,
  ClipboardList,
  Mail,
  Phone,
  Pencil,
} from 'lucide-react';

/* ============================================================
 * Candidate lifecycle: 6 stages (job lifecycle lives separately
 * on the Jobs panel above this).
 * ============================================================ */
const STAGES = [
  { key: 'application', label: 'application' },
  { key: 'screening', label: 'resume screening' },
  { key: 'interviews', label: 'interviews' },
  { key: 'offer', label: 'offer' },
  { key: 'verification', label: 'verification & docs' },
  { key: 'onboarding', label: 'onboarding' },
];

const STAGE_SECTIONS = {
  interviews: [
    {
      title: 'hr round',
      fields: [
        { key: 'interviewId', label: 'interview id', type: 'text' },
        { key: 'interviewDate', label: 'interview date', type: 'date' },
        { key: 'interviewTime', label: 'interview time', type: 'text' },
        { key: 'interviewMode', label: 'interview mode', type: 'select', options: ['online', 'in-person'] },
        { key: 'interviewerName', label: 'interviewer name', type: 'text' },
        { key: 'communicationSkillsRating', label: 'communication skills rating', type: 'text' },
        { key: 'hrFeedback', label: 'hr feedback', type: 'textarea' },
        { key: 'candidateStatus', label: 'candidate status', type: 'text' },
        { key: 'nextRoundRecommendation', label: 'next round recommendation', type: 'text' },
      ],
    },
    {
      title: 'technical round',
      fields: [
        { key: 'technicalInterviewer', label: 'technical interviewer', type: 'text' },
        { key: 'codingScore', label: 'coding score', type: 'text' },
        { key: 'technicalSkillsRating', label: 'technical skills rating', type: 'text' },
        { key: 'problemSolvingRating', label: 'problem solving rating', type: 'text' },
        { key: 'assignmentLink', label: 'assignment/test link', type: 'text' },
        { key: 'testScore', label: 'test score', type: 'text' },
        { key: 'technicalFeedback', label: 'technical feedback', type: 'textarea' },
        { key: 'recommendation', label: 'recommendation', type: 'text' },
      ],
    },
    {
      title: 'managerial round',
      fields: [
        { key: 'managerName', label: 'manager name', type: 'text' },
        { key: 'leadershipRating', label: 'leadership rating', type: 'text' },
        { key: 'teamFitRating', label: 'team fit rating', type: 'text' },
        { key: 'behavioralFeedback', label: 'behavioral feedback', type: 'textarea' },
        { key: 'decisionStatus', label: 'decision status', type: 'select', options: ['approved', 'rejected', 'pending'] },
      ],
    },
  ],
  offer: [
    {
      title: 'final hr discussion',
      fields: [
        { key: 'finalSalaryOffered', label: 'final salary offered', type: 'text' },
        { key: 'bonusDetails', label: 'bonus details', type: 'text' },
        { key: 'joiningDateDiscussion', label: 'joining date discussion', type: 'text' },
        { key: 'shiftDetails', label: 'shift details', type: 'text' },
        { key: 'workLocation', label: 'work location', type: 'text' },
        { key: 'finalHrComments', label: 'final hr comments', type: 'textarea' },
      ],
    },
    {
      title: 'offer letter',
      fields: [
        { key: 'offerId', label: 'offer id', type: 'text' },
        { key: 'offeredSalary', label: 'offered salary', type: 'text' },
        { key: 'designation', label: 'designation', type: 'text' },
        { key: 'offerDepartment', label: 'department', type: 'text' },
        { key: 'doj', label: 'doj (date of joining)', type: 'date' },
        { key: 'offerLetterPdf', label: 'offer letter pdf', type: 'text' },
        { key: 'offerExpiryDate', label: 'offer expiry date', type: 'date' },
        { key: 'offerStatus', label: 'offer status', type: 'select', options: ['draft', 'released', 'expired'] },
      ],
    },
    {
      title: 'candidate response',
      fields: [
        { key: 'acceptedRejected', label: 'accepted / rejected', type: 'select', options: ['accepted', 'rejected', 'negotiating'] },
        { key: 'candidateRemarks', label: 'candidate remarks', type: 'textarea' },
        { key: 'negotiatedSalary', label: 'negotiated salary', type: 'text' },
        { key: 'acceptanceDate', label: 'acceptance date', type: 'date' },
      ],
    },
  ],
  verification: [
    {
      title: 'background verification',
      fields: [
        { key: 'aadhaarPanVerification', label: 'aadhaar/pan verification', type: 'select', options: ['verified', 'failed', 'pending'] },
        { key: 'addressVerification', label: 'address verification', type: 'select', options: ['verified', 'failed', 'pending'] },
        { key: 'educationVerification', label: 'education verification', type: 'select', options: ['verified', 'failed', 'pending'] },
        { key: 'employmentVerification', label: 'employment verification', type: 'select', options: ['verified', 'failed', 'pending'] },
        { key: 'verificationStatus', label: 'verification status', type: 'select', options: ['completed', 'failed', 'in-progress'] },
        { key: 'verificationReport', label: 'verification report', type: 'text' },
      ],
    },
    {
      title: 'document collection',
      fields: [
        { key: 'aadhaarCard', label: 'aadhaar card', type: 'text', placeholder: 'uploaded file' },
        { key: 'panCard', label: 'pan card', type: 'text' },
        { key: 'passportPhoto', label: 'passport photo', type: 'text' },
        { key: 'resumeCopy', label: 'resume copy', type: 'text' },
        { key: 'educationalCertificates', label: 'educational certificates', type: 'text' },
        { key: 'experienceLetters', label: 'experience letters', type: 'text' },
        { key: 'bankDetails', label: 'bank details', type: 'text' },
        { key: 'offerAcceptanceCopy', label: 'offer acceptance copy', type: 'text' },
        { key: 'uploadedDate', label: 'uploaded date', type: 'date' },
      ],
    },
  ],
  onboarding: [
    {
      title: 'employee onboarding',
      fields: [
        { key: 'employeeId', label: 'employee id', type: 'text' },
        { key: 'officialEmail', label: 'official email', type: 'email' },
        { key: 'departmentAllocation', label: 'department allocation', type: 'text' },
        { key: 'reportingManager', label: 'reporting manager', type: 'text' },
        { key: 'systemAccess', label: 'system access', type: 'text' },
        { key: 'assetAllocation', label: 'asset allocation', type: 'text' },
        { key: 'orientationSchedule', label: 'orientation schedule', type: 'text' },
        { key: 'trainingAssigned', label: 'training assigned', type: 'text' },
      ],
    },
    {
      title: 'hrms sync',
      fields: [
        { key: 'employeeStatus', label: 'employee status', type: 'select', options: ['active', 'probation', 'training'] },
        { key: 'payrollSetup', label: 'payroll setup', type: 'select', options: ['completed', 'pending'] },
        { key: 'attendanceSetup', label: 'attendance setup', type: 'select', options: ['completed', 'pending'] },
        { key: 'leavePolicyAssigned', label: 'leave policy assigned', type: 'text' },
        { key: 'rolePermissions', label: 'role permissions', type: 'text' },
        { key: 'joiningConfirmation', label: 'joining confirmation', type: 'select', options: ['confirmed', 'delayed'] },
      ],
    },
  ],
};

const STAGE_FIELDS_FLAT = {
  application: [
    { key: 'resumeUpload', label: 'resume upload', type: 'text', placeholder: 'filename.pdf' },
    { key: 'portfolioUrl', label: 'portfolio/linkedin url', type: 'text' },
    { key: 'currentCompany', label: 'current company', type: 'text' },
    { key: 'experience', label: 'experience', type: 'text' },
    { key: 'skills', label: 'skills', type: 'text' },
    { key: 'expectedSalary', label: 'expected salary', type: 'text' },
    { key: 'currentSalary', label: 'current salary', type: 'text' },
    { key: 'noticePeriod', label: 'notice period', type: 'text' },
    { key: 'preferredLocation', label: 'preferred location', type: 'text' },
    { key: 'applicationSource', label: 'application source', type: 'text' },
    { key: 'appliedDate', label: 'applied date', type: 'date' },
  ],
  screening: [
    { key: 'screeningStatus', label: 'screening status', type: 'select', options: ['passed', 'failed', 'pending'] },
    { key: 'recruiterNotes', label: 'recruiter notes', type: 'textarea' },
    { key: 'skillMatchPct', label: 'skill match %', type: 'text' },
    { key: 'resumeScore', label: 'resume score', type: 'text' },
    { key: 'shortlisted', label: 'shortlisted', type: 'select', options: ['yes', 'no'] },
    { key: 'rejectionReason', label: 'rejection reason', type: 'text' },
    { key: 'screeningDate', label: 'screening date', type: 'date' },
  ],
};

const getStageFields = (stageKey) => {
  const sections = STAGE_SECTIONS[stageKey];
  if (sections) return sections;
  const flat = STAGE_FIELDS_FLAT[stageKey];
  if (flat) return [{ title: null, fields: flat }];
  return [];
};

/* ============================================================
 * Job model: lives separately from candidate flow.
 * ============================================================ */
const JOB_FIELD_SECTIONS = [
  {
    title: 'requisition details',
    fields: [
      { key: 'jobTitle', label: 'job title', type: 'text', placeholder: 'e.g. senior developer' },
      { key: 'department', label: 'department', type: 'text', placeholder: 'e.g. engineering' },
      { key: 'hiringManager', label: 'hiring manager', type: 'text', placeholder: 'e.g. jane admin' },
      { key: 'employmentType', label: 'employment type', type: 'text', placeholder: 'e.g. full time' },
      { key: 'experienceRequired', label: 'experience required', type: 'text', placeholder: 'e.g. 5+ years' },
      { key: 'salaryRange', label: 'salary range', type: 'text', placeholder: 'e.g. 18,00,000 - 24,00,000' },
      { key: 'skillsRequired', label: 'skills required', type: 'text', placeholder: 'e.g. react, node, postgres' },
      { key: 'openPositionsCount', label: 'open positions count', type: 'number', placeholder: 'e.g. 3' },
      { key: 'jobLocation', label: 'job location', type: 'text', placeholder: 'e.g. Chicago office' },
      { key: 'workMode', label: 'work mode', type: 'select', options: ['remote', 'hybrid', 'onsite'] },
      { key: 'applicationDeadline', label: 'application deadline', type: 'date' },
      { key: 'jobDescription', label: 'job description', type: 'textarea', placeholder: 'enter details...' },
    ],
  },
  {
    title: 'job posting',
    fields: [
      { key: 'postingChannel', label: 'posting channel', type: 'text', placeholder: 'e.g. linkedin, indeed' },
      { key: 'careerPortalUrl', label: 'career portal url', type: 'text' },
      { key: 'linkedinUrl', label: 'linkedin url', type: 'text' },
      { key: 'jobStatus', label: 'job status', type: 'select', options: ['active', 'paused', 'closed'] },
      { key: 'postedDate', label: 'posted date', type: 'date' },
      { key: 'recruiterAssigned', label: 'recruiter assigned', type: 'text' },
    ],
  },
];

const emptyJobForm = {
  jobTitle: '',
  department: '',
  hiringManager: '',
  employmentType: 'full time',
  experienceRequired: '',
  salaryRange: '',
  skillsRequired: '',
  openPositionsCount: '',
  jobLocation: '',
  workMode: 'onsite',
  applicationDeadline: '',
  jobDescription: '',
  postingChannel: '',
  careerPortalUrl: '',
  linkedinUrl: '',
  jobStatus: 'active',
  postedDate: '',
  recruiterAssigned: '',
};

/* ============================================================
 * Seed data
 * ============================================================ */
const SEED_JOBS = [
  {
    id: 'job_101',
    jobTitle: 'Senior developer',
    department: 'Engineering',
    hiringManager: 'Jane Admin',
    employmentType: 'full time',
    experienceRequired: '5+ years',
    salaryRange: '₹18,00,000 - ₹24,00,000',
    skillsRequired: 'react, node, postgres',
    openPositionsCount: '2',
    jobLocation: 'Chicago office',
    workMode: 'hybrid',
    applicationDeadline: '2026-07-15',
    jobDescription: 'Building the next generation of customer tooling.',
    postingChannel: 'LinkedIn',
    careerPortalUrl: 'https://careers.onecrm.com/jobs/101',
    linkedinUrl: 'https://linkedin.com/jobs/101',
    jobStatus: 'active',
    postedDate: '2026-05-10',
    recruiterAssigned: 'Alice Smith',
  },
  {
    id: 'job_102',
    jobTitle: 'Operations manager',
    department: 'Operations',
    hiringManager: 'Sam Director',
    employmentType: 'full time',
    experienceRequired: '8+ years',
    salaryRange: '₹20,00,000 - ₹26,00,000',
    skillsRequired: 'operations, process, vendor mgmt',
    openPositionsCount: '1',
    jobLocation: 'New York office',
    workMode: 'onsite',
    applicationDeadline: '2026-06-30',
    jobDescription: 'Run day-to-day ops for the NY office.',
    postingChannel: 'Direct career site',
    careerPortalUrl: 'https://careers.onecrm.com/jobs/102',
    linkedinUrl: '',
    jobStatus: 'active',
    postedDate: '2026-04-25',
    recruiterAssigned: 'Alice Smith',
  },
];

const SEED_CANDIDATES = [
  {
    id: 'c1',
    jobId: 'job_101',
    name: 'Raju Kalla',
    email: 'raju.kalla@gmail.com',
    phone: '+91 98765 43210',
    role: 'Senior developer',
    currentStage: 'interviews',
    appliedDate: '2026-05-18',
    fields: {
      expectedSalary: '₹22,00,000',
      noticePeriod: '30 days',
      applicationSource: 'LinkedIn referral',
      screeningStatus: 'passed',
      skillMatchPct: '92%',
      resumeScore: '8.8/10',
      interviewerName: 'Alice Smith',
      communicationSkillsRating: '4.5/5',
      hrFeedback: 'Strong cultural fit and communications.',
      technicalInterviewer: 'Jane Admin',
      codingScore: '88/100',
      technicalSkillsRating: '4.6/5',
      testScore: '90%',
    },
  },
  {
    id: 'c2',
    jobId: 'job_102',
    name: 'Jane Admin',
    email: 'jane.admin@onecrm.com',
    phone: '+91 99988 87766',
    role: 'Operations manager',
    currentStage: 'onboarding',
    appliedDate: '2026-05-02',
    fields: {
      expectedSalary: '₹24,00,000',
      noticePeriod: 'immediate',
      applicationSource: 'organic search',
      screeningStatus: 'passed',
      skillMatchPct: '98%',
      resumeScore: '9.5/10',
      interviewerName: 'Alice Smith',
      communicationSkillsRating: '5.0/5',
      hrFeedback: 'exceptional leader profile.',
      managerName: 'Sam Director',
      leadershipRating: '5.0/5',
      teamFitRating: '4.8/5',
      behavioralFeedback: 'highly recommended.',
      finalSalaryOffered: '₹25,00,000',
      offerId: 'off_902',
      offeredSalary: '₹25,00,000',
      offerStatus: 'released',
      acceptedRejected: 'accepted',
      verificationStatus: 'completed',
      employeeId: 'E002',
      officialEmail: 'jane.admin@onecrm.com',
      reportingManager: 'Sam Director',
      employeeStatus: 'active',
    },
  },
  {
    id: 'c3',
    jobId: null, // talent pool — unassigned
    name: 'Priya Kumar',
    email: 'priya.kumar@gmail.com',
    phone: '+91 91234 56789',
    role: 'Frontend developer',
    currentStage: 'application',
    appliedDate: '2026-06-01',
    fields: {
      applicationSource: 'cold inbound',
      experience: '3 years',
      skills: 'react, typescript, css',
    },
  },
];

/* ============================================================
 * Component
 * ============================================================ */
export default function RecruitmentTracker() {
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [candidates, setCandidates] = useState(SEED_CANDIDATES);

  const [selectedJobId, setSelectedJobId] = useState(null); // null = all candidates
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeViewStage, setActiveViewStage] = useState(null);

  const [jobSearch, setJobSearch] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');

  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJobForm);

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    jobId: '',
  });

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (selectedCandidate) setActiveViewStage(selectedCandidate.currentStage);
    else setActiveViewStage(null);
  }, [selectedCandidate]);

  const flash = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  /* ---------------- jobs ---------------- */
  const filteredJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (j.jobTitle || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
          (j.department || '').toLowerCase().includes(jobSearch.toLowerCase())
      ),
    [jobs, jobSearch]
  );

  const candidatesByJob = useMemo(() => {
    const map = new Map();
    for (const c of candidates) {
      if (!c.jobId) continue;
      map.set(c.jobId, (map.get(c.jobId) || 0) + 1);
    }
    return map;
  }, [candidates]);

  const openCreateJob = () => {
    setEditingJobId(null);
    setJobForm(emptyJobForm);
    setShowJobModal(true);
  };

  const openEditJob = (job) => {
    setEditingJobId(job.id);
    setJobForm({ ...emptyJobForm, ...job });
    setShowJobModal(true);
  };

  const submitJob = (e) => {
    e.preventDefault();
    if (!jobForm.jobTitle) return;
    if (editingJobId) {
      setJobs((prev) => prev.map((j) => (j.id === editingJobId ? { ...j, ...jobForm } : j)));
      flash('job updated');
    } else {
      const newJob = {
        id: `job_${Date.now()}`,
        ...jobForm,
        postedDate: jobForm.postedDate || new Date().toISOString().split('T')[0],
      };
      setJobs((prev) => [newJob, ...prev]);
      flash('job created');
    }
    setShowJobModal(false);
    setEditingJobId(null);
    setJobForm(emptyJobForm);
  };

  /* ---------------- candidates ---------------- */
  const visibleCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (selectedJobId && c.jobId !== selectedJobId) return false;
      const q = candidateSearch.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.role || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    });
  }, [candidates, selectedJobId, candidateSearch]);

  const openCreateCandidate = () => {
    setNewCandidateForm({
      name: '',
      email: '',
      phone: '',
      role: '',
      jobId: selectedJobId || '',
    });
    setShowCandidateModal(true);
  };

  const submitCandidate = (e) => {
    e.preventDefault();
    if (!newCandidateForm.name || !newCandidateForm.email) return;

    const linkedJob = jobs.find((j) => j.id === newCandidateForm.jobId);
    const newCandidate = {
      id: `c_${Date.now()}`,
      jobId: newCandidateForm.jobId || null,
      name: newCandidateForm.name,
      email: newCandidateForm.email,
      phone: newCandidateForm.phone || '',
      role: newCandidateForm.role || linkedJob?.jobTitle || 'unspecified',
      currentStage: 'application',
      appliedDate: new Date().toISOString().split('T')[0],
      fields: {
        appliedDate: new Date().toISOString().split('T')[0],
      },
    };
    setCandidates((prev) => [newCandidate, ...prev]);
    setSelectedCandidate(newCandidate);
    setShowCandidateModal(false);
    flash('candidate added');
  };

  const handleFieldChange = (candidateId, fieldKey, value) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const updated = { ...c, fields: { ...c.fields, [fieldKey]: value } };
        if (selectedCandidate && selectedCandidate.id === candidateId) setSelectedCandidate(updated);
        return updated;
      })
    );
  };

  const promoteCandidate = (candidateId) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const idx = STAGES.findIndex((s) => s.key === c.currentStage);
        if (idx === -1 || idx >= STAGES.length - 1) return c;
        const next = STAGES[idx + 1].key;
        const updated = { ...c, currentStage: next };
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          setSelectedCandidate(updated);
          setActiveViewStage(next);
        }
        flash('pipeline stage updated');
        return updated;
      })
    );
  };

  const reassignCandidateJob = (candidateId, jobId) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const updated = { ...c, jobId: jobId || null };
        if (selectedCandidate && selectedCandidate.id === candidateId) setSelectedCandidate(updated);
        return updated;
      })
    );
  };

  const isFinalStage = (k) => k === STAGES[STAGES.length - 1].key;

  /* ---------------- render ---------------- */
  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">recruitment tracker</h1>
          <p className="text-slate-500 text-sm mt-1">
            jobs are managed at the top; candidates flow through six stages independently of how many jobs they apply to.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateJob}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-all shrink-0"
          >
            <Plus size={14} /> create job
          </button>
          <button
            onClick={openCreateCandidate}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all shrink-0"
          >
            <UserPlus size={14} /> add candidate
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      <div className="space-y-8">
        {/* JOBS PANEL */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center">
                <Briefcase size={14} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">jobs</h3>
                <p className="text-[10px] text-slate-500">
                  {selectedJob
                    ? `filtering candidates by "${selectedJob.jobTitle}" — click again to clear`
                    : 'click a job to filter the candidates list'}
                </p>
              </div>
            </div>
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="search jobs..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                    <th className="px-6 py-4">job</th>
                    <th className="px-6 py-4">department</th>
                    <th className="px-6 py-4">status</th>
                    <th className="px-6 py-4">candidates</th>
                    <th className="px-6 py-4 text-right">actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map((job) => {
                    const isSel = selectedJobId === job.id;
                    const count = candidatesByJob.get(job.id) || 0;
                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedJobId(isSel ? null : job.id)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition ${isSel ? 'bg-indigo-50/40' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-800">{job.jobTitle}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{job.id}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{job.department || '—'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border ${
                              job.jobStatus === 'active'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : job.jobStatus === 'paused'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            {job.jobStatus || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">{count}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditJob(job);
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 rounded-xl text-[10px] font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <Pencil size={11} /> edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-xs text-slate-500">
                        no jobs match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CANDIDATES PANEL */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedJob ? `candidates for "${selectedJob.jobTitle}"` : 'all candidates'}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {selectedJob
                  ? 'showing only candidates linked to the selected job.'
                  : 'showing every candidate across all jobs, including unassigned profiles.'}
              </p>
            </div>
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="search by name, role or email..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500">
                    <th className="px-6 py-4">candidate</th>
                    <th className="px-6 py-4">target role</th>
                    <th className="px-6 py-4">job</th>
                    <th className="px-6 py-4">stage</th>
                    <th className="px-6 py-4 text-right">actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleCandidates.map((cand) => {
                    const stageLabel = STAGES.find((s) => s.key === cand.currentStage)?.label || cand.currentStage;
                    const linkedJob = jobs.find((j) => j.id === cand.jobId);
                    return (
                      <tr
                        key={cand.id}
                        className={`hover:bg-slate-50/50 cursor-pointer transition ${
                          selectedCandidate?.id === cand.id ? 'bg-indigo-50/30' : ''
                        }`}
                        onClick={() => setSelectedCandidate(cand)}
                      >
                        <td className="px-6 py-5">
                          <p className="text-xs font-semibold text-slate-800">{cand.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 lowercase">{cand.email}</p>
                        </td>
                        <td className="px-6 py-5 text-xs font-semibold text-slate-600">{cand.role}</td>
                        <td className="px-6 py-5">
                          {linkedJob ? (
                            <span className="text-[10px] font-semibold text-slate-700">{linkedJob.jobTitle}</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border ${
                              isFinalStage(cand.currentStage)
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            }`}
                          >
                            {stageLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidate(cand);
                            }}
                            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 rounded-xl text-[10px] font-semibold transition-all"
                          >
                            inspect progress
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleCandidates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-xs text-slate-500">
                        no candidates {selectedJob ? 'for this job' : 'match your search'}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CANDIDATE DETAIL */}
        {selectedCandidate ? (
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-slate-150 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 leading-none">selected candidate</p>
                <h3 className="text-xl font-semibold text-slate-900 mt-2">{selectedCandidate.name}</h3>
                <p className="text-xs text-indigo-600 font-semibold mt-1">
                  {selectedCandidate.role}
                  {selectedCandidate.jobId && (
                    <>
                      {' · '}
                      <span className="text-slate-600">linked to {jobs.find((j) => j.id === selectedCandidate.jobId)?.jobTitle || selectedCandidate.jobId}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={selectedCandidate.jobId || ''}
                  onChange={(e) => reassignCandidateJob(selectedCandidate.id, e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-semibold text-slate-700 focus:border-indigo-600 outline-none"
                >
                  <option value="">— unassigned —</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobTitle}
                    </option>
                  ))}
                </select>
                {!isFinalStage(selectedCandidate.currentStage) && (
                  <button
                    onClick={() => promoteCandidate(selectedCandidate.id)}
                    className="px-5 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition rounded-2xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    advance pipeline stage <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-150 rounded-2xl p-6">
              <div className="space-y-1">
                <span className="block text-[9px] font-semibold text-slate-450">contact email</span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 lowercase">
                  <Mail size={12} className="text-slate-400" /> {selectedCandidate.email}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-semibold text-slate-450">phone number</span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone size={12} className="text-slate-400" /> {selectedCandidate.phone || '—'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-semibold text-slate-450">active pipeline stage</span>
                <span className="text-xs font-semibold text-indigo-700">
                  {STAGES.find((s) => s.key === selectedCandidate.currentStage)?.label || selectedCandidate.currentStage}
                </span>
              </div>
            </div>

            {/* 6-stage stepper */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-semibold text-slate-500">six-stage candidate pipeline</h4>
                <p className="text-[9px] text-slate-450 font-semibold">click any stage to inspect or edit its fields</p>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-3.5 scrollbar-thin">
                {STAGES.map((st, idx) => {
                  const currentIdx = STAGES.findIndex((s) => s.key === selectedCandidate.currentStage);
                  const isPassed = currentIdx >= idx;
                  const isActive = selectedCandidate.currentStage === st.key;
                  const isViewing = activeViewStage === st.key;
                  return (
                    <button
                      key={st.key}
                      onClick={() => setActiveViewStage(st.key)}
                      className={`px-4 py-3 rounded-2xl border text-[10px] uppercase font-extrabold shrink-0 transition-all ${
                        isViewing
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 ring-offset-2'
                          : isActive
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-black'
                          : isPassed
                          ? 'bg-indigo-50/50 border-indigo-150 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-450'
                      }`}
                    >
                      {idx + 1}. {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fields per active stage */}
            <div className="border-t border-slate-150 pt-6 space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-[10px] font-semibold text-slate-600">
                    editing stage:{' '}
                    <span className="text-indigo-600 font-semibold">
                      "{STAGES.find((s) => s.key === activeViewStage)?.label}"
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">capture every parameter required to complete this step.</p>
                </div>
                {activeViewStage !== selectedCandidate.currentStage && (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-semibold rounded-lg">
                    viewing historical stage details
                  </span>
                )}
              </div>

              {getStageFields(activeViewStage || selectedCandidate.currentStage).map((section, sIdx) => (
                <div key={sIdx} className="space-y-4">
                  {section.title && (
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600">{section.title}</h5>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {section.fields.map((f) => {
                      const value = selectedCandidate.fields[f.key] || '';
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <label className="text-[9px] font-semibold text-slate-500 ml-1">{f.label}</label>
                          {f.type === 'select' ? (
                            <select
                              value={value}
                              onChange={(e) => handleFieldChange(selectedCandidate.id, f.key, e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer"
                            >
                              <option value="">select option...</option>
                              {f.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : f.type === 'textarea' ? (
                            <textarea
                              value={value}
                              onChange={(e) => handleFieldChange(selectedCandidate.id, f.key, e.target.value)}
                              placeholder={f.placeholder || `enter ${f.label}`}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all min-h-[80px]"
                            />
                          ) : (
                            <input
                              type={f.type}
                              value={value}
                              onChange={(e) => handleFieldChange(selectedCandidate.id, f.key, e.target.value)}
                              placeholder={f.placeholder || `enter ${f.label}`}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {isFinalStage(selectedCandidate.currentStage) && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-semibold">fully onboarded and synced with hrms</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-16 shadow-sm text-center opacity-50">
            <ClipboardList size={36} className="text-indigo-600 mx-auto opacity-70" />
            <p className="text-xs font-semibold text-slate-800 mt-4">no candidate selected</p>
            <p className="text-[10px] text-slate-500 max-w-[300px] mx-auto mt-1">
              select a candidate from the list above to inspect and edit the six-stage pipeline.
            </p>
          </div>
        )}
      </div>

      {/* JOB MODAL (create or edit) */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0">
              <h2 className="text-xs font-semibold text-slate-800">
                {editingJobId ? 'edit job' : 'create new job'}
              </h2>
              <button onClick={() => setShowJobModal(false)} className="text-slate-500 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitJob} className="p-8 space-y-8">
              {JOB_FIELD_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600">{section.title}</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {section.fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-600 ml-1">{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            value={jobForm[f.key] || ''}
                            onChange={(e) => setJobForm({ ...jobForm, [f.key]: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer"
                          >
                            {f.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : f.type === 'textarea' ? (
                          <textarea
                            value={jobForm[f.key] || ''}
                            onChange={(e) => setJobForm({ ...jobForm, [f.key]: e.target.value })}
                            placeholder={f.placeholder || `enter ${f.label}`}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all min-h-[80px]"
                          />
                        ) : (
                          <input
                            type={f.type}
                            value={jobForm[f.key] || ''}
                            onChange={(e) => setJobForm({ ...jobForm, [f.key]: e.target.value })}
                            placeholder={f.placeholder || `enter ${f.label}`}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-[10px] font-semibold hover:bg-slate-50 text-slate-600 transition-all"
                >
                  discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] hover:bg-indigo-700 transition-all shadow-sm"
                >
                  {editingJobId ? 'save changes' : 'create job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE MODAL */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">add new candidate</h2>
              <button onClick={() => setShowCandidateModal(false)} className="text-slate-500 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitCandidate} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-600 ml-1">full name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. john doe"
                  value={newCandidateForm.name}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-600 ml-1">email address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john.doe@gmail.com"
                  value={newCandidateForm.email}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, email: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-600 ml-1">phone number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 99999 88888"
                  value={newCandidateForm.phone}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, phone: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-600 ml-1">link to job (optional)</label>
                <select
                  value={newCandidateForm.jobId}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, jobId: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">— talent pool (unassigned) —</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobTitle} · {j.department}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-450 ml-1">leave unassigned to keep the candidate in the talent pool.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-600 ml-1">target role (defaults to job title)</label>
                <input
                  type="text"
                  placeholder="auto-filled from selected job"
                  value={newCandidateForm.role}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, role: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-[10px] font-semibold hover:bg-slate-50 text-slate-600 transition-all"
                >
                  discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] hover:bg-indigo-700 transition-all shadow-sm"
                >
                  add candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
