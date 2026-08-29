'use client';

import { useEffect, useState } from 'react';
import {
  addTrainingClassStudent,
  addTrainingLesson,
  assignTrainingEnrollment,
  createTrainingClass,
  createTrainingCourse,
  deleteTrainingClass,
  deleteTrainingCourse,
  deleteTrainingLesson,
  listTrainingAdmin,
  listTrainingClasses,
  listTrainingEnrollments,
  removeTrainingClassStudent,
  searchTrainingUsers,
  setTrainingSeatPayment,
  updateTrainingClass,
  updateTrainingCourse,
} from '@/services/trainingApi';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';
import {
  CLASS_STATUSES,
  COURSE_CATEGORIES,
  DELIVERY_MODES,
  PAYMENT_LABELS,
  PROGRAMS,
  formatInrPaise,
  formatWhen,
  modeLabel,
  paiseToRupees,
  programLabel,
  rupeesToPaise,
  statusLabel,
} from '@/features/training/constants';

const AUDIENCES = [
  { value: 'ALL', label: 'All users' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'AGENT', label: 'Agents' },
  { value: 'STUDENT', label: 'Students' },
];

const emptyCourse = {
  title: '',
  description: '',
  category: 'IELTS_PREP',
  targetRoles: ['STUDENT'],
  isPublished: false,
};

