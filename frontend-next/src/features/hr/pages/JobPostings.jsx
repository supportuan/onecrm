'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase, Plus, Users, MapPin, Clock, CheckCircle2, X, Save,
  ChevronRight, Search, Filter, ArrowRight, TrendingUp, Eye
} from 'lucide-react';
import { getJobPostings, createJobPosting, updateJobPostingStatus, getCandidates, addCandidate, updateCandidateStage } from '@/services/hrApi';

const JOB_STATUS = {
  DRAFT: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-red-100 text-red-700',
};

const CANDIDATE_STATUS = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  HIRED: 'bg-green-100 text-green-700',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

const STAGES = ['application', 'screening', 'hr_round', 'tech_round', 'manager_round', 'offer_generation', 'onboarding'];

const emptyJobForm = {
  title: '', department: '', location: '', type: 'FULL_TIME',
  description: '', requirements: '', salaryRange: '', status: 'OPEN',
  hiringManager: '', closingDate: '',
};

const emptyCandidateForm = {
  jobId: '', name: '', email: '', phone: '', currentStage: 'application', status: 'ACTIVE',
};

export default function JobPostings() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, candidatesRes] = await Promise.all([getJobPostings(), getCandidates()]);
      if (jobsRes.success) setJobs(jobsRes.data || []);
      if (candidatesRes.success) setCandidates(candidatesRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateJob = async () => {
    setSubmitting(true);
    try {
      const res = await createJobPosting({ ...jobForm, postedAt: new Date().toISOString().split('T')[0] });
      if (res.success) {
        setJobs(prev => [res.data, ...prev]);
        setShowJobModal(false);
        setJobForm(emptyJobForm);
        flash('Job posting created');
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleJobStatusChange = async (id, status) => {
    try {
      const res = await updateJobPostingStatus(id, status);
      if (res.success) {
        setJobs(prev => prev.map(j => j.id === id ? res.data : j));
        flash('Job status updated');
      }
    } catch (e) { console.error(e); }
  };

  const handleAddCandidate = async () => {
    if (!candidateForm.name || !candidateForm.email || !candidateForm.jobId) return;
    setSubmitting(true);
    try {
      const res = await addCandidate(candidateForm);
      if (res.success) {
        setCandidates(prev => [...prev, res.data]);
        setShowCandidateModal(false);
        setCandidateForm(emptyCandidateForm);
        flash('Candidate added');
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleStageChange = async (candidateId, stage) => {
    try {
      const res = await updateCandidateStage(candidateId, stage);
      if (res.success) {
        setCandidates(prev => prev.map(c => c.id === candidateId ? res.data : c));
      }
    } catch (e) { console.error(e); }
  };

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const jobCandidates = selectedJob ? candidates.filter(c => c.jobId === selectedJob.id) : [];

  return (
    <div className="ui-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-emerald-600" />
            Job Postings & Candidate Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage open positions and track candidate progression</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCandidateModal(true); setCandidateForm(f => ({ ...f, jobId: selectedJob?.id || '' })); }}
            className="flex items-center gap-2 border border-emerald-600 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-50"
          >
            <Users className="w-4 h-4" /> Add Candidate
          </button>
          <button
            onClick={() => setShowJobModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> Post Job
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="flex gap-6">
        {/* Jobs List */}
        <div className="basis-1/4 min-w-[16rem] shrink-0">
          <div className="mb-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : filteredJobs.map(job => {
              const count = candidates.filter(c => c.jobId === job.id).length;
              return (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedJob?.id === job.id ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.department}</p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ml-2 ${JOB_STATUS[job.status]}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {job.location}</span>
                    <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {count} candidates</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Candidate Pipeline */}
        <div className="flex-1 min-w-0">
          {selectedJob ? (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{selectedJob.title}</h2>
                    <p className="text-sm text-gray-500">{selectedJob.department} · {selectedJob.location} · {selectedJob.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600 mt-1">Salary: {selectedJob.salaryRange}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedJob.status === 'DRAFT' && (
                      <button onClick={() => handleJobStatusChange(selectedJob.id, 'OPEN')}
                        className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">Publish</button>
                    )}
                    {selectedJob.status === 'OPEN' && (
                      <button onClick={() => handleJobStatusChange(selectedJob.id, 'PAUSED')}
                        className="text-xs px-3 py-1.5 border border-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-50">Pause</button>
                    )}
                    {selectedJob.status === 'OPEN' && (
                      <button onClick={() => handleJobStatusChange(selectedJob.id, 'CLOSED')}
                        className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Close</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Kanban Pipeline */}
              <div className="overflow-x-auto">
                <div className="flex gap-3 pb-2 min-w-max">
                  {STAGES.map(stage => {
                    const stageCandidates = jobCandidates.filter(c => c.currentStage === stage);
                    return (
                      <div key={stage} className="basis-48 grow shrink-0">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2 flex items-center justify-between">
                          <span>{stage.replace('_', ' ')}</span>
                          <span className="bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{stageCandidates.length}</span>
                        </div>
                        <div className="space-y-2 min-h-16">
                          {stageCandidates.map(candidate => (
                            <div key={candidate.id} className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
                              <p className="text-xs font-semibold text-gray-800 truncate">{candidate.name}</p>
                              <p className="text-xs text-gray-400 truncate">{candidate.email}</p>
                              <span className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded font-medium ${CANDIDATE_STATUS[candidate.status]}`}>
                                {candidate.status}
                              </span>
                              {/* Move to next stage */}
                              {STAGES.indexOf(stage) < STAGES.length - 1 && candidate.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleStageChange(candidate.id, STAGES[STAGES.indexOf(stage) + 1])}
                                  className="mt-1.5 w-full text-xs flex items-center justify-center gap-1 text-emerald-600 hover:text-emerald-700 border border-emerald-200 rounded py-0.5 hover:bg-emerald-50"
                                >
                                  Move <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Select a job posting to view the candidate pipeline
            </div>
          )}
        </div>
      </div>

      {/* Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-auto p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">New Job Posting</h2>
              <button onClick={() => setShowJobModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'title', label: 'Job Title', placeholder: 'e.g. Senior Developer', span: true },
                { key: 'department', label: 'Department', placeholder: 'e.g. Engineering' },
                { key: 'location', label: 'Location', placeholder: 'e.g. Remote' },
                { key: 'salaryRange', label: 'Salary Range', placeholder: 'e.g. 18L - 24L' },
                { key: 'hiringManager', label: 'Hiring Manager', placeholder: 'Manager name' },
                { key: 'closingDate', label: 'Closing Date', type: 'date' },
                { key: 'requirements', label: 'Requirements', placeholder: '5+ years, React, Node', span: true },
                { key: 'description', label: 'Job Description', placeholder: 'Role overview...', span: true, textarea: true },
              ].map(f => (
                <div key={f.key} className={f.span ? 'col-span-2' : ''}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  {f.textarea ? (
                    <textarea
                      value={jobForm[f.key]}
                      onChange={e => setJobForm(p => ({ ...p, [f.key]: e.target.value }))}
                      rows={3} placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={jobForm[f.key]}
                      onChange={e => setJobForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Employment Type</label>
                <select value={jobForm.type} onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Publish Status</label>
                <select value={jobForm.status} onChange={e => setJobForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {['DRAFT', 'OPEN'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowJobModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreateJob} disabled={submitting}
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Create Posting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Add Candidate</h2>
              <button onClick={() => setShowCandidateModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Job</label>
                <select value={candidateForm.jobId} onChange={e => setCandidateForm(f => ({ ...f, jobId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select job...</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Candidate full name' },
                { key: 'email', label: 'Email', placeholder: 'email@example.com', type: 'email' },
                { key: 'phone', label: 'Phone', placeholder: '+1-555-0100' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={candidateForm[f.key]}
                    onChange={e => setCandidateForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCandidateModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleAddCandidate} disabled={submitting}
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                Add Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
