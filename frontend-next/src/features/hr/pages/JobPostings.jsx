'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Plus, Users, MapPin, Clock, CheckCircle2, X, Save,
  ChevronLeft, ChevronRight, Search, ArrowRight, Eye, Edit2, History, Upload,
  XCircle, UserCheck, Calendar, FileText, ExternalLink,
} from 'lucide-react';
import {
  getJobPostings, createJobPosting, updateJobPosting, updateJobPostingStatus,
  getCandidates, addCandidate, updateCandidateStage, updateCandidateStatus,
  getCandidateStageEvents, uploadCandidateResume,
} from '@/services/hrApi';

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

const STAGES = ['application', 'screening', 'hr_round', 'tech_round', 'manager_round', 'offer_generation', 'onboarding', 'hired'];

const emptyJobForm = {
  title: '', department: '', location: '', type: 'FULL_TIME',
  description: '', requirements: '', salaryRange: '', status: 'OPEN',
  hiringManager: '', closingDate: '',
};

const emptyCandidateForm = {
  jobId: '', name: '', email: '', phone: '', currentStage: 'application', status: 'ACTIVE',
};

export default function JobPostings() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [stageEvents, setStageEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAllStages, setShowAllStages] = useState(false);
  const [activeStage, setActiveStage] = useState(null);
  const pipelineScrollRef = useRef(null);
  const stageRefs = useRef({});

  const scrollToStage = useCallback((stage) => {
    const column = stageRefs.current[stage];
    const container = pipelineScrollRef.current;
    if (!column || !container) return;
    setActiveStage(stage);
    const left = column.offsetLeft - container.offsetLeft - 12;
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, []);

  const scrollPipeline = (direction) => {
    pipelineScrollRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  };

  useEffect(() => {
    setShowAllStages(false);
    setActiveStage(null);
    setSelectedCandidate(null);
  }, [selectedJob?.id]);

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    if (selectedJob?.id) fetchJobCandidates(selectedJob.id);
    else setCandidates([]);
  }, [selectedJob?.id]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const jobsRes = await getJobPostings();
      if (jobsRes.success) {
        const list = jobsRes.data || [];
        setJobs(list);
        setSelectedJob((prev) => {
          if (prev && list.some((j) => j.id === prev.id)) return list.find((j) => j.id === prev.id) || prev;
          return list[0] || null;
        });
      } else {
        setError('Could not load job postings.');
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load job postings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobCandidates = async (jobId) => {
    setCandidatesLoading(true);
    try {
      const res = await getCandidates(jobId);
      if (res.success) setCandidates(res.data || []);
    } catch (e) {
      console.error(e);
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const refreshAll = async () => {
    await fetchJobs();
    if (selectedJob?.id) await fetchJobCandidates(selectedJob.id);
    flash('Refreshed');
  };

  const handleCreateJob = async () => {
    setSubmitting(true);
    try {
      if (editingJobId) {
        const res = await updateJobPosting(editingJobId, jobForm);
        if (res.success) {
          setJobs((prev) => prev.map((j) => (j.id === editingJobId ? res.data : j)));
          if (selectedJob?.id === editingJobId) setSelectedJob(res.data);
          setShowJobModal(false);
          setEditingJobId(null);
          setJobForm(emptyJobForm);
          flash('Job posting updated');
        }
      } else {
        const res = await createJobPosting({ ...jobForm, postedAt: new Date().toISOString().split('T')[0] });
        if (res.success) {
          setJobs((prev) => [res.data, ...prev]);
          setSelectedJob(res.data);
          setShowJobModal(false);
          setJobForm(emptyJobForm);
          flash('Job posting created');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditJob = (job) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
      salaryRange: job.salaryRange,
      status: job.status,
      hiringManager: job.hiringManager,
      closingDate: job.closingDate || '',
    });
    setShowJobModal(true);
  };

  const handleJobStatusChange = async (id, status) => {
    try {
      const res = await updateJobPostingStatus(id, status);
      if (res.success) {
        setJobs(prev => prev.map(j => j.id === id ? res.data : j));
        if (selectedJob?.id === id) setSelectedJob(res.data);
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
        let created = res.data;
        if (resumeFile) {
          const up = await uploadCandidateResume(created.id, resumeFile);
          if (up.success) created = up.data;
        }
        setCandidates((prev) => [...prev, created]);
        if (selectedJob?.id === created.jobId) {
          setJobs((prev) => prev.map((j) => (
            j.id === created.jobId ? { ...j, applicantsCount: (j.applicantsCount || 0) + 1 } : j
          )));
        }
        setShowCandidateModal(false);
        setCandidateForm(emptyCandidateForm);
        setResumeFile(null);
        flash('Candidate added');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageChange = async (candidateId, stage, status) => {
    try {
      const res = await updateCandidateStage(candidateId, stage, status);
      if (res.success) {
        setCandidates((prev) => prev.map((c) => (c.id === candidateId ? res.data : c)));
        if (selectedCandidate?.id === candidateId) {
          setSelectedCandidate(res.data);
          loadStageEvents(candidateId);
        }
        setTimeout(() => scrollToStage(stage), 50);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCandidateStatus = async (candidateId, status) => {
    try {
      const res = await updateCandidateStatus(candidateId, status);
      if (res.success) {
        setCandidates((prev) => prev.map((c) => (c.id === candidateId ? res.data : c)));
        if (selectedCandidate?.id === candidateId) {
          setSelectedCandidate(res.data);
          loadStageEvents(candidateId);
        }
        flash(`Candidate marked ${status.toLowerCase()}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStageEvents = async (candidateId) => {
    try {
      const res = await getCandidateStageEvents(candidateId);
      if (res.success) setStageEvents(res.data || []);
    } catch {
      setStageEvents([]);
    }
  };

  const selectCandidate = async (candidate) => {
    setSelectedCandidate(candidate);
    await loadStageEvents(candidate.id);
  };

  const goToTab = (tab, candidate) => {
    router.push(`/hr/recruitment-tracker?tab=${tab}&candidateId=${candidate.id}`);
  };

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const jobCandidates = candidates;

  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage] = jobCandidates.filter((c) => c.currentStage === stage).length;
    return acc;
  }, {});

  const populatedStages = STAGES.filter((s) => stageCounts[s] > 0);
  const pipelineStages = showAllStages || populatedStages.length === 0 ? STAGES : populatedStages;
  const hiddenPopulatedCount = showAllStages ? 0 : populatedStages.length;

  return (
    <div className="ui-page max-w-full overflow-x-hidden">
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
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
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

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          <button onClick={fetchJobs} className="text-xs underline shrink-0">Retry</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="flex gap-6 min-w-0 max-w-full items-start">
        {/* Jobs List */}
        <div className="basis-1/4 min-w-[16rem] max-w-xs shrink-0 flex flex-col max-h-[calc(100vh-10rem)]">
          <div className="mb-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No job postings yet.
                <button onClick={() => setShowJobModal(true)} className="block mx-auto mt-2 text-emerald-600 hover:underline text-xs">
                  Post your first job
                </button>
              </div>
            ) : filteredJobs.map(job => {
              const count = job.applicantsCount ?? 0;
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
        <div className="flex-1 min-w-0 overflow-hidden">
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
                    <button
                      onClick={() => openEditJob(selectedJob)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
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

              {/* Stage overview — click to jump */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="overflow-x-auto flex-1 min-w-0 pb-1 [scrollbar-width:thin]">
                  <div className="flex gap-2 flex-nowrap min-w-min">
                    {STAGES.map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => {
                          if (!showAllStages && stageCounts[stage] > 0 && !pipelineStages.includes(stage)) {
                            setShowAllStages(true);
                            setTimeout(() => scrollToStage(stage), 80);
                          } else {
                            scrollToStage(stage);
                          }
                        }}
                        className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap transition-colors ${
                          activeStage === stage
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : stageCounts[stage] > 0
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {stage.replace(/_/g, ' ')} ({stageCounts[stage]})
                      </button>
                    ))}
                  </div>
                </div>
                {jobCandidates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllStages((v) => !v)}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap shrink-0"
                  >
                    {showAllStages ? 'Active stages only' : `All stages (${STAGES.length})`}
                  </button>
                )}
              </div>

              {!showAllStages && hiddenPopulatedCount > 0 && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
                  Showing {hiddenPopulatedCount} stage{hiddenPopulatedCount !== 1 ? 's' : ''} with candidates.
                  {' '}Use <strong>All stages</strong> to move candidates into empty steps.
                </p>
              )}

              {candidatesLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Loading candidates…</div>
              ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => scrollPipeline(-1)}
                  className="absolute left-1 top-10 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md text-gray-600 hover:bg-gray-50"
                  aria-label="Scroll pipeline left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollPipeline(1)}
                  className="absolute right-1 top-10 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md text-gray-600 hover:bg-gray-50"
                  aria-label="Scroll pipeline right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div
                  ref={pipelineScrollRef}
                  className="overflow-x-auto overflow-y-visible max-w-full rounded-xl border border-gray-200 bg-neutral-50/80 px-10 py-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] overscroll-x-contain"
                >
                <div className="flex gap-3 pb-1 w-max">
                  {pipelineStages.map(stage => {
                    const stageCandidates = jobCandidates.filter(c => c.currentStage === stage);
                    const hasCandidates = stageCandidates.length > 0;
                    return (
                      <div
                        key={stage}
                        ref={(el) => { stageRefs.current[stage] = el; }}
                        className={`w-52 shrink-0 snap-start rounded-lg p-1 transition-colors ${
                          hasCandidates ? 'bg-emerald-50/80 ring-1 ring-emerald-200' : 'bg-transparent'
                        } ${activeStage === stage ? 'ring-2 ring-emerald-400' : ''}`}
                      >
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2 flex items-center justify-between">
                          <span>{stage.replace('_', ' ')}</span>
                          <span className="bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{stageCandidates.length}</span>
                        </div>
                        <div className="space-y-2 min-h-16">
                          {stageCandidates.map(candidate => (
                            <div
                              key={candidate.id}
                              onClick={() => selectCandidate(candidate)}
                              className={`bg-white border rounded-lg p-2.5 shadow-sm cursor-pointer transition-all ${
                                selectedCandidate?.id === candidate.id ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-gray-200'
                              }`}
                            >
                              <p className="text-xs font-semibold text-gray-800 truncate">{candidate.name}</p>
                              <p className="text-xs text-gray-400 truncate">{candidate.email}</p>
                              <span className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded font-medium ${CANDIDATE_STATUS[candidate.status]}`}>
                                {candidate.status}
                              </span>
                              {candidate.status === 'ACTIVE' && (
                                <select
                                  className="mt-1.5 w-full text-[10px] border border-gray-200 rounded py-0.5"
                                  value={candidate.currentStage}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleStageChange(candidate.id, e.target.value)}
                                >
                                  {STAGES.map((s) => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ))}
                          {!hasCandidates && !showAllStages && (
                            <p className="text-[10px] text-gray-400 text-center py-4 px-1">No candidates</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
              )}

              {!candidatesLoading && jobCandidates.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                  No candidates for this role yet.
                  <button
                    onClick={() => { setShowCandidateModal(true); setCandidateForm((f) => ({ ...f, jobId: selectedJob.id })); }}
                    className="block mx-auto mt-2 text-emerald-600 hover:underline text-xs"
                  >
                    Add first candidate
                  </button>
                </div>
              )}

              {selectedCandidate && (
                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedCandidate.name}</h3>
                      <p className="text-sm text-gray-500">{selectedCandidate.email} · {selectedCandidate.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Stage: {selectedCandidate.currentStage.replace(/_/g, ' ')} · Status: {selectedCandidate.status}
                      </p>
                      {selectedCandidate.resumeUrl && (
                        <a
                          href={selectedCandidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View resume
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button onClick={() => goToTab('interviews', selectedCandidate)} className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Schedule interview
                      </button>
                      <button onClick={() => goToTab('offers', selectedCandidate)} className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Create offer
                      </button>
                      {selectedCandidate.status === 'ACTIVE' && (
                        <>
                          <button onClick={() => handleCandidateStatus(selectedCandidate.id, 'REJECTED')} className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                          <button onClick={() => handleStageChange(selectedCandidate.id, 'hired', 'HIRED')} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Hire
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {stageEvents.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-2">
                        <History className="w-3 h-3" /> Stage history
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {stageEvents.map((ev) => (
                          <p key={ev.id} className="text-[10px] text-gray-500">
                            {new Date(ev.createdAt).toLocaleString()} — {(ev.fromStage || 'start').replace(/_/g, ' ')} → {ev.toStage.replace(/_/g, ' ')}
                            {ev.changedByName ? ` · ${ev.changedByName}` : ''}
                            {ev.notes ? ` · ${ev.notes}` : ''}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              <h2 className="font-semibold text-gray-900">{editingJobId ? 'Edit Job Posting' : 'New Job Posting'}</h2>
              <button onClick={() => { setShowJobModal(false); setEditingJobId(null); setJobForm(emptyJobForm); }}><X className="w-5 h-5 text-gray-400" /></button>
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
                <Save className="w-4 h-4" /> {editingJobId ? 'Save changes' : 'Create posting'}
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
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Resume (optional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                />
              </div>
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