const emptyClass = {
  title: '',
  programType: 'IELTS_PREP',
  deliveryMode: 'ONE_ON_ONE',
  maxSeats: 8,
  trainerId: '',
  feeRupees: '',
  scheduledAt: '',
  notes: '',
  status: 'OPEN',
};

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const UserPicker = ({ audience, placeholder, onPick, pickedLabel }) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    setBusy(true);
    try {
      const res = await searchTrainingUsers(query, audience);
      setHits(Array.isArray(res?.data) ? res.data : []);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {pickedLabel && <p className="text-sm text-neutral-600">{pickedLabel}</p>}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
        />
        <button type="button" className="ui-btn-secondary" onClick={search} disabled={busy}>
          {busy ? '…' : 'Search'}
        </button>
      </div>
      {hits.length > 0 && (
        <ul className="text-sm space-y-1">
          {hits.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-2">
              <span>{user.fullName} · {user.email}</span>
              <button
                type="button"
                className="text-brand text-xs"
                onClick={() => {
                  onPick(user);
                  setHits([]);
                  setQuery('');
                }}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function ClassesPanel() {
  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyClass);
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  const selected = classes.find((row) => row.id === selectedId);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTrainingClasses(programFilter ? { programType: programFilter } : {});
      setClasses(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setMsg(e.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [programFilter]);

  const selectClass = (row) => {
    setSelectedId(row.id);
    setTrainer(row.trainer || null);
    setForm({
      title: row.title,
      programType: row.programType,
      deliveryMode: row.deliveryMode,
      maxSeats: row.maxSeats,
      trainerId: row.trainerId || '',
      feeRupees: paiseToRupees(row.feeAmountPaise),
      scheduledAt: toLocalInput(row.scheduledAt),
      notes: row.notes || '',
      status: row.status,
    });
    setMsg('');
  };

  const resetForm = () => {
    setSelectedId(null);
    setTrainer(null);
    setForm(emptyClass);
    setMsg('');
  };

  const payload = () => ({
    title: form.title,
    programType: form.programType,
    deliveryMode: form.deliveryMode,
    maxSeats: form.deliveryMode === 'GROUP' ? Number(form.maxSeats) : 1,
    trainerId: trainer?.id || form.trainerId || null,
    feeAmountPaise: rupeesToPaise(form.feeRupees),
    scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    notes: form.notes,
    status: form.status,
  });

  const saveClass = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      if (selectedId) {
        const res = await updateTrainingClass(selectedId, payload());
        setMsg('Class updated');
        await load();
        if (res?.data) selectClass(res.data);
      } else {
        const res = await createTrainingClass(payload());
        setMsg('Class created — handpick students below. Payment checkout comes later.');
        await load();
        if (res?.data) selectClass(res.data);
      }
    } catch (err) {
      setMsg(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeClass = async () => {
    if (!selectedId || !window.confirm('Delete this class?')) return;
    await deleteTrainingClass(selectedId);
    resetForm();
    await load();
  };

  const addStudent = async (user) => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await addTrainingClassStudent(selectedId, user.id);
      setMsg('Student added');
      await load();
      if (res?.data) selectClass(res.data);
    } catch (err) {
      setMsg(err.message || 'Could not add student');
    } finally {
      setSaving(false);
    }
  };

  const dropStudent = async (seatId) => {
    setSaving(true);
    try {
      const res = await removeTrainingClassStudent(seatId);
      await load();
      if (res?.data) selectClass(res.data);
    } catch (err) {
      setMsg(err.message || 'Could not remove student');
    } finally {
      setSaving(false);
    }
  };

  const waiveSeat = async (seatId) => {
    setSaving(true);
    try {
      const res = await setTrainingSeatPayment(seatId, 'WAIVED');
      await load();
      if (res?.data) selectClass(res.data);
    } catch (err) {
      setMsg(err.message || 'Could not update payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[30vh] text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading classes…
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="ui-panel p-4 space-y-3">
        <button type="button" className="ui-btn-primary w-full inline-flex items-center justify-center gap-2" onClick={resetForm}>
          <Plus className="h-4 w-4" /> New class
        </button>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
        >
          <option value="">All programs</option>
          {PROGRAMS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <div className="space-y-1">
          {classes.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => selectClass(row)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm ${
                row.id === selectedId ? 'bg-brand-soft text-brand' : 'hover:bg-neutral-50'
              }`}
            >
              <span className="font-medium block truncate">{row.title}</span>
              <span className="ui-text-meta">
                {programLabel(row.programType)} · {modeLabel(row.deliveryMode)} · {row.memberCount}/{row.maxSeats}
              </span>
            </button>
          ))}
          {!classes.length && <p className="ui-text-meta px-1">No classes yet.</p>}
        </div>
      </aside>

      <div className="space-y-6">
        {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}
        <form onSubmit={saveClass} className="ui-panel p-5 space-y-4">
          <h2 className="ui-text-h3">{selectedId ? 'Edit class' : 'Create class'}</h2>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Class title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.programType}
              onChange={(e) => setForm({ ...form, programType: e.target.value })}
            >
              {PROGRAMS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.deliveryMode}
              onChange={(e) => setForm({
                ...form,
                deliveryMode: e.target.value,
                maxSeats: e.target.value === 'ONE_ON_ONE' ? 1 : Math.max(2, Number(form.maxSeats) || 8),
              })}
            >
              {DELIVERY_MODES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          {form.deliveryMode === 'GROUP' && (
            <label className="block text-sm space-y-1">
              <span className="ui-text-meta">Group size</span>
              <input
                type="number"
                min={2}
                max={50}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.maxSeats}
                onChange={(e) => setForm({ ...form, maxSeats: e.target.value })}
              />
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm space-y-1">
              <span className="ui-text-meta">Fee (INR, collected later)</span>
              <input
                type="number"
                min={0}
                step="1"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Optional"
                value={form.feeRupees}
                onChange={(e) => setForm({ ...form, feeRupees: e.target.value })}
              />
            </label>
            <label className="block text-sm space-y-1">
              <span className="ui-text-meta">Schedule</span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </label>
          </div>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {CLASS_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="space-y-1">
            <p className="ui-text-meta">Trainer</p>
            <UserPicker
              audience="STAFF"
              placeholder="Search staff to assign as trainer"
              pickedLabel={trainer ? `${trainer.fullName} · ${trainer.email}` : 'No trainer assigned'}
              onPick={(user) => {
                setTrainer(user);
                setForm((current) => ({ ...current, trainerId: user.id }));
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="ui-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save class'}
            </button>
            {selectedId && (
              <button type="button" className="ui-btn-secondary inline-flex items-center gap-2" onClick={removeClass}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </form>

        {selectedId && selected && (
          <div className="ui-panel p-5 space-y-3">
            <h2 className="ui-text-h3 inline-flex items-center gap-2">
              <Users className="h-4 w-4" /> Students
              <span className="ui-text-meta font-normal">
                {selected.memberCount}/{selected.maxSeats} · {statusLabel(selected.status)}
              </span>
            </h2>
            <p className="ui-text-meta">
              Handpick students for this {modeLabel(selected.deliveryMode).toLowerCase()} class.
              Seats stay unpaid until checkout is wired.
            </p>
            {selected.seatsRemaining > 0 && (
              <UserPicker audience="STUDENT" placeholder="Search students" onPick={addStudent} />
            )}
            <ul className="text-sm space-y-2 pt-1">
              {(selected.members || []).map((seat) => (
                <li key={seat.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <span>
                    {seat.user?.fullName} · {seat.user?.email}
                    <span className="ui-text-meta ml-2">{PAYMENT_LABELS[seat.paymentStatus] || seat.paymentStatus}</span>
                  </span>
                  <span className="flex gap-2">
                    {seat.paymentStatus === 'UNPAID' && (
                      <button type="button" className="text-xs text-brand" onClick={() => waiveSeat(seat.id)}>
                        Waive fee
                      </button>
                    )}
                    <button type="button" className="text-xs text-red-600" onClick={() => dropStudent(seat.id)}>
                      Remove
                    </button>
                  </span>
                </li>
              ))}
              {!selected.members?.length && <li className="ui-text-meta">No students assigned yet.</li>}
            </ul>
            {selected.feeAmountPaise != null && (
              <p className="ui-text-meta">Listed fee: {formatInrPaise(selected.feeAmountPaise)}</p>
            )}
            <p className="ui-text-meta">{formatWhen(selected.scheduledAt)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialsPanel() {
  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyCourse);
  const [lesson, setLesson] = useState({ title: '', content: '', videoUrl: '', durationMin: '' });
  const [enrollments, setEnrollments] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const selected = courses.find((course) => course.id === selectedId);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTrainingAdmin();
      setCourses(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setMsg(e.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setEnrollments([]);
      return;
    }
    listTrainingEnrollments(selectedId)
      .then((res) => setEnrollments(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setEnrollments([]));
  }, [selectedId]);

  const selectCourse = (course) => {
    setSelectedId(course.id);
    setForm({
      title: course.title,
      description: course.description || '',
      category: course.category,
      targetRoles: course.targetRoles?.length ? course.targetRoles : ['STUDENT'],
      isPublished: course.isPublished,
    });
  };

  const saveCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      if (selectedId) {
        await updateTrainingCourse(selectedId, form);
        setMsg('Course updated');
      } else {
        const res = await createTrainingCourse(form);
        setMsg('Course created');
        setSelectedId(res?.data?.id || null);
      }
      await load();
    } catch (err) {
      setMsg(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeCourse = async () => {
    if (!selectedId || !window.confirm('Delete this course?')) return;
    await deleteTrainingCourse(selectedId);
    setSelectedId(null);
    setForm(emptyCourse);
    await load();
  };

  const addLesson = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      await addTrainingLesson(selectedId, {
        ...lesson,
        durationMin: lesson.durationMin ? Number(lesson.durationMin) : null,
      });
      setLesson({ title: '', content: '', videoUrl: '', durationMin: '' });
      await load();
      setMsg('Lesson added');
    } catch (err) {
      setMsg(err.message || 'Could not add lesson');
    } finally {
      setSaving(false);
    }
  };

  const searchUsers = async () => {
    const res = await searchTrainingUsers(userQuery, 'STUDENT');
    setUsers(Array.isArray(res?.data) ? res.data : []);
  };

  const assign = async (userId) => {
    if (!selectedId) return;
    await assignTrainingEnrollment(selectedId, userId);
    const res = await listTrainingEnrollments(selectedId);
    setEnrollments(Array.isArray(res?.data) ? res.data : []);
    setMsg('User assigned');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[30vh] text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading materials…
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="ui-panel p-4 space-y-3">
        <button
          type="button"
          className="ui-btn-primary w-full inline-flex items-center justify-center gap-2"
          onClick={() => {
            setSelectedId(null);
            setForm(emptyCourse);
          }}
        >
          <Plus className="h-4 w-4" /> New course
        </button>
        <div className="space-y-1">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => selectCourse(course)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm ${
                course.id === selectedId ? 'bg-brand-soft text-brand' : 'hover:bg-neutral-50'
              }`}
            >
              <span className="font-medium block truncate">{course.title}</span>
              <span className="ui-text-meta">{course.isPublished ? 'Published' : 'Draft'}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-6">
        {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}
        <form onSubmit={saveCourse} className="ui-panel p-5 space-y-4">
          <h2 className="ui-text-h3">{selectedId ? 'Edit course' : 'Create course'}</h2>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Course title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={3}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {COURSE_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.targetRoles[0] || 'STUDENT'}
              onChange={(e) => setForm({ ...form, targetRoles: [e.target.value] })}
            >
              {AUDIENCES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Published
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="ui-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save course'}
            </button>
            {selectedId && (
              <button type="button" className="ui-btn-secondary inline-flex items-center gap-2" onClick={removeCourse}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </form>

        {selectedId && (
          <>
            <form onSubmit={addLesson} className="ui-panel p-5 space-y-3">
              <h2 className="ui-text-h3">Lessons</h2>
              <ul className="space-y-2 text-sm">
                {(selected?.lessons || []).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 border-b pb-2">
                    <span>{item.title}</span>
                    <button
                      type="button"
                      className="text-red-600 text-xs"
                      onClick={async () => {
                        await deleteTrainingLesson(item.id);
                        await load();
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Lesson title"
                value={lesson.title}
                onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                required
              />
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm"
                rows={3}
                placeholder="Lesson content"
                value={lesson.content}
                onChange={(e) => setLesson({ ...lesson, content: e.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Video / resource URL"
                  value={lesson.videoUrl}
                  onChange={(e) => setLesson({ ...lesson, videoUrl: e.target.value })}
                />
                <input
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Duration (minutes)"
                  value={lesson.durationMin}
                  onChange={(e) => setLesson({ ...lesson, durationMin: e.target.value })}
                />
              </div>
              <button type="submit" className="ui-btn-primary" disabled={saving}>Add lesson</button>
            </form>

            <div className="ui-panel p-5 space-y-3">
              <h2 className="ui-text-h3 inline-flex items-center gap-2">
                <Users className="h-4 w-4" /> Assignments
              </h2>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  placeholder="Search students"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                />
                <button type="button" className="ui-btn-secondary" onClick={searchUsers}>Search</button>
              </div>
              {users.length > 0 && (
                <ul className="text-sm space-y-1">
                  {users.map((user) => (
                    <li key={user.id} className="flex items-center justify-between gap-2">
                      <span>{user.fullName} · {user.email}</span>
                      <button type="button" className="text-brand text-xs" onClick={() => assign(user.id)}>
                        Assign
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="text-sm space-y-1 pt-2">
                {enrollments.map((row) => (
                  <li key={row.id}>
                    {row.user?.fullName} — {row.status} ({row.percent}%)
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ManageTraining() {
  const [tab, setTab] = useState('classes');

  return (
    <div className="ui-container space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={tab === 'classes' ? 'ui-btn-primary' : 'ui-btn-secondary'}
          onClick={() => setTab('classes')}
        >
          Classes
        </button>
        <button
          type="button"
          className={tab === 'materials' ? 'ui-btn-primary' : 'ui-btn-secondary'}
          onClick={() => setTab('materials')}
        >
          Materials
        </button>
      </div>
      <p className="ui-text-meta">
        Trainers run IELTS preparation and visa training as 1-on-1 or group classes. Groups are handpicked now;
        paid enrollment will auto-fill seats later.
      </p>
      {tab === 'classes' ? <ClassesPanel /> : <MaterialsPanel />}
    </div>
  );
}
