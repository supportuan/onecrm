'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Loader2, Plus } from 'lucide-react';
import { enrollInCourse, getTrainingDashboard } from '@/services/trainingApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';

const CATEGORY_LABELS = {
  ONBOARDING: 'Onboarding',
  COMPLIANCE: 'Compliance',
  PRODUCT: 'Product',
  SALES: 'Sales',
  SOFT_SKILLS: 'Soft skills',
};

const CourseCard = ({ course, actionLabel, onAction, busy, href }) => {
  const enrollment = course.enrollment;
  return (
    <div className="ui-panel p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900">{course.title}</p>
          {course.description && (
            <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{course.description}</p>
          )}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-soft text-brand shrink-0">
          {CATEGORY_LABELS[course.category] || course.category}
        </span>
      </div>
      {enrollment && (
        <div>
          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full bg-brand" style={{ width: `${enrollment.percent || 0}%` }} />
          </div>
          <p className="ui-text-meta mt-1">
            {enrollment.completedLessons}/{enrollment.totalLessons} lessons · {enrollment.percent}%
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {href && (
          <Link href={href} className="ui-btn-primary inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Continue
          </Link>
        )}
        {onAction && (
          <button type="button" className="ui-btn-secondary inline-flex items-center gap-2" onClick={onAction} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default function MyTraining() {
  const { can } = usePermissions();
  const canManage = can('MANAGE_TRAINING');
  const [data, setData] = useState({ myCourses: [], catalog: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTrainingDashboard();
      setData(res?.data || { myCourses: [], catalog: [] });
    } catch (e) {
      setMsg(e.message || 'Failed to load training');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const enroll = async (id) => {
    setBusyId(id);
    setMsg('');
    try {
      await enrollInCourse(id);
      await load();
    } catch (e) {
      setMsg(e.message || 'Could not enroll');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="ui-container flex items-center justify-center min-h-[40vh] text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading training…
      </div>
    );
  }

  return (
    <div className="ui-container space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-neutral-500">
          <GraduationCap className="h-5 w-5" />
          <p className="ui-text-meta">Courses assigned to you and the open catalog.</p>
        </div>
        {canManage && (
          <Link href="/training/manage" className="ui-btn-primary inline-flex items-center gap-2">
            Manage training
          </Link>
        )}
      </div>

      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      <section className="space-y-3">
        <h2 className="ui-text-h3">My courses</h2>
        {!data.myCourses?.length ? (
          <div className="ui-panel p-6 ui-text-meta">You are not enrolled in any courses yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.myCourses.map((course) => (
              <CourseCard key={course.id} course={course} href={`/training/courses/${course.id}`} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="ui-text-h3">Catalog</h2>
        {!data.catalog?.length ? (
          <div className="ui-panel p-6 ui-text-meta">No published courses are available for you right now.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.catalog.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                actionLabel="Enroll"
                busy={busyId === course.id}
                onAction={() => enroll(course.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
