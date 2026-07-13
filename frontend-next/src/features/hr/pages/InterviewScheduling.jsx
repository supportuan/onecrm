'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar, Plus, Video, MapPin, Phone, Star, CheckCircle2, X,
  Clock, Users, MessageSquare, Save, ThumbsUp, ThumbsDown, RefreshCw,
} from 'lucide-react';
import {
  getInterviews, scheduleInterview, updateInterviewStatus,
  submitInterviewFeedback, rescheduleInterview, getCandidates, getJobPostings,
} from '@/services/hrApi';
import CandidateSelect from '@/features/hr/components/CandidateSelect';

const TYPE_META = {
  VIRTUAL: { label: 'Virtual', icon: Video, color: 'text-blue-500' },
  IN_PERSON: { label: 'In Person', icon: MapPin, color: 'text-green-500' },
  PHONE: { label: 'Phone', icon: Phone, color: 'text-purple-500' },
};

const STATUS_BADGE = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-yellow-100 text-yellow-700',
};

const RECOMMENDATION_META = {
  STRONG_HIRE: { label: 'Strong Hire', color: 'text-green-600' },
  HIRE: { label: 'Hire', color: 'text-blue-600' },
  MAYBE: { label: 'Maybe', color: 'text-yellow-600' },
  NO_HIRE: { label: 'No Hire', color: 'text-red-600' },
};

const emptyForm = {
  candidateId: '', candidateName: '', jobTitle: '', round: '',
  type: 'VIRTUAL', scheduledAt: '', duration: 60, interviewers: '', meetingLink: '', status: 'SCHEDULED',
};

const emptyFeedback = { rating: 5, technicalScore: '', communicationScore: '', recommendation: 'HIRE', notes: '', submittedBy: '' };

