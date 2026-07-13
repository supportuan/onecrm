'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Save,
  Eye,
  Settings,
  Printer,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  getOfferLetters,
  createOfferLetter,
  updateOfferLetterStatus,
  acceptOfferLetter,
  rejectOfferLetter,
  getOfferLetterTemplates,
  createOfferLetterTemplate,
  renderOfferLetter,
  getCandidates,
  getJobPostings,
  getOnboardingTemplates,
} from '@/services/hrApi';
import CandidateSelect from '@/features/hr/components/CandidateSelect';

const DEFAULT_TEMPLATE_HTML = `<h1>Offer of Employment</h1>
<p>Dear {{candidateName}},</p>
<p>{{companyName}} is pleased to offer you the position of <strong>{{jobTitle}}</strong> in the {{department}} department.</p>
<h3>Compensation</h3>
<p>Annual compensation: <strong>INR {{offeredSalary}}</strong></p>
<h3>Joining</h3>
<ul>
  <li>Joining date: <strong>{{joiningDate}}</strong></li>
  <li>This offer is valid until <strong>{{expiryDate}}</strong>.</li>
  <li>{{conditionalClause}}</li>
</ul>
<p>By accepting this offer, you agree to abide by all company policies including confidentiality, code of conduct and the employee handbook.</p>
<p>Sincerely,<br/>{{companyName}} HR</p>`;

