'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Loader2, Plus, Users } from 'lucide-react';
import { enrollInCourse, getTrainingDashboard } from '@/services/trainingApi';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import {
  PAYMENT_LABELS,
  categoryLabel,
  formatInrPaise,
  formatWhen,
  modeLabel,
  programLabel,
  statusLabel,
} from '@/features/training/constants';

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
          {categoryLabel(course.category)}
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

const ClassCard = ({ row }) => {
  const seat = row.mySeat;
  return (
    <div className="ui-panel p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900">{row.title}</p>
          <p className="text-sm text-neutral-600 mt-1">
            {programLabel(row.programType)} · {modeLabel(row.deliveryMode)}
            {row.trainer?.fullName ? ` · ${row.trainer.fullName}` : ''}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-soft text-brand shrink-0">
          {statusLabel(row.status)}
        </span>
      </div>
      <p className="ui-text-meta">
        {row.memberCount}/{row.maxSeats} students · {formatWhen(row.scheduledAt)}
      </p>
      {seat && (
        <p className="ui-text-meta">
          {PAYMENT_LABELS[seat.paymentStatus] || seat.paymentStatus}
          {row.feeAmountPaise != null ? ` · ${formatInrPaise(row.feeAmountPaise)}` : ''}
        </p>
      )}
    </div>
  );
};

export default function MyTraining() {
  const { can } = usePermissions();
  const canManage = can('MANAGE_TRAINING');
  const [data, setData] = useState({ myClasses: [], myCourses: [], catalog: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTrainingDashboard();
      setData(res?.data || { myClasses: [], myCourses: [], catalog: [] });
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
          <p className="ui-text-meta">IELTS preparation and visa training — 1-on-1 or group.</p>
        </div>
        {canManage && (
          <Link href="/training/manage" className="ui-btn-primary inline-flex items-center gap-2">
            Manage training
          </Link>
        )}
      </div>

      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      <section className="space-y-3">
        <h2 className="ui-text-h3 inline-flex items-center gap-2">
          <Users className="h-4 w-4" /> My classes
        </h2>
        {!data.myClasses?.length ? (
          <div className="ui-panel p-6 ui-text-meta">You are not in any IELTS or visa class yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.myClasses.map((row) => (
              <ClassCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="ui-text-h3">My materials</h2>
        {!data.myCourses?.length ? (
          <div className="ui-panel p-6 ui-text-meta">No self-paced materials assigned yet.</div>
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
          <div className="ui-panel p-6 ui-text-meta">No published materials are available for you right now.</div>
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
