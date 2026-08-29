'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { completeTrainingLesson, enrollInCourse, getTrainingCourse } from '@/services/trainingApi';

export default function CoursePlayer() {
  const params = useParams();
  const pathname = usePathname() || '';
  const id = Number(params?.id);
  const backHref = pathname.startsWith('/applicant') ? '/applicant/training' : '/training';
  const [course, setCourse] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTrainingCourse(id);
      const data = res?.data;
      setCourse(data);
      const firstIncomplete = data?.lessons?.find(
        (lesson) => !data.enrollment?.completedLessonIds?.includes(lesson.id),
      );
      setActiveId((current) => current || firstIncomplete?.id || data?.lessons?.[0]?.id || null);
    } catch (e) {
      setMsg(e.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const lesson = course?.lessons?.find((item) => item.id === activeId);
  const completed = new Set(course?.enrollment?.completedLessonIds || []);

  const enroll = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await enrollInCourse(id);
      setCourse(res?.data);
    } catch (e) {
      setMsg(e.message || 'Could not enroll');
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!lesson) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await completeTrainingLesson(lesson.id);
      setCourse(res?.data);
    } catch (e) {
      setMsg(e.message || 'Could not complete lesson');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="ui-container flex items-center justify-center min-h-[40vh] text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading course…
      </div>
    );
  }

  if (!course) {
    return <div className="ui-container ui-panel p-6">{msg || 'Course not found.'}</div>;
  }

  return (
    <div className="ui-container space-y-4">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to training
      </Link>
      {msg && <div className="ui-panel p-3 text-sm">{msg}</div>}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="ui-panel p-4 space-y-2">
          <p className="font-semibold text-neutral-900">{course.title}</p>
          <p className="ui-text-meta">
            {course.enrollment
              ? `${course.enrollment.percent}% complete`
              : 'Not enrolled'}
          </p>
          <div className="space-y-1 pt-2">
            {(course.lessons || []).map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm flex items-center gap-2 ${
                  item.id === activeId ? 'bg-brand-soft text-brand' : 'hover:bg-neutral-50'
                }`}
              >
                {completed.has(item.id) ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <PlayCircle className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{index + 1}. {item.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="ui-panel p-6 space-y-4">
          {!course.enrollment && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900 mb-3">Enroll to track progress and complete lessons.</p>
              <button type="button" className="ui-btn-primary" onClick={enroll} disabled={busy}>
                {busy ? 'Enrolling…' : 'Enroll in this course'}
              </button>
            </div>
          )}
          {lesson ? (
            <>
              <h2 className="ui-text-h3">{lesson.title}</h2>
              {lesson.videoUrl && (
                <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="text-sm text-brand underline">
                  Open video / resource
                </a>
              )}
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-neutral-700">
                {lesson.content || 'No lesson content yet.'}
              </div>
              {course.enrollment && !completed.has(lesson.id) && (
                <button type="button" className="ui-btn-primary" onClick={complete} disabled={busy}>
                  {busy ? 'Saving…' : 'Mark lesson complete'}
                </button>
              )}
              {completed.has(lesson.id) && (
                <p className="text-sm text-emerald-700 inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Lesson completed
                </p>
              )}
            </>
          ) : (
            <p className="ui-text-meta">This course has no lessons yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
