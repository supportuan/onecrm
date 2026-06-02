'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  UserPlus, 
  FileText, 
  CheckCircle2, 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  X, 
  Filter, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  ClipboardList,
  Upload,
  Fingerprint,
  Users,
  Save,
  Mail,
  Phone
} from 'lucide-react';

export default function RecruitmentTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  
  // Track which stage's fields the user is currently viewing/editing
  const [activeViewStage, setActiveViewStage] = useState(null);

  // Sync activeViewStage when candidate selection changes
  useEffect(() => {
    if (selectedCandidate) {
      setActiveViewStage(selectedCandidate.currentStage);
    } else {
      setActiveViewStage(null);
    }
  }, [selectedCandidate]);

  // New profile form state
  const [newProfileForm, setNewProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Senior developer',
    department: 'Engineering'
  });

  // 14 Stage flow definitions (strictly lowercase/sentence case)
  const STAGES = [
    { key: 'requirement', label: 'job requirement created' },
    { key: 'posting', label: 'job posting' },
    { key: 'application', label: 'candidate application' },
    { key: 'screening', label: 'resume screening' },
    { key: 'hr_round', label: 'initial hr round' },
    { key: 'tech_round', label: 'technical round' },
    { key: 'manager_round', label: 'managerial round' },
    { key: 'hr_discussion', label: 'final hr discussion' },
    { key: 'offer_generation', label: 'offer letter generation' },
    { key: 'candidate_response', label: 'candidate response' },
    { key: 'bg_verification', label: 'background verification' },
    { key: 'document_collection', label: 'document collection' },
    { key: 'onboarding', label: 'employee onboarding' },
    { key: 'hrms_created', label: 'employee created in hrms' }
  ];

  // Specific fields configured per stage as requested
  const STAGE_FIELDS = {
    requirement: [
      { key: 'jobId', label: 'job id', type: 'text', placeholder: 'e.g. job_101' },
      { key: 'jobTitle', label: 'job title', type: 'text', placeholder: 'e.g. senior developer' },
      { key: 'department', label: 'department', type: 'text', placeholder: 'e.g. engineering' },
      { key: 'hiringManager', label: 'hiring manager', type: 'text', placeholder: 'e.g. jane admin' },
      { key: 'employmentType', label: 'employment type', type: 'text', placeholder: 'e.g. full time' },
      { key: 'experienceRequired', label: 'experience required', type: 'text', placeholder: 'e.g. 5+ years' },
      { key: 'salaryRange', label: 'salary range', type: 'text', placeholder: 'e.g. 18,00,000 - 24,00,000' },
      { key: 'skillsRequired', label: 'skills required', type: 'text', placeholder: 'e.g. react, node, postgres' },
      { key: 'jobDescription', label: 'job description', type: 'textarea', placeholder: 'enter details...' },
      { key: 'openPositionsCount', label: 'open positions count', type: 'number', placeholder: 'e.g. 3' },
      { key: 'jobLocation', label: 'job location', type: 'text', placeholder: 'e.g. Chicago office' },
      { key: 'workMode', label: 'work mode', type: 'select', options: ['remote', 'hybrid', 'onsite'] },
      { key: 'applicationDeadline', label: 'application deadline', type: 'date' }
    ],
    posting: [
      { key: 'postingChannel', label: 'posting channel', type: 'text', placeholder: 'e.g. linkedin, indeed' },
      { key: 'careerPortalUrl', label: 'career portal url', type: 'text' },
      { key: 'linkedinUrl', label: 'linkedin url', type: 'text' },
      { key: 'jobStatus', label: 'job status', type: 'select', options: ['active', 'paused', 'closed'] },
      { key: 'postedDate', label: 'posted date', type: 'date' },
      { key: 'recruiterAssigned', label: 'recruiter assigned', type: 'text' }
    ],
    application: [
      { key: 'candidateId', label: 'candidate id', type: 'text' },
      { key: 'fullName', label: 'full name', type: 'text' },
      { key: 'email', label: 'email', type: 'email' },
      { key: 'phoneNumber', label: 'phone number', type: 'text' },
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
      { key: 'appliedDate', label: 'applied date', type: 'date' }
    ],
    screening: [
      { key: 'screeningStatus', label: 'screening status', type: 'select', options: ['passed', 'failed', 'pending'] },
      { key: 'recruiterNotes', label: 'recruiter notes', type: 'textarea' },
      { key: 'skillMatchPct', label: 'skill match %', type: 'text' },
      { key: 'resumeScore', label: 'resume score', type: 'text' },
      { key: 'shortlisted', label: 'shortlisted', type: 'select', options: ['yes', 'no'] },
      { key: 'rejectionReason', label: 'rejection reason', type: 'text' },
      { key: 'screeningDate', label: 'screening date', type: 'date' }
    ],
    hr_round: [
      { key: 'interviewId', label: 'interview id', type: 'text' },
      { key: 'interviewDate', label: 'interview date', type: 'date' },
      { key: 'interviewTime', label: 'interview time', type: 'text' },
      { key: 'interviewMode', label: 'interview mode', type: 'select', options: ['online', 'in-person'] },
      { key: 'interviewerName', label: 'interviewer name', type: 'text' },
      { key: 'communicationSkillsRating', label: 'communication skills rating', type: 'text' },
      { key: 'hrFeedback', label: 'hr feedback', type: 'textarea' },
      { key: 'candidateStatus', label: 'candidate status', type: 'text' },
      { key: 'nextRoundRecommendation', label: 'next round recommendation', type: 'text' }
    ],
    tech_round: [
      { key: 'technicalInterviewer', label: 'technical interviewer', type: 'text' },
      { key: 'codingScore', label: 'coding score', type: 'text' },
      { key: 'technicalSkillsRating', label: 'technical skills rating', type: 'text' },
      { key: 'problemSolvingRating', label: 'problem solving rating', type: 'text' },
      { key: 'assignmentLink', label: 'assignment/test link', type: 'text' },
      { key: 'testScore', label: 'test score', type: 'text' },
      { key: 'technicalFeedback', label: 'technical feedback', type: 'textarea' },
      { key: 'recommendation', label: 'recommendation', type: 'text' }
    ],
    manager_round: [
      { key: 'managerName', label: 'manager name', type: 'text' },
      { key: 'leadershipRating', label: 'leadership rating', type: 'text' },
      { key: 'teamFitRating', label: 'team fit rating', type: 'text' },
      { key: 'behavioralFeedback', label: 'behavioral feedback', type: 'textarea' },
      { key: 'decisionStatus', label: 'decision status', type: 'select', options: ['approved', 'rejected', 'pending'] }
    ],
    hr_discussion: [
      { key: 'finalSalaryOffered', label: 'final salary offered', type: 'text' },
      { key: 'bonusDetails', label: 'bonus details', type: 'text' },
      { key: 'joiningDateDiscussion', label: 'joining date discussion', type: 'text' },
      { key: 'shiftDetails', label: 'shift details', type: 'text' },
      { key: 'workLocation', label: 'work location', type: 'text' },
      { key: 'finalHrComments', label: 'final hr comments', type: 'textarea' }
    ],
    offer_generation: [
      { key: 'offerId', label: 'offer id', type: 'text' },
      { key: 'offeredSalary', label: 'offered salary', type: 'text' },
      { key: 'designation', label: 'designation', type: 'text' },
      { key: 'offerDepartment', label: 'department', type: 'text' },
      { key: 'doj', label: 'doj (date of joining)', type: 'date' },
      { key: 'offerLetterPdf', label: 'offer letter pdf', type: 'text' },
      { key: 'offerExpiryDate', label: 'offer expiry date', type: 'date' },
      { key: 'offerStatus', label: 'offer status', type: 'select', options: ['draft', 'released', 'expired'] }
    ],
    candidate_response: [
      { key: 'acceptedRejected', label: 'accepted / rejected', type: 'select', options: ['accepted', 'rejected', 'negotiating'] },
      { key: 'candidateRemarks', label: 'candidate remarks', type: 'textarea' },
      { key: 'negotiatedSalary', label: 'negotiated salary', type: 'text' },
      { key: 'acceptanceDate', label: 'acceptance date', type: 'date' }
    ],
    bg_verification: [
      { key: 'aadhaarPanVerification', label: 'aadhaar/pan verification', type: 'select', options: ['verified', 'failed', 'pending'] },
      { key: 'addressVerification', label: 'address verification', type: 'select', options: ['verified', 'failed', 'pending'] },
      { key: 'educationVerification', label: 'education verification', type: 'select', options: ['verified', 'failed', 'pending'] },
      { key: 'employmentVerification', label: 'employment verification', type: 'select', options: ['verified', 'failed', 'pending'] },
      { key: 'verificationStatus', label: 'verification status', type: 'select', options: ['completed', 'failed', 'in-progress'] },
      { key: 'verificationReport', label: 'verification report', type: 'text' }
    ],
    document_collection: [
      { key: 'aadhaarCard', label: 'aadhaar card', type: 'text', placeholder: 'uploaded file' },
      { key: 'panCard', label: 'pan card', type: 'text' },
      { key: 'passportPhoto', label: 'passport photo', type: 'text' },
      { key: 'resumeCopy', label: 'resume copy', type: 'text' },
      { key: 'educationalCertificates', label: 'educational certificates', type: 'text' },
      { key: 'experienceLetters', label: 'experience letters', type: 'text' },
      { key: 'bankDetails', label: 'bank details', type: 'text' },
      { key: 'offerAcceptanceCopy', label: 'offer acceptance copy', type: 'text' },
      { key: 'uploadedDate', label: 'uploaded date', type: 'date' }
    ],
    onboarding: [
      { key: 'employeeId', label: 'employee id', type: 'text' },
      { key: 'officialEmail', label: 'official email', type: 'email' },
      { key: 'departmentAllocation', label: 'department allocation', type: 'text' },
      { key: 'reportingManager', label: 'reporting manager', type: 'text' },
      { key: 'systemAccess', label: 'system access', type: 'text' },
      { key: 'assetAllocation', label: 'asset allocation', type: 'text' },
      { key: 'orientationSchedule', label: 'orientation schedule', type: 'text' },
      { key: 'trainingAssigned', label: 'training assigned', type: 'text' }
    ],
    hrms_created: [
      { key: 'employeeStatus', label: 'employee status', type: 'select', options: ['active', 'probation', 'training'] },
      { key: 'payrollSetup', label: 'payroll setup', type: 'select', options: ['completed', 'pending'] },
      { key: 'attendanceSetup', label: 'attendance setup', type: 'select', options: ['completed', 'pending'] },
      { key: 'leavePolicyAssigned', label: 'leave policy assigned', type: 'text' },
      { key: 'rolePermissions', label: 'role permissions', type: 'text' },
      { key: 'joiningConfirmation', label: 'joining confirmation', type: 'select', options: ['confirmed', 'delayed'] }
    ]
  };

  // State preseeded candidates
  const [candidates, setCandidates] = useState([
    {
      id: 'c1',
      name: 'Raju Kalla',
      email: 'raju.kalla@gmail.com',
      phone: '+91 98765 43210',
      role: 'Senior developer',
      department: 'Engineering',
      currentStage: 'tech_round',
      appliedDate: '2026-05-18',
      fields: {
        jobId: 'job_101',
        jobTitle: 'Senior developer',
        experienceRequired: '5+ years',
        salaryRange: '₹18,00,000 - ₹24,00,000',
        jobLocation: 'Chicago office',
        workMode: 'hybrid',
        postingChannel: 'LinkedIn',
        careerPortalUrl: 'https://careers.onecrm.com/jobs/101',
        recruiterAssigned: 'Alice Smith',
        expectedSalary: '₹22,00,000',
        noticePeriod: '30 days',
        applicationSource: 'LinkedIn referral',
        screeningStatus: 'shortlisted',
        skillMatchPct: '92%',
        resumeScore: '8.8/10',
        interviewerName: 'Alice Smith',
        communicationSkillsRating: '4.5/5',
        hrFeedback: 'Strong cultural fit and communications.',
        technicalInterviewer: 'Jane Admin',
        codingScore: '88/100',
        technicalSkillsRating: '4.6/5',
        testScore: '90%'
      }
    },
    {
      id: 'c2',
      name: 'Jane Admin',
      email: 'jane.admin@onecrm.com',
      phone: '+91 99988 87766',
      role: 'Operations manager',
      department: 'Operations',
      currentStage: 'hrms_created',
      appliedDate: '2026-05-02',
      fields: {
        jobId: 'job_102',
        jobTitle: 'Operations manager',
        experienceRequired: '8+ years',
        salaryRange: '₹20,00,000 - ₹26,00,000',
        jobLocation: 'New York office',
        workMode: 'onsite',
        postingChannel: 'Direct career site',
        careerPortalUrl: 'https://careers.onecrm.com/jobs/102',
        recruiterAssigned: 'Alice Smith',
        expectedSalary: '₹24,00,000',
        noticePeriod: 'immediate',
        applicationSource: 'organic search',
        screeningStatus: 'shortlisted',
        skillMatchPct: '98%',
        resumeScore: '9.5/10',
        interviewerName: 'Alice Smith',
        communicationSkillsRating: '5.0/5',
        hrFeedback: 'exceptional leader profiles.',
        technicalInterviewer: 'Bob Johnson',
        codingScore: 'not applicable',
        technicalSkillsRating: '4.9/5',
        testScore: '95%',
        managerName: 'Jane Admin',
        leadershipRating: '5.0/5',
        teamFitRating: '4.8/5',
        behavioralFeedback: 'highly recommended.',
        finalSalaryOffered: '₹25,00,000',
        offerId: 'off_902',
        offeredSalary: '₹25,00,000',
        offerStatus: 'accepted',
        verificationStatus: 'verified',
        employeeId: 'E002',
        officialEmail: 'jane.admin@onecrm.com',
        reportingManager: 'Alice Smith',
        employeeStatus: 'active'
      }
    }
  ]);

  // Create new profile
  const handleCreateProfile = (e) => {
    e.preventDefault();
    if (!newProfileForm.name || !newProfileForm.email) return;

    const newCandidate = {
      id: `c_${Date.now()}`,
      name: newProfileForm.name,
      email: newProfileForm.email,
      phone: newProfileForm.phone || '+91 99999 88888',
      role: newProfileForm.role,
      department: newProfileForm.department,
      currentStage: 'requirement', // starts at flow stage 1
      appliedDate: new Date().toISOString().split('T')[0],
      fields: {
        jobTitle: newProfileForm.role,
        department: newProfileForm.department,
        fullName: newProfileForm.name,
        email: newProfileForm.email,
        phoneNumber: newProfileForm.phone
      }
    };

    setCandidates([newCandidate, ...candidates]);
    setSelectedCandidate(newCandidate);
    setShowAddProfileModal(false);
    setNewProfileForm({
      name: '',
      email: '',
      phone: '',
      role: 'Senior developer',
      department: 'Engineering'
    });
    setSuccessMessage('new profile created successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Dynamic field update
  const handleFieldChange = (candidateId, fieldKey, value) => {
    setCandidates(prev => prev.map(cand => {
      if (cand.id === candidateId) {
        const updated = {
          ...cand,
          fields: {
            ...cand.fields,
            [fieldKey]: value
          }
        };
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          setSelectedCandidate(updated);
        }
        return updated;
      }
      return cand;
    }));
  };

  // Advance stage
  const promoteCandidate = (candidateId) => {
    setCandidates(prev => prev.map(cand => {
      if (cand.id === candidateId) {
        const currentIdx = STAGES.findIndex(s => s.key === cand.currentStage);
        if (currentIdx !== -1 && currentIdx < STAGES.length - 1) {
          const nextStage = STAGES[currentIdx + 1].key;
          const updated = {
            ...cand,
            currentStage: nextStage
          };
          if (selectedCandidate && selectedCandidate.id === candidateId) {
            setSelectedCandidate(updated);
            setActiveViewStage(nextStage); // Sync viewed fields with active promotion
          }
          setSuccessMessage('pipeline stage updated successfully');
          setTimeout(() => setSuccessMessage(''), 3000);
          return updated;
        }
      }
      return cand;
    }));
  };

  const filteredCandidates = candidates.filter(cand => 
    (cand.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cand.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      {/* Title */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900 font-sans">
            recruitment tracker
          </h1>
          <p className="text-slate-555 text-sm mt-1 font-sans">
            manage the complete candidate acquisition flow from initial job requirements to onboarding and hrms sync.
          </p>
        </div>

        <button
          onClick={() => setShowAddProfileModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:scale-[1.01] hover:shadow-lg hover:bg-indigo-700 transition-all shrink-0"
        >
          <UserPlus size={14} />
          create new profile
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Candidates List Row */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="filter profiles by name or role..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all font-sans"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-semibold text-slate-600 font-sans shrink-0">
              {filteredCandidates.length} profiles listed
            </div>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-550 font-sans">
                    <th className="px-6 py-4">candidate</th>
                    <th className="px-6 py-4">target role</th>
                    <th className="px-6 py-4">active pipeline phase</th>
                    <th className="px-6 py-4 text-right">actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredCandidates.map((cand) => {
                    const currentStageLabel = STAGES.find(s => s.key === cand.currentStage)?.label || cand.currentStage;
                    return (
                      <tr 
                        key={cand.id} 
                        className={`hover:bg-slate-50/50 transition-all duration-200 cursor-pointer ${selectedCandidate?.id === cand.id ? 'bg-indigo-50/30' : ''}`}
                        onClick={() => setSelectedCandidate(cand)}
                      >
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-xs font-semibold text-slate-855">{cand.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 lowercase">{cand.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-semibold text-slate-600">
                          {cand.role}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-widest rounded-lg border ${
                            cand.currentStage === 'hrms_created'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          }`}>
                            {currentStageLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidate(cand);
                            }}
                            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-600 text-slate-600 hover:text-indigo-650 rounded-xl text-[10px] font-semibold transition-all"
                          >
                            inspect progress
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Applicant Profile Details Panel (full-width w-full container) */}
        {selectedCandidate ? (
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in duration-300 font-sans">
            <div className="border-b border-slate-150 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 leading-none">selected applicant profile</p>
                <h3 className="text-xl font-semibold text-slate-900 mt-2">{selectedCandidate.name}</h3>
                <p className="text-xs text-indigo-655 font-semibold mt-1">{selectedCandidate.role} · {selectedCandidate.department}</p>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedCandidate.currentStage !== 'hrms_created' && (
                  <button
                    onClick={() => promoteCandidate(selectedCandidate.id)}
                    className="px-5 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition rounded-2xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    advance pipeline stage <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} /> {successMessage}
              </div>
            )}

            {/* Candidate Overview Card Details */}
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
                  <Phone size={12} className="text-slate-400" /> {selectedCandidate.phone}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-semibold text-slate-450">active pipeline phase</span>
                <span className="text-xs font-semibold text-indigo-700">
                  {STAGES.find(s => s.key === selectedCandidate.currentStage)?.label || selectedCandidate.currentStage}
                </span>
              </div>
            </div>

            {/* Stepper Pipeline Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-semibold text-slate-500">14-stage workflow pipeline execution</h4>
                <p className="text-[9px] text-slate-450 font-semibold lowercase">💡 click any stage below to inspect or edit its fields</p>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-3.5 scrollbar-thin">
                {STAGES.map((st, idx) => {
                  const isPassed = STAGES.findIndex(s => s.key === selectedCandidate.currentStage) >= idx;
                  const isActive = selectedCandidate.currentStage === st.key;
                  const isCurrentlyViewing = activeViewStage === st.key;
                  return (
                    <button 
                      key={st.key}
                      onClick={() => setActiveViewStage(st.key)}
                      className={`px-4 py-3 rounded-2xl border text-[10px] uppercase font-extrabold shrink-0 transition-all ${
                        isCurrentlyViewing
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

            {/* Dynamic Stage Parameter Fields Form */}
            <div className="border-t border-slate-150 pt-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-[10px] font-semibold text-slate-600">
                    fields viewing/editing stage: <span className="text-indigo-600 font-semibold">"{STAGES.find(s => s.key === activeViewStage)?.label}"</span>
                  </h4>
                  <p className="text-[10px] text-slate-450 mt-0.5 lowercase">modify and store specific parameters for this particular step.</p>
                </div>
                {activeViewStage !== selectedCandidate.currentStage && (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-semibold rounded-lg">
                    viewing historical stage details
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(STAGE_FIELDS[activeViewStage || selectedCandidate.currentStage] || []).map((f) => {
                  const value = selectedCandidate.fields[f.key] || '';
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <label className="text-[9px] font-semibold text-slate-500 ml-1">{f.label}</label>
                      {f.type === 'select' ? (
                        <select
                          value={value}
                          onChange={(e) => handleFieldChange(selectedCandidate.id, f.key, e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer font-sans"
                        >
                          <option value="">select option...</option>
                          {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          value={value}
                          onChange={(e) => handleFieldChange(selectedCandidate.id, f.key, e.target.value)}
                          placeholder={f.placeholder || `enter ${f.label}`}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-855 focus:border-indigo-600 outline-none transition-all font-sans min-h-[80px]"
                        />
                      ) : (
                        <input
                          type={f.type}
                          value={value}
                          onChange={(e) => handleFieldChange(selectedCandidate.id, f.key, e.target.value)}
                          placeholder={f.placeholder || `enter ${f.label}`}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-855 focus:border-indigo-600 outline-none transition-all font-sans"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedCandidate.currentStage === 'hrms_created' && (
                <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-semibold">fully sync\'d & onboarded to hrms portal</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-16 shadow-sm text-center opacity-50 font-sans">
            <ClipboardList size={36} className="text-indigo-600 mx-auto opacity-70" />
            <p className="text-xs font-semibold text-slate-800 mt-4">no candidate selected</p>
            <p className="text-[10px] text-slate-555 max-w-[300px] mx-auto mt-1 lowercase">select an active profile from the list above to inspect and edit details with our full-width pipeline explorer.</p>
          </div>
        )}
      </div>

      {/* Create New Profile Modal Form */}
      {showAddProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-semibold text-slate-800">create new candidate profile</h2>
              <button 
                onClick={() => setShowAddProfileModal(false)} 
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProfile} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-600 ml-1">full name</label>
                <input
                  type="text" 
                  required
                  placeholder="e.g. John Doe"
                  value={newProfileForm.name}
                  onChange={e => setNewProfileForm({ ...newProfileForm, name: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-600 ml-1">email address</label>
                <input
                  type="email" 
                  required
                  placeholder="e.g. john.doe@gmail.com"
                  value={newProfileForm.email}
                  onChange={e => setNewProfileForm({ ...newProfileForm, email: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-850 focus:border-indigo-600 outline-none transition-all font-sans"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-600 ml-1">phone number</label>
                <input
                  type="text" 
                  placeholder="e.g. +91 99999 88888"
                  value={newProfileForm.phone}
                  onChange={e => setNewProfileForm({ ...newProfileForm, phone: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-850 focus:border-indigo-600 outline-none transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-600 ml-1">target role</label>
                  <input
                    type="text"
                    required
                    value={newProfileForm.role}
                    onChange={e => setNewProfileForm({ ...newProfileForm, role: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-850 focus:border-indigo-600 outline-none transition-all font-sans"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-600 ml-1">department</label>
                  <select
                    value={newProfileForm.department}
                    onChange={e => setNewProfileForm({ ...newProfileForm, department: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:border-indigo-600 outline-none transition-all appearance-none cursor-pointer font-sans"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddProfileModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 rounded-2xl text-[10px] font-semibold hover:bg-slate-50 text-slate-600 transition-all font-sans"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-[10px] hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-1.5 font-sans"
                >
                  Confirm profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
