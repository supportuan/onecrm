'use client';

import { useEffect, useState } from 'react';
import {
  addTrainingLesson,
  assignTrainingEnrollment,
  createTrainingCourse,
  deleteTrainingCourse,
  deleteTrainingLesson,
  listTrainingAdmin,
  listTrainingEnrollments,
  searchTrainingUsers,
  updateTrainingCourse,
} from '@/services/trainingApi';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';

const CATEGORIES = [
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'SALES', label: 'Sales' },
  { value: 'SOFT_SKILLS', label: 'Soft skills' },
];

const AUDIENCES = [
  { value: 'ALL', label: 'All users' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'AGENT', label: 'Agents' },
  { value: 'STUDENT', label: 'Students' },
];

const emptyForm = {
  title: '',
  description: '',
  category: 'ONBOARDING',
  targetRoles: ['ALL'],
  isPublished: false,
};

export default function ManageTraining() {
  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
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
      targetRoles: course.targetRoles?.length ? course.targetRoles : ['ALL'],
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
    setForm(emptyForm);
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
    const res = await searchTrainingUsers(userQuery);
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
      <div className="ui-container flex items-center justify-center min-h-[40vh] text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading courses…
      </div>
    );
  }

  return (
    <div className="ui-container grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="ui-panel p-4 space-y-3">
        <button
          type="button"
          className="ui-btn-primary w-full inline-flex items-center justify-center gap-2"
          onClick={() => {
            setSelectedId(null);
            setForm(emptyForm);
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
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.targetRoles[0] || 'ALL'}
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
                  placeholder="Search users"
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