const STATUS_META = {
  DRAFT:    { label: 'Draft',    tint: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: Clock },
  SENT:     { label: 'Sent',     tint: 'bg-sky-50 text-sky-700 border-sky-100',              icon: Send },
  ACCEPTED: { label: 'Accepted', tint: 'bg-emerald-50 text-emerald-700 border-emerald-100',  icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', tint: 'bg-rose-50 text-rose-700 border-rose-100',           icon: XCircle },
  EXPIRED:  { label: 'Expired',  tint: 'bg-amber-50 text-amber-700 border-amber-100',        icon: AlertCircle },
};

const STATUS_TRANSITIONS = {
  DRAFT: ['SENT'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

const emptyForm = {
  candidateId: '',
  candidateName: '',
  candidateEmail: '',
  jobTitle: '',
  department: '',
  offeredSalary: '',
  joiningDate: '',
  expiryDate: '',
  status: 'DRAFT',
  policyTemplate: 'standard',
  templateId: '',
  conditional: false,
};

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return '—';
  }
};

export default function OfferLetters() {
  const searchParams = useSearchParams();
  const prefillCandidateId = searchParams.get('candidateId');

  const [letters, setLetters] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [onboardingTemplates, setOnboardingTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAcceptFor, setShowAcceptFor] = useState(null);
  const [pickedOnboardingId, setPickedOnboardingId] = useState('');
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewMeta, setPreviewMeta] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', bodyHtml: DEFAULT_TEMPLATE_HTML });

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toast, setToast] = useState('');

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    fetchLetters();
    fetchTemplates();
    getOnboardingTemplates()
      .then((r) => setOnboardingTemplates(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {});
  }, []);

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
          candidateEmail: c.email,
          jobTitle: job?.title || f.jobTitle,
          department: job?.department || f.department,
        }));
        setShowCreate(true);
      }
    })();
  }, [prefillCandidateId]);

  const fetchTemplates = async () => {
    try {
      const res = await getOfferLetterTemplates();
      if (res.success) setTemplates(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const res = await getOfferLetters();
      if (res.success) setLetters(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidatePick = (id, candidate) => {
    if (!candidate) {
      setForm((f) => ({ ...f, candidateId: '', candidateName: '', candidateEmail: '' }));
      return;
    }
    (async () => {
      const jobsRes = await getJobPostings();
      const job = (jobsRes.data || []).find((j) => j.id === candidate.jobId);
      setForm((f) => ({
        ...f,
        candidateId: id,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        jobTitle: job?.title || f.jobTitle,
        department: job?.department || f.department,
      }));
    })();
  };

  const handleCreate = async () => {
    if (
      !form.candidateId ||
      !form.candidateName ||
      !form.candidateEmail ||
      !form.jobTitle ||
      !form.offeredSalary
    )
      return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        offeredSalary: Number(form.offeredSalary),
        templateId: form.templateId || undefined,
      };
      const res = await createOfferLetter(payload);
      if (res.success) {
        setLetters((prev) => [res.data, ...prev]);
        setShowCreate(false);
        setForm(emptyForm);
        flash('Offer letter created');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async (letterId) => {
    try {
      const res = await renderOfferLetter(letterId);
      if (res.success) {
        setPreviewHtml(res.data?.html || '');
        setPreviewMeta(res.data?.offer || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = (letterId) => {
    window.open(`/hr/offer-letters/${letterId}/print`, '_blank', 'noopener');
  };

  const handleStatusChange = async (id, status) => {
    if (status === 'ACCEPTED') {
      setShowAcceptFor(id);
      setPickedOnboardingId('');
      return;
    }
    if (status === 'REJECTED') {
      if (!window.confirm('Mark this offer as rejected? The candidate will be notified internally.')) return;
      try {
        const res = await rejectOfferLetter(id);
        if (res.success) {
          await fetchLetters();
          flash('Offer letter rejected');
        }
      } catch (e) {
        console.error(e);
      }
      return;
    }
    try {
      const res = await updateOfferLetterStatus(id, status);
      if (res.success) await fetchLetters();
      flash(`Offer letter ${status.toLowerCase()}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptConfirm = async () => {
    if (!showAcceptFor) return;
    setSubmitting(true);
    try {
      const res = await acceptOfferLetter(showAcceptFor, pickedOnboardingId || undefined);
      if (res.success) {
        await fetchLetters();
        setShowAcceptFor(null);
        setPickedOnboardingId('');
        flash('Offer accepted — employee created and onboarding checklist spawned');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.bodyHtml) return;
    try {
      const res = await createOfferLetterTemplate(newTemplate);
      if (res.success) {
        setTemplates((prev) => [...prev, res.data]);
        setNewTemplate({ name: '', bodyHtml: DEFAULT_TEMPLATE_HTML });
        flash('Template saved');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stats = useMemo(() => {
    const out = { ALL: letters.length };
    Object.keys(STATUS_META).forEach((s) => (out[s] = 0));
    letters.forEach((l) => (out[l.status] = (out[l.status] || 0) + 1));
    return out;
  }, [letters]);

  const filtered = filterStatus === 'ALL' ? letters : letters.filter((l) => l.status === filterStatus);

  return (
    <div className="text-brand">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl bg-emerald-500 text-white ui-text-strong !text-white flex items-center gap-2">
          <CheckCircle2 size={14} /> {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="ui-text-meta">
          Generate, send, and track offer letters with company-policy templates.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl ui-text-strong text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 transition-all"
          >
            <Settings size={13} /> Templates
            <span className="px-1.5 py-px rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
              {templates.length}
            </span>
          </button>
          <button
            onClick={() => {
              setForm(emptyForm);
              setShowCreate(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl ui-text-strong !text-white bg-brand hover:bg-brand-hover transition-all"
          >
            <Plus size={13} /> Generate offer
          </button>
        </div>
      </div>

      {/* Stat filter chips */}
      <div className="ui-surface mb-5 p-3 flex flex-wrap gap-2">
        <FilterChip label="All" count={stats.ALL} active={filterStatus === 'ALL'} onClick={() => setFilterStatus('ALL')} />
        {Object.entries(STATUS_META).map(([s, m]) => (
          <FilterChip
            key={s}
            label={m.label}
            count={stats[s] ?? 0}
            active={filterStatus === s}
            tint={m.tint}
            icon={m.icon}
            onClick={() => setFilterStatus(filterStatus === s ? 'ALL' : s)}
          />
        ))}
      </div>

      {/* Table */}
      <div className="ui-surface overflow-hidden">
        {loading ? (
          <div className="p-16 text-center ui-text-meta">Loading offer letters…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 mx-auto flex items-center justify-center">
              <FileText size={18} className="text-neutral-400" />
            </div>
            <p className="ui-text-strong mt-4">No offer letters in this view.</p>
            <p className="ui-text-meta mt-1">Click "Generate offer" to create the first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/60">
                  {['Candidate', 'Role · Department', 'Salary', 'Joining', 'Expires', 'Template', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 ui-text-caption uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((letter) => {
                  const meta = STATUS_META[letter.status];
                  const Icon = meta.icon;
                  const next = STATUS_TRANSITIONS[letter.status];
                  const templateName =
                    templates.find((t) => t.id === letter.templateId)?.name ||
                    letter.policyTemplate ||
                    'Default';
                  return (
                    <tr key={letter.id} className="hover:bg-neutral-50/70 transition-all">
                      <td className="px-4 py-3">
                        <p className="ui-text-strong">{letter.candidateName}</p>
                        <p className="text-[12px] text-neutral-500">{letter.candidateEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="ui-text-strong">{letter.jobTitle}</p>
                        <p className="text-[12px] text-neutral-500">{letter.department}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="ui-text-strong">{formatCurrency(letter.offeredSalary)}</p>
                        {letter.conditional && (
                          <p className="text-[11px] font-medium text-amber-600 mt-0.5">Conditional</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-neutral-700">{formatDate(letter.joiningDate)}</td>
                      <td className="px-4 py-3 text-[12.5px] text-neutral-700">{formatDate(letter.expiryDate)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-600">
                          {templateName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${meta.tint}`}>
                          <Icon size={11} /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <RowAction icon={Eye} label="Preview" onClick={() => handlePreview(letter.id)} />
                          <RowAction icon={Printer} label="Print" onClick={() => handlePrint(letter.id)} />
                          {next.map((s) => (
                            <RowAction
                              key={s}
                              label={s === 'SENT' ? 'Send' : s === 'ACCEPTED' ? 'Accept' : s === 'REJECTED' ? 'Reject' : 'Mark expired'}
                              onClick={() => handleStatusChange(letter.id, s)}
                              kind={s === 'ACCEPTED' ? 'primary' : s === 'REJECTED' ? 'danger' : 'default'}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Generate offer letter" onClose={() => setShowCreate(false)} wide>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FieldLabel>Candidate</FieldLabel>
              <CandidateSelect value={form.candidateId} onChange={handleCandidatePick} />
            </div>
            <FormField label="Email" type="email" value={form.candidateEmail} onChange={(v) => setForm({ ...form, candidateEmail: v })} />
            <FormField label="Job title" value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} />
            <FormField label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
            <FormField label="Offered salary (INR)" type="number" value={form.offeredSalary} onChange={(v) => setForm({ ...form, offeredSalary: v })} />
            <FormField label="Joining date" type="date" value={form.joiningDate} onChange={(v) => setForm({ ...form, joiningDate: v })} />
            <FormField label="Offer expiry" type="date" value={form.expiryDate} onChange={(v) => setForm({ ...form, expiryDate: v })} />
            <div className="md:col-span-2">
              <FieldLabel>Letter template</FieldLabel>
              <select
                value={form.templateId}
                onChange={(e) => {
                  const t = templates.find((x) => x.id === e.target.value);
                  setForm((p) => ({
                    ...p,
                    templateId: e.target.value,
                    policyTemplate: t?.name || p.policyTemplate,
                  }));
                }}
                className="ui-field"
              >
                <option value="">Default company template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.isDefault ? ' (default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <label className="md:col-span-2 flex items-center gap-2 px-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={form.conditional}
                onChange={(e) => setForm({ ...form, conditional: e.target.checked })}
                className="accent-neutral-900"
              />
              <span className="ui-text-body">Mark as conditional offer (subject to reference/background checks)</span>
            </label>
          </div>
          <div className="flex gap-2.5 pt-5 mt-2 border-t border-neutral-100">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 py-2.5 border border-neutral-200 rounded-xl ui-text-strong text-neutral-700 hover:bg-neutral-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl ui-text-strong !text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save size={13} /> Generate
            </button>
          </div>
        </Modal>
      )}

      {/* Preview modal */}
      {previewHtml != null && (
        <Modal
          title="Offer letter preview"
          onClose={() => {
            setPreviewHtml(null);
            setPreviewMeta(null);
          }}
          wide
        >
          <article
            className="prose prose-sm max-w-none px-1 py-2 max-h-[60vh] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <div className="flex gap-2.5 pt-5 mt-2 border-t border-neutral-100">
            <button
              onClick={() => {
                setPreviewHtml(null);
                setPreviewMeta(null);
              }}
              className="flex-1 py-2.5 border border-neutral-200 rounded-xl ui-text-strong text-neutral-700 hover:bg-neutral-50 transition-all"
            >
              Close
            </button>
            {previewMeta && (
              <button
                onClick={() => handlePrint(previewMeta.id)}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl ui-text-strong !text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Printer size={13} /> Open print view
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Accept-with-onboarding confirmation */}
      {showAcceptFor && (
        <Modal title="Accept offer" onClose={() => setShowAcceptFor(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="ui-text-strong text-emerald-900">Accepting this offer will:</p>
                <ul className="ui-text-body !text-emerald-800 mt-1 space-y-0.5 list-disc list-inside">
                  <li>Create an employee record from the candidate</li>
                  <li>Spawn an onboarding checklist (due dates computed from joining date)</li>
                  <li>Move the candidate to "Hired"</li>
                </ul>
              </div>
            </div>
            <div>
              <FieldLabel>Onboarding template</FieldLabel>
              <select
                value={pickedOnboardingId}
                onChange={(e) => setPickedOnboardingId(e.target.value)}
                className="ui-field"
              >
                <option value="">Default onboarding template</option>
                {onboardingTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.isDefault ? ' (default)' : ''}
                    {t.role ? ` — ${t.role}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2.5 pt-5 mt-2 border-t border-neutral-100">
            <button
              onClick={() => setShowAcceptFor(null)}
              className="flex-1 py-2.5 border border-neutral-200 rounded-xl ui-text-strong text-neutral-700 hover:bg-neutral-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAcceptConfirm}
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl ui-text-strong !text-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={13} /> Accept &amp; create employee
            </button>
          </div>
        </Modal>
      )}

      {/* Templates manager */}
      {showTemplates && (
        <Modal title="Offer letter templates" onClose={() => setShowTemplates(false)} wide>
          <div className="space-y-4">
            {templates.length > 0 && (
              <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                {templates.map((t) => (
                  <li key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="ui-text-strong">
                        {t.name}
                        {t.isDefault && (
                          <span className="ml-2 text-[10px] uppercase font-semibold tracking-wide text-neutral-500">
                            Default
                          </span>
                        )}
                      </p>
                      {t.description && <p className="ui-text-meta">{t.description}</p>}
                    </div>
                    <ChevronRight size={14} className="text-neutral-300" />
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-neutral-100 pt-4">
              <h3 className="ui-text-h3">Add template</h3>
              <p className="ui-text-meta mb-3">
                Use variables like{' '}
                <code className="px-1 py-px bg-neutral-100 rounded text-[11px]">{'{{candidateName}}'}</code>,{' '}
                <code className="px-1 py-px bg-neutral-100 rounded text-[11px]">{'{{jobTitle}}'}</code>,{' '}
                <code className="px-1 py-px bg-neutral-100 rounded text-[11px]">{'{{offeredSalary}}'}</code>,{' '}
                <code className="px-1 py-px bg-neutral-100 rounded text-[11px]">{'{{joiningDate}}'}</code>,{' '}
                <code className="px-1 py-px bg-neutral-100 rounded text-[11px]">{'{{expiryDate}}'}</code>,{' '}
                <code className="px-1 py-px bg-neutral-100 rounded text-[11px]">{'{{companyName}}'}</code>,{' '}
                <code className="px-1 py-px bg-neutral-100 rounded text-[11px]">{'{{conditionalClause}}'}</code>,{' '}
                <code className="px-1 py-px bg-neutral-100 rounded text-[11px]">{'{{today}}'}</code>.
              </p>
              <input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))}
                placeholder="Template name"
                className="ui-field mb-2"
              />
              <textarea
                rows={10}
                value={newTemplate.bodyHtml}
                onChange={(e) => setNewTemplate((p) => ({ ...p, bodyHtml: e.target.value }))}
                className="ui-field font-mono text-[12px] mb-3"
              />
              <button
                onClick={handleCreateTemplate}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl ui-text-strong !text-white transition-all"
              >
                Save template
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FilterChip({ label, count, active, onClick, icon: Icon, tint }) {
  const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all';
  const className = active
    ? `${base} bg-brand text-white`
    : `${base} bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-brand`;
  return (
    <button type="button" onClick={onClick} className={className}>
      {Icon && <Icon size={12} className={active ? 'text-white' : 'text-neutral-400'} />}
      {label}
      <span className={`text-[10.5px] font-semibold ${active ? 'text-white/70' : 'text-neutral-400'}`}>
        {count}
      </span>
    </button>
  );
}

function RowAction({ icon: Icon, label, onClick, kind = 'default' }) {
  const base = 'inline-flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1.5 rounded-lg transition-all';
  const className =
    kind === 'primary'
      ? `${base} bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700`
      : kind === 'danger'
      ? `${base} bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700`
      : `${base} border border-neutral-200 hover:bg-neutral-50 text-neutral-700`;
  return (
    <button type="button" onClick={onClick} className={className}>
      {Icon && <Icon size={11} />}
      {label}
    </button>
  );
}

function FieldLabel({ children }) {
  return <label className="block ui-text-caption mb-1.5">{children}</label>;
}

function FormField({ label, type = 'text', value, onChange }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ui-field"
      />
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`ui-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 w-full ${
          wide ? 'max-w-2xl' : 'max-w-md'
        } max-h-[90vh] flex flex-col`}
      >
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <h3 className="ui-text-h3">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-brand flex items-center justify-center transition-all"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
