'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Loader2, Users } from 'lucide-react';
import { enrollInCourse, getTrainingDashboard } from '@/services/trainingApi';
import {
  sp,
  StudentPortalPage,
  StudentPortalPanel,
  SkeletonBlock,
} from '@/features/student-portal/student-portal-ui';
import {
  PAYMENT_LABELS,
  categoryLabel,
  formatInrPaise,
  formatWhen,
  modeLabel,
  programLabel,
  statusLabel,
} from '@/features/training/constants';

export default function StudentTraining() {
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
      <StudentPortalPage>
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-40" />
      </StudentPortalPage>
    );
  }

  return (
    <StudentPortalPage>
      <p className={`${sp.body} flex items-center gap-2`}>
        <GraduationCap className="h-4 w-4" />
        IELTS preparation and visa training — 1-on-1 or group classes assigned by your trainer.
      </p>

      {msg && <StudentPortalPanel className={`${sp.panelPad} text-sm`}>{msg}</StudentPortalPanel>}

      <StudentPortalPanel className={`${sp.panelPad} space-y-3`}>
        <h2 className={`${sp.sectionTitle} inline-flex items-center gap-2`}>
          <Users className="h-4 w-4" /> My classes
        </h2>
        {!data.myClasses?.length ? (
          <p className={sp.empty}>You are not in a class yet. Your trainer will handpick you into IELTS or visa training.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.myClasses.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200/80 p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-brand">{row.title}</p>
                  <span className={sp.badge}>{statusLabel(row.status)}</span>
                </div>
                <p className={sp.body}>
                  {programLabel(row.programType)} · {modeLabel(row.deliveryMode)}
                  {row.trainer?.fullName ? ` · ${row.trainer.fullName}` : ''}
                </p>
                <p className={sp.body}>{formatWhen(row.scheduledAt)}</p>
                {row.mySeat && (
                  <p className={sp.body}>
                    {PAYMENT_LABELS[row.mySeat.paymentStatus] || row.mySeat.paymentStatus}
                    {row.feeAmountPaise != null ? ` · ${formatInrPaise(row.feeAmountPaise)}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </StudentPortalPanel>

      <StudentPortalPanel className={`${sp.panelPad} space-y-3`}>
        <h2 className={sp.sectionTitle}>Materials</h2>
        {!data.myCourses?.length ? (
          <p className={sp.empty}>No self-paced lessons assigned yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.myCourses.map((course) => (
              <div key={course.id} className="rounded-xl border border-slate-200/80 p-4 space-y-2">
                <p className="font-semibold text-brand">{course.title}</p>
                <p className={sp.body}>{categoryLabel(course.category)}</p>
                <Link href={`/applicant/training/courses/${course.id}`} className={sp.btnPrimary}>
                  <BookOpen className="h-4 w-4" /> Continue
                </Link>
              </div>
            ))}
          </div>
        )}
      </StudentPortalPanel>

      {!!data.catalog?.length && (
        <StudentPortalPanel className={`${sp.panelPad} space-y-3`}>
          <h2 className={sp.sectionTitle}>Open materials</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {data.catalog.map((course) => (
              <div key={course.id} className="rounded-xl border border-slate-200/80 p-4 space-y-2">
                <p className="font-semibold text-brand">{course.title}</p>
                <p className={sp.body}>{categoryLabel(course.category)}</p>
                <button
                  type="button"
                  className={sp.btnGhost}
                  disabled={busyId === course.id}
                  onClick={() => enroll(course.id)}
                >
                  {busyId === course.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enroll'}
                </button>
              </div>
            ))}
          </div>
        </StudentPortalPanel>
      )}
    </StudentPortalPage>
  );
}
