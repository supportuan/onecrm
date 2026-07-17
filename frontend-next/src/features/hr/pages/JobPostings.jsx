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
  DRAFT: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
  CLOSED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CANDIDATE_STATUS = {
  ACTIVE: 'bg-sky-50 text-sky-700 border-sky-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  HIRED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WITHDRAWN: 'bg-neutral-100 text-neutral-500 border-neutral-200',
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
    <div className="max-w-full overflow-x-hidden space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="ui-text-h2 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand" />
            Jobs & candidate pipeline
          </h2>
          <p className="ui-text-meta mt-1">Select a posting, move candidates through stages, hire or reject.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refreshAll} disabled={loading} className="ui-btn-secondary text-sm disabled:opacity-50">
            Refresh
          </button>
          <button
            type="button"
            onClick={() => { setShowCandidateModal(true); setCandidateForm((f) => ({ ...f, jobId: selectedJob?.id || '' })); }}
            className="ui-btn-secondary text-sm inline-flex items-center gap-2"
          >
            <Users className="h-4 w-4" /> Add candidate
          </button>
          <button
            type="button"
            onClick={() => { setEditingJobId(null); setJobForm(emptyJobForm); setShowJobModal(true); }}
            className="ui-btn-primary text-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Post job
          </button>
        </div>
      </div>

      {error && (
        <div className="ui-error flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={fetchJobs} className="text-sm underline shrink-0">Retry</button>
        </div>
      )}
      {successMsg && (
        <div className="ui-success inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {successMsg}
        </div>
      )}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start min-w-0">
        {/* Jobs list */}
        <aside className="ui-panel w-full xl:w-80 xl:shrink-0 flex flex-col max-h-[min(70vh,720px)] overflow-hidden">
          <div className="border-b border-neutral-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs…"
                className="ui-input pl-9"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {loading ? (
              <p className="ui-text-meta py-8 text-center">Loading jobs…</p>
            ) : filteredJobs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="ui-text-strong">No job postings yet</p>
                <button type="button" onClick={() => setShowJobModal(true)} className="ui-link mt-2 text-sm">
                  Post your first job
                </button>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const count = job.applicantsCount ?? 0;
                const active = selectedJob?.id === job.id;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                      active
                        ? 'border-brand bg-brand-soft/50 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{job.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{job.department}</p>
                      </div>
                      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${JOB_STATUS[job.status]}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{count} candidates</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Pipeline */}
        <section className="min-w-0 flex-1 space-y-4">
          {selectedJob ? (
            <>
              <div className="ui-panel p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-900">{selectedJob.title}</h3>
                    <p className="ui-text-meta mt-1">
                      {selectedJob.department} · {selectedJob.location} · {selectedJob.type.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-neutral-700">
                      Salary: {selectedJob.salaryRange || 'Not listed'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEditJob(selectedJob)} className="ui-btn-secondary text-sm inline-flex items-center gap-1.5">
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    {selectedJob.status === 'DRAFT' && (
                      <button type="button" onClick={() => handleJobStatusChange(selectedJob.id, 'OPEN')} className="ui-btn-primary text-sm">
                        Publish
                      </button>
                    )}
                    {selectedJob.status === 'OPEN' && (
                      <>
                        <button type="button" onClick={() => handleJobStatusChange(selectedJob.id, 'PAUSED')} className="ui-btn-secondary text-sm text-amber-700">
                          Pause
                        </button>
                        <button type="button" onClick={() => handleJobStatusChange(selectedJob.id, 'CLOSED')} className="ui-btn-secondary text-sm text-rose-600">
                          Close
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  <div className="flex min-w-min flex-nowrap gap-2">
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
                        className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          activeStage === stage
                            ? 'border-brand bg-brand text-white'
                            : stageCounts[stage] > 0
                              ? 'border-brand/25 bg-brand-soft text-brand hover:bg-brand-soft/80'
                              : 'border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-50'
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
                    className="ui-btn-ghost shrink-0 text-xs"
                  >
                    {showAllStages ? 'Active stages only' : `All stages (${STAGES.length})`}
                  </button>
                )}
              </div>

              {!showAllStages && hiddenPopulatedCount > 0 && (
                <p className="rounded-xl border border-brand/15 bg-brand-soft/60 px-3 py-2 text-sm text-brand">
                  Showing {hiddenPopulatedCount} stage{hiddenPopulatedCount !== 1 ? 's' : ''} with candidates.
                  Use <strong>All stages</strong> to move people into empty steps.
                </p>
              )}

              {candidatesLoading ? (
                <p className="ui-text-meta py-12 text-center">Loading candidates…</p>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => scrollPipeline(-1)}
                    className="absolute left-1 top-12 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md hover:bg-neutral-50"
                    aria-label="Scroll pipeline left"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollPipeline(1)}
                    className="absolute right-1 top-12 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md hover:bg-neutral-50"
                    aria-label="Scroll pipeline right"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div
                    ref={pipelineScrollRef}
                    className="max-w-full overflow-x-auto overflow-y-visible scroll-smooth rounded-2xl border border-neutral-200 bg-neutral-50/90 px-10 py-4 snap-x snap-mandatory [scrollbar-width:thin] overscroll-x-contain"
                  >
                    <div className="flex w-max gap-3 pb-1">
                      {pipelineStages.map((stage) => {
                        const stageCandidates = jobCandidates.filter((c) => c.currentStage === stage);
                        const hasCandidates = stageCandidates.length > 0;
                        return (
                          <div
                            key={stage}
                            ref={(el) => { stageRefs.current[stage] = el; }}
                            className={`w-56 shrink-0 snap-start rounded-xl p-2 transition ${
                              hasCandidates ? 'bg-white ring-1 ring-brand/20 shadow-sm' : 'bg-transparent'
                            } ${activeStage === stage ? 'ring-2 ring-brand' : ''}`}
                          >
                            <div className="mb-2 flex items-center justify-between px-1">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                {stage.replace(/_/g, ' ')}
                              </span>
                              <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-600">
                                {stageCandidates.length}
                              </span>
                            </div>
                            <div className="min-h-16 space-y-2">
                              {stageCandidates.map((candidate) => (
                                <div
                                  key={candidate.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => selectCandidate(candidate)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') selectCandidate(candidate); }}
                                  className={`cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition ${
                                    selectedCandidate?.id === candidate.id
                                      ? 'border-brand ring-1 ring-brand/30'
                                      : 'border-neutral-200 hover:border-neutral-300'
                                  }`}
                                >
                                  <p className="truncate text-sm font-semibold text-neutral-900">{candidate.name}</p>
                                  <p className="truncate text-xs text-neutral-500">{candidate.email}</p>
                                  <span className={`mt-2 inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${CANDIDATE_STATUS[candidate.status]}`}>
                                    {candidate.status}
                                  </span>
                                  {candidate.status === 'ACTIVE' && (
                                    <select
                                      className="ui-input mt-2 py-1.5 text-xs"
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
                              {!hasCandidates && (
                                <p className="px-1 py-6 text-center text-xs text-neutral-400">Empty</p>
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
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white py-10 text-center">
                  <p className="ui-text-strong">No candidates for this role yet</p>
                  <button
                    type="button"
                    onClick={() => { setShowCandidateModal(true); setCandidateForm((f) => ({ ...f, jobId: selectedJob.id })); }}
                    className="ui-link mt-2 text-sm"
                  >
                    Add first candidate
                  </button>
                </div>
              )}

              {selectedCandidate && (
                <div className="ui-panel p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">{selectedCandidate.name}</h3>
                      <p className="ui-text-meta mt-1">
                        {selectedCandidate.email} · {selectedCandidate.phone || 'No phone'}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600">
                        Stage: <span className="font-medium">{selectedCandidate.currentStage.replace(/_/g, ' ')}</span>
                        {' · '}Status: <span className="font-medium">{selectedCandidate.status}</span>
                      </p>
                      {selectedCandidate.resumeUrl && (
                        <a
                          href={selectedCandidate.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ui-link mt-2 inline-flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View resume
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => goToTab('interviews', selectedCandidate)} className="ui-btn-secondary text-sm inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Schedule interview
                      </button>
                      <button type="button" onClick={() => goToTab('offers', selectedCandidate)} className="ui-btn-secondary text-sm inline-flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Create offer
                      </button>
                      {selectedCandidate.status === 'ACTIVE' && (
                        <>
                          <button type="button" onClick={() => handleCandidateStatus(selectedCandidate.id, 'REJECTED')} className="ui-btn-secondary text-sm text-rose-600 inline-flex items-center gap-1.5">
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                          <button type="button" onClick={() => handleStageChange(selectedCandidate.id, 'hired', 'HIRED')} className="ui-btn-primary text-sm inline-flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5" /> Hire
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {stageEvents.length > 0 && (
                    <div className="mt-4 border-t border-neutral-100 pt-4">
                      <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
                        <History className="h-3.5 w-3.5" /> Stage history
                      </p>
                      <div className="max-h-36 space-y-1.5 overflow-y-auto">
                        {stageEvents.map((ev) => (
                          <p key={ev.id} className="text-xs text-neutral-500">
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
            <div className="ui-panel flex h-64 flex-col items-center justify-center text-center">
              <Briefcase className="mb-3 h-8 w-8 text-neutral-300" />
              <p className="ui-text-strong">Select a job posting</p>
              <p className="ui-text-meta mt-1">Choose a role on the left to open its candidate pipeline.</p>
            </div>
          )}
        </section>
      </div>

      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/30 p-4 backdrop-blur-sm">
          <div className="ui-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-900">{editingJobId ? 'Edit job posting' : 'New job posting'}</h2>
              <button type="button" onClick={() => { setShowJobModal(false); setEditingJobId(null); setJobForm(emptyJobForm); }} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              {[
                { key: 'title', label: 'Job title', placeholder: 'e.g. Senior Developer', span: true },
                { key: 'department', label: 'Department', placeholder: 'e.g. Engineering' },
                { key: 'location', label: 'Location', placeholder: 'e.g. Remote' },
                { key: 'salaryRange', label: 'Salary range', placeholder: 'e.g. 18L - 24L' },
                { key: 'hiringManager', label: 'Hiring manager', placeholder: 'Manager name' },
                { key: 'closingDate', label: 'Closing date', type: 'date' },
                { key: 'requirements', label: 'Requirements', placeholder: '5+ years, React, Node', span: true },
                { key: 'description', label: 'Job description', placeholder: 'Role overview…', span: true, textarea: true },
              ].map((f) => (
                <div key={f.key} className={f.span ? 'sm:col-span-2' : ''}>
                  <label className="ui-label">{f.label}</label>
                  {f.textarea ? (
                    <textarea
                      value={jobForm[f.key]}
                      onChange={(e) => setJobForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      rows={3}
                      placeholder={f.placeholder}
                      className="ui-input resize-none"
                    />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={jobForm[f.key]}
                      onChange={(e) => setJobForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="ui-input"
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="ui-label">Employment type</label>
                <select value={jobForm.type} onChange={(e) => setJobForm((p) => ({ ...p, type: e.target.value }))} className="ui-input">
                  {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'].map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ui-label">Publish status</label>
                <select value={jobForm.status} onChange={(e) => setJobForm((p) => ({ ...p, status: e.target.value }))} className="ui-input">
                  {['DRAFT', 'OPEN'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-neutral-100 px-6 py-4">
              <button type="button" onClick={() => setShowJobModal(false)} className="ui-btn-secondary flex-1">Cancel</button>
              <button type="button" onClick={handleCreateJob} disabled={submitting} className="ui-btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Save className="h-4 w-4" /> {editingJobId ? 'Save changes' : 'Create posting'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand/30 p-4 backdrop-blur-sm">
          <div className="ui-modal w-full max-w-md p-0">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-900">Add candidate</h2>
              <button type="button" onClick={() => setShowCandidateModal(false)} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="ui-label">Job</label>
                <select value={candidateForm.jobId} onChange={(e) => setCandidateForm((f) => ({ ...f, jobId: e.target.value }))} className="ui-input">
                  <option value="">Select job…</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
              {[
                { key: 'name', label: 'Full name', placeholder: 'Candidate full name' },
                { key: 'email', label: 'Email', placeholder: 'email@example.com', type: 'email' },
                { key: 'phone', label: 'Phone', placeholder: '+1-555-0100' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="ui-label">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={candidateForm[f.key]}
                    onChange={(e) => setCandidateForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="ui-input"
                  />
                </div>
              ))}
              <div>
                <label className="ui-label">Resume (optional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-neutral-600"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-neutral-100 px-6 py-4">
              <button type="button" onClick={() => setShowCandidateModal(false)} className="ui-btn-secondary flex-1">Cancel</button>
              <button type="button" onClick={handleAddCandidate} disabled={submitting} className="ui-btn-primary flex-1 disabled:opacity-50">
                Add candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