export default function InterviewScheduling() {
  const searchParams = useSearchParams();
  const prefillCandidateId = searchParams.get('candidateId');

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [rescheduleLink, setRescheduleLink] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState(emptyFeedback);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => { fetchInterviews(); }, []);

  useEffect(() => {
    if (!prefillCandidateId) return;
    (async () => {
      const [candRes, jobsRes] = await Promise.all([getCandidates(), getJobPostings()]);
      const c = (candRes.data || []).find((x) => x.id === prefillCandidateId);
      const job = (jobsRes.data || []).find((j) => j.id === c?.jobId);
      if (c) {
        setForm((f) => ({
          ...f,
          candidateId: c.id,
          candidateName: c.name,
          jobTitle: job?.title || f.jobTitle,
        }));
        setShowScheduleModal(true);
      }
    })();
  }, [prefillCandidateId]);

  const handleCandidatePick = (id, candidate) => {
    if (!candidate) {
      setForm((f) => ({ ...f, candidateId: '', candidateName: '' }));
      return;
    }
    setForm((f) => ({
      ...f,
      candidateId: id,
      candidateName: candidate.name,
      jobTitle: candidate.jobTitle || f.jobTitle,
    }));
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !rescheduleAt) return;
    setSubmitting(true);
    try {
      const res = await rescheduleInterview(rescheduleModal.id, {
        scheduledAt: rescheduleAt,
        meetingLink: rescheduleLink || undefined,
      });
      if (res.success) {
        setInterviews((prev) => prev.map((i) => (i.id === rescheduleModal.id ? res.data : i)));
        setRescheduleModal(null);
        flash('Interview rescheduled');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await getInterviews();
      if (res.success) setInterviews(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSchedule = async () => {
    if (!form.candidateName || !form.jobTitle || !form.scheduledAt) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        interviewers: form.interviewers.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await scheduleInterview(payload);
      if (res.success) {
        setInterviews(prev => [res.data, ...prev]);
        setShowScheduleModal(false);
        setForm(emptyForm);
        flash('Interview scheduled successfully');
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await updateInterviewStatus(id, status);
      if (res.success) {
        setInterviews(prev => prev.map(i => i.id === id ? res.data : i));
        flash('Interview status updated');
      }
    } catch (e) { console.error(e); }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackModal || !feedback.notes || !feedback.submittedBy) return;
    setSubmitting(true);
    try {
      const payload = {
        ...feedback,
        technicalScore: feedback.technicalScore ? Number(feedback.technicalScore) : undefined,
        communicationScore: feedback.communicationScore ? Number(feedback.communicationScore) : undefined,
        rating: Number(feedback.rating),
      };
      const res = await submitInterviewFeedback(feedbackModal.id, payload);
      if (res.success) {
        setInterviews(prev => prev.map(i => i.id === feedbackModal.id ? res.data : i));
        setFeedbackModal(null);
        setFeedback(emptyFeedback);
        flash('Feedback submitted successfully');
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const filtered = filterStatus === 'ALL' ? interviews : interviews.filter(i => i.status === filterStatus);

  return (
    <div className="ui-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-neutral-600" />
            Interview Scheduling
          </h1>
          <p className="text-sm text-gray-500 mt-1">Schedule interviews and capture structured feedback</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-hover"
        >
          <Plus className="w-4 h-4" /> Schedule Interview
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['ALL', 'SCHEDULED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s ? 'bg-neutral-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? `All (${interviews.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${interviews.filter(i => i.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading interviews...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(interview => {
            const typeMeta = TYPE_META[interview.type];
            const TypeIcon = typeMeta.icon;
            return (
              <div key={interview.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gray-50 shrink-0`}>
                      <TypeIcon className={`w-5 h-5 ${typeMeta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{interview.candidateName}</p>
                        <span className="text-xs text-gray-400">·</span>
                        <p className="text-sm text-gray-600">{interview.jobTitle}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[interview.status]}`}>
                          {interview.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(interview.scheduledAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {interview.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {interview.interviewers?.join(', ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{interview.round} · {typeMeta.label}</p>
                      {interview.meetingLink && (
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-neutral-600 hover:underline mt-0.5 block">
                          {interview.meetingLink}
                        </a>
                      )}
                      {interview.feedback && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-700">Feedback</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star key={n} className={`w-3 h-3 ${n <= interview.feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                            <span className={`font-semibold ${RECOMMENDATION_META[interview.feedback.recommendation]?.color}`}>
                              {RECOMMENDATION_META[interview.feedback.recommendation]?.label}
                            </span>
                          </div>
                          <p className="text-gray-600 italic">"{interview.feedback.notes}"</p>
                          <p className="text-gray-400 mt-0.5">— {interview.feedback.submittedBy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {interview.status === 'SCHEDULED' && (
                      <>
                        <button
                          onClick={() => {
                            setRescheduleModal(interview);
                            setRescheduleAt(interview.scheduledAt?.slice(0, 16) || '');
                            setRescheduleLink(interview.meetingLink || '');
                          }}
                          className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-100 flex items-center gap-1 text-gray-600"
                        >
                          <RefreshCw className="w-3 h-3" /> Reschedule
                        </button>
                        <button
                          onClick={() => { setFeedbackModal(interview); }}
                          className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-100 flex items-center gap-1 text-gray-600"
                        >
                          <MessageSquare className="w-3 h-3" /> Feedback
                        </button>
                        <button
                          onClick={() => handleStatusChange(interview.id, 'CANCELLED')}
                          className="text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50 text-red-500"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div className="text-center py-16 text-gray-400 text-sm">No interviews found for this filter.</div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-brand/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-auto p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Schedule Interview</h2>
              <button onClick={() => setShowScheduleModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">Candidate</label>
                <CandidateSelect value={form.candidateId} onChange={handleCandidatePick} />
              </div>
              {[
                { key: 'jobTitle', label: 'Job Title', placeholder: 'e.g. Senior Developer' },
                { key: 'round', label: 'Round', placeholder: 'e.g. Technical Round' },
                { key: 'scheduledAt', label: 'Date & Time', type: 'datetime-local' },
                { key: 'duration', label: 'Duration (min)', type: 'number', placeholder: '60' },
                { key: 'interviewers', label: 'Interviewers (comma-separated)', placeholder: 'Alice, Bob', span: true },
                { key: 'meetingLink', label: 'Meeting Link', placeholder: 'https://', span: true },
              ].map(f => (
                <div key={f.key} className={f.span ? 'col-span-2' : ''}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Interview Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200">
                  {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleSchedule} disabled={submitting}
                className="flex-1 bg-neutral-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-hover disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-brand/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Submit Feedback — {feedbackModal.candidateName}</h2>
              <button onClick={() => setFeedbackModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">Overall Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setFeedback(f => ({ ...f, rating: n }))}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold ${feedback.rating >= n ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Technical Score (/100)</label>
                  <input type="number" min="0" max="100" value={feedback.technicalScore} onChange={e => setFeedback(f => ({ ...f, technicalScore: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Communication (/100)</label>
                  <input type="number" min="0" max="100" value={feedback.communicationScore} onChange={e => setFeedback(f => ({ ...f, communicationScore: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Recommendation</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(RECOMMENDATION_META).map(([k, v]) => (
                    <button key={k} onClick={() => setFeedback(f => ({ ...f, recommendation: k }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${feedback.recommendation === k ? 'border-neutral-400 bg-neutral-100 text-neutral-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                <textarea value={feedback.notes} onChange={e => setFeedback(f => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Detailed observations..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Your Name</label>
                <input value={feedback.submittedBy} onChange={e => setFeedback(f => ({ ...f, submittedBy: e.target.value }))}
                  placeholder="Interviewer name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setFeedbackModal(null)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleFeedbackSubmit} disabled={submitting}
                className="flex-1 bg-neutral-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleModal && (
        <div className="fixed inset-0 bg-brand/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Reschedule interview</h2>
            <p className="text-sm text-gray-500 mb-4">{rescheduleModal.candidateName} — {rescheduleModal.round}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">New date & time</label>
                <input type="datetime-local" value={rescheduleAt} onChange={(e) => setRescheduleAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Meeting link</label>
                <input value={rescheduleLink} onChange={(e) => setRescheduleLink(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRescheduleModal(null)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={handleReschedule} disabled={submitting} className="flex-1 bg-neutral-700 text-white rounded-lg py-2 text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
