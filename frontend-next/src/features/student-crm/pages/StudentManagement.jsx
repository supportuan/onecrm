'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  GraduationCap,
  User,
  BookOpen,
  FileText,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  createApplication,
  listCounsellors,
} from '@/services/studentCrmApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { getStageLabel, stageBadgeClass } from '../constants';

const INPUT =
  'w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none';

const emptyAcademic = () => ({ degree: '', institution: '', year: '', grade: '' });

export default function StudentManagement() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [counsellors, setCounsellors] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (msg, ok = true) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listStudents({ search, limit: 200 });
      const list = Array.isArray(res?.data) ? res.data : [];
      setStudents(list);
      const fromUrl = searchParams.get('student');
      if (fromUrl) {
        const id = Number(fromUrl);
        if (list.some((s) => s.id === id)) setSelectedId(id);
      } else if (!selectedId && list.length) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      flash(e?.message || 'Failed to load students', false);
    } finally {
      setLoading(false);
    }
  }, [search, searchParams, selectedId]);

  const loadProfile = useCallback(async () => {
    if (!selectedId) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getStudent(selectedId);
      setProfile(res?.data || null);
    } catch (e) {
      flash(e?.message || 'Failed to load profile', false);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    listCounsellors()
      .then((r) => setCounsellors(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setCounsellors([]));
  }, []);

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!profile) {
      setForm(null);
      return;
    }
    const history = Array.isArray(profile.academicHistory)
      ? profile.academicHistory
      : profile.academicHistory
        ? [profile.academicHistory]
        : [emptyAcademic()];
    setForm({
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dob: profile.dob ? profile.dob.slice(0, 10) : '',
      nationality: profile.nationality || '',
      preferredCountry: profile.preferredCountry || '',
      notes: profile.notes || '',
      ieltsScore: profile.ieltsScore ?? '',
      toeflScore: profile.toeflScore ?? '',
      greScore: profile.greScore ?? '',
      gmatScore: profile.gmatScore ?? '',
      academicHistory: history.length ? history : [emptyAcademic()],
    });
  }, [profile]);

  const saveProfile = async () => {
    if (!form || !selectedId) return;
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone || null,
        dob: form.dob || null,
        nationality: form.nationality || null,
        preferredCountry: form.preferredCountry || null,
        notes: form.notes || null,
        ieltsScore: form.ieltsScore === '' ? null : Number(form.ieltsScore),
        toeflScore: form.toeflScore === '' ? null : Number(form.toeflScore),
        greScore: form.greScore === '' ? null : Number(form.greScore),
        gmatScore: form.gmatScore === '' ? null : Number(form.gmatScore),
        academicHistory: form.academicHistory.filter(
          (r) => r.degree || r.institution || r.year || r.grade
        ),
      };
      await updateStudent(selectedId, payload);
      flash('Profile saved');
      await loadProfile();
      await loadStudents();
    } catch (e) {
      flash(e?.message || 'Save failed', false);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'tests', label: 'Test scores', icon: GraduationCap },
    { id: 'applications', label: 'Applications', icon: FileText },
  ];

  return (
    <div className="ui-page text-neutral-800 font-sans">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="ui-container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Student management</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Create and maintain student profiles, academic history, test scores, and linked applications.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="ui-btn-primary inline-flex items-center gap-2"
            >
              <Plus size={16} /> New student
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-3 ui-panel flex flex-col max-h-[calc(100vh-200px)] overflow-hidden">
            <div className="p-4 border-b border-neutral-200 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-neutral-800">Students</h2>
                <span className="text-xs text-neutral-500">{students.length}</span>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
              {loading && !students.length ? (
                <p className="p-6 text-center text-sm text-neutral-500">Loading...</p>
              ) : students.length === 0 ? (
                <p className="p-6 text-center text-sm text-neutral-500">No students yet.</p>
              ) : (
                students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-neutral-50 ${
                      selectedId === s.id ? 'bg-neutral-100 border-l-4 border-l-neutral-900' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-neutral-900">{s.fullName}</p>
                    <p className="text-xs text-neutral-500 truncate">{s.email}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {s.applications?.length || 0} application(s)
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-9 space-y-4">
            {!profile || !form ? (
              <div className="ui-panel p-12 text-center text-neutral-500">
                <User size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a student to view or edit their profile.</p>
              </div>
            ) : (
              <>
                <div className="ui-panel p-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">{form.fullName}</h2>
                    <p className="text-sm text-neutral-500">{form.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {canManage && tab !== 'applications' && (
                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={saving}
                        className="ui-btn-primary inline-flex items-center gap-2"
                      >
                        <Save size={14} />
                        {saving ? 'Saving...' : 'Save profile'}
                      </button>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setShowNewApp(true)}
                        className="ui-btn-secondary inline-flex items-center gap-2"
                      >
                        <Plus size={14} /> New application
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 bg-white border border-neutral-200 rounded-lg p-1 w-fit">
                  {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium ${
                          tab === t.id ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <Icon size={14} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {tab === 'personal' && (
                  <div className="ui-panel p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full name">
                      <input
                        className={INPUT}
                        value={form.fullName}
                        disabled={!canManage}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      />
                    </Field>
                    <Field label="Email">
                      <input className={INPUT} value={form.email} disabled />
                    </Field>
                    <Field label="Phone">
                      <input
                        className={INPUT}
                        value={form.phone}
                        disabled={!canManage}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </Field>
                    <Field label="Date of birth">
                      <input
                        type="date"
                        className={INPUT}
                        value={form.dob}
                        disabled={!canManage}
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      />
                    </Field>
                    <Field label="Nationality">
                      <input
                        className={INPUT}
                        value={form.nationality}
                        disabled={!canManage}
                        onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                      />
                    </Field>
                    <Field label="Preferred country">
                      <input
                        className={INPUT}
                        value={form.preferredCountry}
                        disabled={!canManage}
                        onChange={(e) => setForm({ ...form, preferredCountry: e.target.value })}
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Notes">
                        <textarea
                          rows={3}
                          className={INPUT}
                          value={form.notes}
                          disabled={!canManage}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {tab === 'academic' && (
                  <div className="ui-panel p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-neutral-800">Academic history</h3>
                      {canManage && (
                        <button
                          type="button"
                          className="text-xs font-medium text-neutral-700 hover:text-neutral-900"
                          onClick={() =>
                            setForm({
                              ...form,
                              academicHistory: [...form.academicHistory, emptyAcademic()],
                            })
                          }
                        >
                          + Add row
                        </button>
                      )}
                    </div>
                    {form.academicHistory.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                        <Field label="Degree">
                          <input
                            className={INPUT}
                            value={row.degree}
                            disabled={!canManage}
                            onChange={(e) => {
                              const next = [...form.academicHistory];
                              next[idx] = { ...next[idx], degree: e.target.value };
                              setForm({ ...form, academicHistory: next });
                            }}
                          />
                        </Field>
                        <Field label="Institution">
                          <input
                            className={INPUT}
                            value={row.institution}
                            disabled={!canManage}
                            onChange={(e) => {
                              const next = [...form.academicHistory];
                              next[idx] = { ...next[idx], institution: e.target.value };
                              setForm({ ...form, academicHistory: next });
                            }}
                          />
                        </Field>
                        <Field label="Year">
                          <input
                            className={INPUT}
                            value={row.year}
                            disabled={!canManage}
                            onChange={(e) => {
                              const next = [...form.academicHistory];
                              next[idx] = { ...next[idx], year: e.target.value };
                              setForm({ ...form, academicHistory: next });
                            }}
                          />
                        </Field>
                        <Field label="Grade / GPA">
                          <input
                            className={INPUT}
                            value={row.grade}
                            disabled={!canManage}
                            onChange={(e) => {
                              const next = [...form.academicHistory];
                              next[idx] = { ...next[idx], grade: e.target.value };
                              setForm({ ...form, academicHistory: next });
                            }}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'tests' && (
                  <div className="ui-panel p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      ['ieltsScore', 'IELTS'],
                      ['toeflScore', 'TOEFL'],
                      ['greScore', 'GRE'],
                      ['gmatScore', 'GMAT'],
                    ].map(([key, label]) => (
                      <Field key={key} label={label}>
                        <input
                          type="number"
                          step="0.5"
                          className={INPUT}
                          value={form[key]}
                          disabled={!canManage}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          placeholder="Score"
                        />
                      </Field>
                    ))}
                  </div>
                )}

                {tab === 'applications' && (
                  <div className="ui-panel overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-200 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-neutral-800">
                        Applications ({profile.applications?.length || 0})
                      </h3>
                      <Link
                        href={`/student-crm/applications?student=${selectedId}`}
                        className="text-xs font-medium text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1"
                      >
                        Open in tracker <ExternalLink size={12} />
                      </Link>
                    </div>
                    {!profile.applications?.length ? (
                      <p className="p-8 text-center text-sm text-neutral-500">No applications linked yet.</p>
                    ) : (
                      <ul className="divide-y divide-neutral-100">
                        {profile.applications.map((app) => (
                          <li key={app.id} className="px-5 py-4 flex flex-wrap justify-between gap-3 hover:bg-neutral-50">
                            <div>
                              <p className="text-xs font-mono text-neutral-500">{app.applicationCode}</p>
                              <p className="text-sm font-medium text-neutral-900 mt-0.5">
                                {app.university} · {app.course}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {app.country}
                                {app.intake ? ` · ${app.intake}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${stageBadgeClass(app.stage)}`}
                              >
                                {getStageLabel(app.stage)}
                              </span>
                              <Link
                                href={`/student-crm/applications?student=${selectedId}&app=${app.id}`}
                                className="text-xs font-medium text-neutral-700 hover:underline"
                              >
                                Manage
                              </Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showNew && (
        <NewStudentModal
          onClose={() => setShowNew(false)}
          onCreated={async (student) => {
            setShowNew(false);
            await loadStudents();
            if (student?.id) setSelectedId(student.id);
            flash('Student created');
          }}
        />
      )}

      {showNewApp && profile && (
        <NewAppModal
          student={profile}
          counsellors={counsellors}
          onClose={() => setShowNewApp(false)}
          onCreated={async () => {
            setShowNewApp(false);
            await loadProfile();
            await loadStudents();
            flash('Application created');
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="ui-label">{label}</label>
      {children}
    </div>
  );
}

function NewStudentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    nationality: 'India',
    preferredCountry: '',
    ieltsScore: '',
    toeflScore: '',
    greScore: '',
    gmatScore: '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createStudent({
        ...form,
        ieltsScore: form.ieltsScore === '' ? undefined : Number(form.ieltsScore),
        toeflScore: form.toeflScore === '' ? undefined : Number(form.toeflScore),
        greScore: form.greScore === '' ? undefined : Number(form.greScore),
        gmatScore: form.gmatScore === '' ? undefined : Number(form.gmatScore),
        academicHistory: [],
      });
      onCreated(res?.data);
    } catch (err) {
      alert(err?.message || 'Failed to create student');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New student" onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4 max-w-lg">
        <Field label="Full name *">
          <input required className={INPUT} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        <Field label="Email *">
          <input required type="email" className={INPUT} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input className={INPUT} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Date of birth">
          <input type="date" className={INPUT} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </Field>
        <Field label="Preferred country">
          <input className={INPUT} value={form.preferredCountry} onChange={(e) => setForm({ ...form, preferredCountry: e.target.value })} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="ui-btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="ui-btn-primary flex-1">
            {busy ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NewAppModal({ student, counsellors, onClose, onCreated }) {
  const [form, setForm] = useState({
    country: student.preferredCountry || '',
    university: '',
    course: '',
    intake: '',
    deadline: '',
    assignedToId: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createApplication({
        studentId: student.id,
        country: form.country,
        university: form.university,
        course: form.course,
        intake: form.intake || undefined,
        deadline: form.deadline || undefined,
        assignedToId: form.assignedToId ? Number(form.assignedToId) : undefined,
        notes: form.notes || undefined,
      });
      onCreated();
    } catch (err) {
      alert(err?.message || 'Failed to create application');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`New application · ${student.fullName}`} onClose={onClose}>
      <form onSubmit={submit} className="p-6 space-y-4 max-w-lg">
        <Field label="Country *">
          <input required className={INPUT} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </Field>
        <Field label="University *">
          <input required className={INPUT} value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
        </Field>
        <Field label="Course *">
          <input required className={INPUT} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
        </Field>
        <Field label="Intake">
          <input className={INPUT} value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} placeholder="Fall 2026" />
        </Field>
        <Field label="Deadline">
          <input type="date" className={INPUT} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </Field>
        <Field label="Assign counsellor">
          <select className={INPUT} value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
            <option value="">Unassigned</option>
            {counsellors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <textarea className={INPUT} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="ui-btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="ui-btn-primary flex-1">
            {busy ? 'Creating...' : 'Create application'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="ui-panel w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-3 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-800">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
