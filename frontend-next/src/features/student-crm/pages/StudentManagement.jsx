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
  Save,
  ExternalLink,
  MessageSquare,
  Archive,
  Download,
  Loader2,
} from 'lucide-react';
import {
  listStudents,
  getStudent,
  getApplication,
  createStudent,
  updateStudent,
  listCounsellors,
  setStudentEnrolled,
  updateChecklistValue,
  downloadStudentExport,
  archiveStudent,
  addDocument,
  updateDocument,
  deleteDocument,
  uploadApplicationDocument,
  notifyMissingDocs,
  saveWorkflowProgress,
} from '@/services/studentCrmApi';
import { getFormOptions } from '@/services/crmSettingsApi';
import {
  studyIdsFromProfile,
  toNumOrNull,
  toSelectId,
} from '../studyFormOptions';
import PersonalDetailsFields from '../components/PersonalDetailsFields';
import StudentEnquiryForm from '../components/StudentEnquiryForm';
import { emptyEnquiryForm, enquiryFormToStudentPayload } from '../studentEnquiryForm';
import { resolveCatalogCountryId, pickCatalogCountry } from '../catalogCountry';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';

const INPUT =
  'w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none';
/** Normalize API date (ISO string | Date | number) to YYYY-MM-DD for <input type="date">. */
const toDateInput = (value) => {
  try {
    if (value == null || value === '') return '';

    // Already a calendar date string (or ISO datetime).
    if (typeof value === 'string') {
      const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return '';
      return parsed.toISOString().slice(0, 10);
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return '';
      return parsed.toISOString().slice(0, 10);
    }

    // Date instance (or Date-like with getTime).
    if (
      value instanceof Date ||
      (typeof value === 'object' && typeof value.getTime === 'function')
    ) {
      const time = value.getTime();
      if (typeof time !== 'number' || Number.isNaN(time)) return '';
      return new Date(time).toISOString().slice(0, 10);
    }

    // Last resort: coerce and pull YYYY-MM-DD if present.
    const asString = String(value);
    const match = asString.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
};

const emptyAcademic = () => ({ degree: '', institution: '', year: '', grade: '' });
const emptyEducation = () => ({
  type: 'UG',
  label: '',
  passing_year: '',
  grade: '',
  medium: 'English',
});
const emptyExam = () => ({
  type: 'IELTS',
  label: '',
  overall_score: '',
  reading: '',
  writing: '',
  speaking: '',
  listening: '',
});

const PROCESS_STAGE_LABELS = {
  GATHERING_CHECKLIST: 'Gathering checklist',
  UNIVERSITY_APPLICATION: 'University application',
  FINANCIAL_EVIDENCE: 'Financial evidence',
  AFTER_I20: 'After I-20',
  PRE_CAS_PROCESS: 'Pre-CAS',
  VISA_APPLICATION: 'Visa application',
  PRE_DEPARTURE: 'Pre-departure',
  ON_ARRIVAL: 'On arrival',
  PRE_REQUISITE: 'Pre-requisite',
};

export default function StudentManagement() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can('MANAGE_STUDENT_CRM');
  const isCounsellorFlow =
    user?.role === 'COUNSELLOR' ||
    user?.role === 'GLOBAL_ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    canManage;

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [counsellors, setCounsellors] = useState([]);
  const [formOptions, setFormOptions] = useState({ countries: [], industries: [] });
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState({ kind: '', msg: '' });
  const [archiving, setArchiving] = useState(false);
  const [docsAppId, setDocsAppId] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [workflowApp, setWorkflowApp] = useState(null);

  const flash = (msg, ok = true) => {
    setToast({ kind: ok ? 'ok' : 'err', msg });
    setTimeout(() => setToast({ kind: '', msg: '' }), 3000);
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
  }, [search, searchParams]);

  const loadProfile = useCallback(async () => {
    if (!selectedId) {
      setProfile(null);
      setDocsAppId(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getStudent(selectedId);
      const next = res?.data || null;
      setProfile(next);
      const apps = next?.applications || [];
      setDocsAppId((prev) => {
        if (prev && apps.some((a) => a.id === prev)) return prev;
        return apps[0]?.id ?? null;
      });
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
    getFormOptions()
      .then((r) => setFormOptions(r?.data || { countries: [], industries: [] }))
      .catch(() => setFormOptions({ countries: [], industries: [] }));
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
    const education = Array.isArray(profile.educationDetails)
      ? profile.educationDetails
      : profile.educationDetails
        ? [profile.educationDetails]
        : [emptyEducation()];
    const exams = Array.isArray(profile.asstExamSections)
      ? profile.asstExamSections
      : profile.asstExamSections
        ? [profile.asstExamSections]
        : [emptyExam()];

    const ids = studyIdsFromProfile(profile);
    const catalogCountryId = resolveCatalogCountryId(ids.countryId) || ids.countryId;
    const catalogCountry = pickCatalogCountry(formOptions.countries, ids.countryId);
    setForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dob: toDateInput(profile.dob),
      nationality: profile.nationality || '',
      preferredCountry: catalogCountry?.name || profile.preferredCountry || '',
      level: profile.level || '',
      countryId: catalogCountryId,
      industryId: ids.industryId,
      subIndustryId: ids.subIndustryId,
      studyAreaId: ids.studyAreaId,
      universityId: toSelectId(profile.preferredUniversityId ?? profile.preferredUniversity?.id),
      university: profile.preferredUniversity?.name || '',
      courseId: toSelectId(profile.preferredCourseId ?? profile.preferredCourseRef?.id),
      course: profile.preferredCourse || profile.preferredCourseRef?.name || '',
      intakeMonth: profile.intakeMonth || '',
      intakeYear: profile.intakeYear || '',
      studyMode: profile.studyMode || '',
      studyDuration: profile.studyDuration || '',
      studyBudget: profile.studyBudget || '',
      studyAttendanceType: profile.studyAttendanceType || '',
      typeOfDegree: profile.typeOfDegree || '',
      workExperience: profile.workExperience || '',
      recLevelAcademic: profile.recLevelAcademic || '',
      recGradeAchieved: profile.recGradeAchieved || '',
      preStudyLoc: profile.preStudyLoc || '',
      contactId: profile.contactId ?? '',
      notes: profile.notes || '',
      ieltsScore: profile.ieltsScore ?? '',
      toeflScore: profile.toeflScore ?? '',
      greScore: profile.greScore ?? '',
      gmatScore: profile.gmatScore ?? '',
      academicHistory: history.length ? history : [emptyAcademic()],
      educationDetails: education.length ? education : [emptyEducation()],
      asstExamSections: exams.length ? exams : [emptyExam()],
    });
  }, [profile, formOptions.countries]);

  const saveProfile = async () => {
    if (!form || !selectedId) return false;
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        fullName: form.fullName,
        phone: form.phone || null,
        dob: form.dob || null,
        nationality: form.nationality || null,
        preferredCountry: form.preferredCountry || null,
        level: form.level || null,
        countryId: toNumOrNull(form.countryId),
        industryId: toNumOrNull(form.industryId),
        subIndustryId: toNumOrNull(form.subIndustryId),
        studyAreaId: toNumOrNull(form.studyAreaId),
        intakeMonth: form.intakeMonth || null,
        intakeYear: form.intakeYear || null,
        studyMode: form.studyMode || null,
        studyDuration: form.studyDuration || null,
        studyBudget: form.studyBudget || null,
        studyAttendanceType: form.studyAttendanceType || null,
        typeOfDegree: form.typeOfDegree || null,
        workExperience: form.workExperience || null,
        recLevelAcademic: form.recLevelAcademic || null,
        recGradeAchieved: form.recGradeAchieved || null,
        preStudyLoc: form.preStudyLoc || null,
        contactId: form.contactId === '' ? null : Number(form.contactId),
        notes: form.notes || null,
        ieltsScore: form.ieltsScore === '' ? null : Number(form.ieltsScore),
        toeflScore: form.toeflScore === '' ? null : Number(form.toeflScore),
        greScore: form.greScore === '' ? null : Number(form.greScore),
        gmatScore: form.gmatScore === '' ? null : Number(form.gmatScore),
        academicHistory: form.academicHistory.filter(
          (r) => r.degree || r.institution || r.year || r.grade
        ),
        educationDetails: form.educationDetails.filter((r) => r.label || r.passing_year || r.grade),
        asstExamSections: form.asstExamSections.filter((r) => r.type || r.overall_score || r.label),
      };
      await updateStudent(selectedId, payload);
      flash('Profile saved');
      await loadProfile();
      await loadStudents();
      return true;
    } catch (e) {
      flash(e?.message || 'Save failed', false);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const markEnrolled = async (value) => {
    if (!selectedId) return;
    try {
      await setStudentEnrolled(selectedId, value);
      flash(value ? 'Marked as enrolled' : 'Enrollment removed');
      await loadProfile();
    } catch (e) {
      flash(e?.message || 'Failed', false);
    }
  };

  const handleArchiveStudent = async () => {
    if (!selectedId || !profile) return;
    const name = profile.fullName || profile.email || `student #${selectedId}`;
    const enrolledNote = profile.isEnrolled
      ? '\n\nThis student is marked enrolled.'
      : '';
    if (
      !window.confirm(
        `Download ${name}'s data, then move them to Archive?${enrolledNote}\n\nYou can restore or permanently delete later from Archive → Students.`,
      )
    ) {
      return;
    }

    setArchiving(true);
    try {
      await downloadStudentExport(selectedId, profile.fullName || profile.email || `student_${selectedId}`);
      await archiveStudent(selectedId);
      flash('Data downloaded — student moved to Archive');
      setSelectedId(null);
      setProfile(null);
      await loadStudents();
    } catch (e) {
      flash(e?.message || 'Failed to archive student', false);
    } finally {
      setArchiving(false);
    }
  };

  const toggleChecklist = async (checkListId, completed) => {
    try {
      await updateChecklistValue(selectedId, checkListId, { completed });
      await loadProfile();
    } catch (e) {
      flash(e?.message || 'Checklist update failed', false);
    }
  };

  const docsApp =
    profile?.applications?.find((a) => a.id === docsAppId) || profile?.applications?.[0] || null;

  const refreshDocsApp = async () => {
    await loadProfile();
  };

  useEffect(() => {
    if (!docsApp?.id) {
      setWorkflowApp(null);
      return;
    }
    getApplication(docsApp.id)
      .then((res) => setWorkflowApp(res?.data || null))
      .catch(() => setWorkflowApp(null));
  }, [docsApp?.id]);

  const handleSaveWorkflowProgress = async (payload) => {
    if (!workflowApp?.id) return;
    try {
      await saveWorkflowProgress(workflowApp.id, payload);
      flash('Workflow step saved');
      const res = await getApplication(workflowApp.id);
      setWorkflowApp(res?.data || null);
      await loadProfile();
    } catch (e) {
      flash(e?.message || 'Failed to save workflow step', false);
    }
  };

  const handleDocStatus = async (docId, status) => {
    if (!docsApp) return;
    try {
      await updateDocument(docsApp.id, docId, { status });
      flash('Document status updated');
      await refreshDocsApp();
    } catch (e) {
      flash(e?.message || 'Failed to update document', false);
    }
  };

  const handleDocApprove = async (docId) => {
    if (!docsApp) return;
    try {
      await updateDocument(docsApp.id, docId, { status: 'VERIFIED' });
      flash('Document verified');
      await refreshDocsApp();
    } catch (e) {
      flash(e?.message || 'Failed to approve document', false);
    }
  };

  const handleDocReject = async (docId, notes) => {
    if (!docsApp) return;
    try {
      await updateDocument(docsApp.id, docId, { status: 'REJECTED', notes: notes || null });
      flash('Document rejected');
      await refreshDocsApp();
    } catch (e) {
      flash(e?.message || 'Failed to reject document', false);
    }
  };

  const handleDocDelete = async (docId) => {
    if (!docsApp) return;
    try {
      await deleteDocument(docsApp.id, docId);
      flash('Document removed');
      await refreshDocsApp();
    } catch (e) {
      flash(e?.message || 'Failed to delete document', false);
    }
  };

  const handleDocClearFile = async (docId) => {
    if (!docsApp) return;
    try {
      await updateDocument(docsApp.id, docId, { fileUrl: null, filename: null, status: 'PENDING', notes: null });
      flash('File deleted');
      await refreshDocsApp();
    } catch (e) {
      flash(e?.message || 'Failed to delete file', false);
    }
  };

  const handleAddDoc = async (name) => {
    if (!docsApp || !name) return;
    try {
      const created = await addDocument(docsApp.id, { name, required: true });
      flash('Added to document checklist');
      await refreshDocsApp();
      return created?.data || created;
    } catch (e) {
      flash(e?.message || 'Failed to add document', false);
    }
    return null;
  };

  const handleDocUpload = async (docId, file) => {
    if (!docsApp || !file) return;
    setUploadingDocId(docId);
    try {
      await uploadApplicationDocument(docsApp.id, docId, file);
      flash('Document uploaded');
      await refreshDocsApp();
    } catch (e) {
      flash(e?.message || 'Upload failed', false);
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleNotifyMissing = async () => {
    if (!docsApp) return;
    try {
      await notifyMissingDocs(docsApp.id);
      flash('Missing-document alert sent');
    } catch (e) {
      flash(e?.message || 'Failed to send alert', false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'tests', label: 'Exams', icon: GraduationCap },
  ];

  return (
    <div className="text-neutral-800 space-y-4">
      {toast.msg && (
        <div className="fixed bottom-6 right-6 z-50 ui-text-body border border-[var(--ui-border)] bg-white px-4 py-3 rounded-[var(--ui-radius)]">
          {toast.msg}
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-8.5rem)] lg:min-h-0">
          <div className="lg:col-span-3 ui-panel flex flex-col min-h-0 lg:h-full overflow-hidden">
            <div className="p-3 border-b border-[var(--ui-border)] space-y-2.5">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="ui-text-strong">Students</h2>
                  <span className="ui-text-meta">{students.length}</span>
                </div>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => setShowNew(true)}
                    className="ui-btn-primary inline-flex items-center gap-1.5 shrink-0 !px-2.5 !py-1.5 text-xs"
                  >
                    <Plus size={14} /> New student
                  </button>
                ) : null}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="ui-field pl-9"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading && !students.length ? (
                <p className="p-8 text-center ui-text-meta">Loading…</p>
              ) : students.length === 0 ? (
                <p className="p-8 text-center ui-text-meta">No students yet</p>
              ) : (
                students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-4 py-3 border-b border-[var(--ui-border)] transition hover:bg-[var(--ui-bg-page)] ${
                      selectedId === s.id ? 'bg-[var(--ui-bg-page)]' : ''
                    }`}
                  >
                    <p className={`text-[13px] ${selectedId === s.id ? 'font-medium text-[var(--ui-text)]' : 'text-[var(--ui-text-secondary)]'}`}>
                      {s.fullName}
                    </p>
                    <p className="ui-text-meta truncate">{s.email}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-9 min-h-0 overflow-y-auto space-y-3">
            {!profile || !form ? (
              <div className="ui-panel p-8 text-center text-neutral-500">
                <User size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a student to view or edit their profile.</p>
              </div>
            ) : (
              <>
                <div className="ui-panel px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-brand">{form.fullName}</h2>
                      {profile.isEnrolled && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Enrolled
                        </span>
                      )}
                      {profile.processStage && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          {PROCESS_STAGE_LABELS[profile.processStage] || profile.processStage}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500">{form.email}</p>
                    {profile.totalCheckList > 0 && (
                      <p className="text-xs text-neutral-400 mt-1">
                        Checklist: {profile.completedCheckList}/{profile.totalCheckList} complete
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedId && (
                      <Link
                        href={`/communication?studentId=${selectedId}`}
                        className="ui-btn-secondary inline-flex items-center gap-2 text-xs"
                      >
                        <MessageSquare size={14} />
                        Messages
                      </Link>
                    )}
                    {canManage && !profile.isEnrolled && (
                      <button type="button" onClick={() => markEnrolled(true)} className="ui-btn-secondary text-xs">
                        Mark enrolled
                      </button>
                    )}
                    {canManage && profile.isEnrolled && (
                      <button type="button" onClick={() => markEnrolled(false)} className="ui-btn-secondary text-xs">
                        Unlock profile
                      </button>
                    )}
                    {canManage && tab !== 'applications' && tab !== 'process' && !profile.isEnrolled && (
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
                        onClick={handleArchiveStudent}
                        disabled={archiving}
                        className="ui-btn-secondary inline-flex items-center gap-2 text-xs text-red-700 border-red-200 hover:bg-red-50"
                        title="Download data, then move to Archive"
                      >
                        {archiving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <Download size={14} />
                            <Archive size={14} />
                          </>
                        )}
                        {archiving ? 'Archiving…' : 'Download & archive'}
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium ${tab === t.id ? 'bg-brand text-white' : 'text-neutral-600 hover:bg-neutral-50'
                          }`}
                      >
                        <Icon size={14} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {tab === 'personal' && (
                  <div className="ui-panel space-y-5 p-6">
                    <div className="rounded-xl bg-neutral-100 px-5 py-3.5 text-sm font-medium text-neutral-600">
                      Fill up the mandatory details required...
                    </div>

                    <PersonalDetailsFields
                      form={form}
                      onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
                      countries={formOptions.countries}
                      industries={formOptions.industries || []}
                      counsellors={counsellors}
                      locked={!canManage || profile.isEnrolled}
                      phoneLocked={!canManage}
                      emailLocked
                    />

                    {canManage && !profile.isEnrolled && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={saveProfile}
                          disabled={saving}
                          className="rounded-lg bg-brand px-10 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-hover disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Update Details'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'education' && (
                  <div className="ui-panel p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-neutral-800">Education details</h3>
                      {canManage && !profile.isEnrolled && (
                        <button
                          type="button"
                          className="text-xs font-medium text-neutral-700"
                          onClick={() =>
                            setForm({
                              ...form,
                              educationDetails: [...form.educationDetails, emptyEducation()],
                            })
                          }
                        >
                          + Add qualification
                        </button>
                      )}
                    </div>
                    {form.educationDetails.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-lg">
                        <Field label="Type">
                          <select
                            className={INPUT}
                            value={row.type}
                            disabled={!canManage || profile.isEnrolled}
                            onChange={(e) => {
                              const next = [...form.educationDetails];
                              next[idx] = { ...next[idx], type: e.target.value };
                              setForm({ ...form, educationDetails: next });
                            }}
                          >
                            {['SSC', 'HSC', 'UG', 'PG'].map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Qualification">
                          <input
                            className={INPUT}
                            value={row.label}
                            disabled={!canManage || profile.isEnrolled}
                            onChange={(e) => {
                              const next = [...form.educationDetails];
                              next[idx] = { ...next[idx], label: e.target.value };
                              setForm({ ...form, educationDetails: next });
                            }}
                          />
                        </Field>
                        <Field label="Passing year">
                          <input
                            className={INPUT}
                            value={row.passing_year}
                            disabled={!canManage || profile.isEnrolled}
                            onChange={(e) => {
                              const next = [...form.educationDetails];
                              next[idx] = { ...next[idx], passing_year: e.target.value };
                              setForm({ ...form, educationDetails: next });
                            }}
                          />
                        </Field>
                        <Field label="Grade">
                          <input
                            className={INPUT}
                            value={row.grade}
                            disabled={!canManage || profile.isEnrolled}
                            onChange={(e) => {
                              const next = [...form.educationDetails];
                              next[idx] = { ...next[idx], grade: e.target.value };
                              setForm({ ...form, educationDetails: next });
                            }}
                          />
                        </Field>
                      </div>
                    ))}

                    <div className="border-t border-neutral-200 pt-6 mt-2">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-neutral-800">Academic history</h3>
                        {canManage && !profile.isEnrolled && (
                          <button
                            type="button"
                            className="text-xs font-medium text-neutral-700"
                            onClick={() =>
                              setForm({
                                ...form,
                                academicHistory: [...form.academicHistory, emptyAcademic()],
                              })
                            }
                          >
                            + Add entry
                          </button>
                        )}
                      </div>
                      {form.academicHistory.map((row, idx) => (
                        <div key={`ac-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-lg mb-3">
                          <Field label="Degree">
                            <input
                              className={INPUT}
                              value={row.degree}
                              disabled={!canManage || profile.isEnrolled}
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
                              disabled={!canManage || profile.isEnrolled}
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
                              disabled={!canManage || profile.isEnrolled}
                              onChange={(e) => {
                                const next = [...form.academicHistory];
                                next[idx] = { ...next[idx], year: e.target.value };
                                setForm({ ...form, academicHistory: next });
                              }}
                            />
                          </Field>
                          <Field label="Grade">
                            <input
                              className={INPUT}
                              value={row.grade}
                              disabled={!canManage || profile.isEnrolled}
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
                  </div>
                )}

                {tab === 'tests' && (
                  <div className="space-y-4">
                    <div className="ui-panel p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        ['ieltsScore', 'IELTS (summary)'],
                        ['toeflScore', 'TOEFL (summary)'],
                        ['greScore', 'GRE (summary)'],
                        ['gmatScore', 'GMAT (summary)'],
                      ].map(([key, label]) => (
                        <Field key={key} label={label}>
                          <input
                            type="number"
                            step="0.5"
                            className={INPUT}
                            value={form[key]}
                            disabled={!canManage || profile.isEnrolled}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            placeholder="Score"
                          />
                        </Field>
                      ))}
                    </div>
                    <div className="ui-panel p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-neutral-800">Exam sections</h3>
                        {canManage && !profile.isEnrolled && (
                          <button
                            type="button"
                            className="text-xs font-medium text-neutral-700"
                            onClick={() =>
                              setForm({
                                ...form,
                                asstExamSections: [...form.asstExamSections, emptyExam()],
                              })
                            }
                          >
                            + Add exam
                          </button>
                        )}
                      </div>
                      {form.asstExamSections.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-neutral-50 rounded-lg">
                          <Field label="Exam">
                            <input
                              className={INPUT}
                              value={row.type}
                              disabled={!canManage || profile.isEnrolled}
                              onChange={(e) => {
                                const next = [...form.asstExamSections];
                                next[idx] = { ...next[idx], type: e.target.value };
                                setForm({ ...form, asstExamSections: next });
                              }}
                            />
                          </Field>
                          <Field label="Overall">
                            <input
                              className={INPUT}
                              value={row.overall_score}
                              disabled={!canManage || profile.isEnrolled}
                              onChange={(e) => {
                                const next = [...form.asstExamSections];
                                next[idx] = { ...next[idx], overall_score: e.target.value };
                                setForm({ ...form, asstExamSections: next });
                              }}
                            />
                          </Field>
                          <Field label="Reading">
                            <input
                              className={INPUT}
                              value={row.reading}
                              disabled={!canManage || profile.isEnrolled}
                              onChange={(e) => {
                                const next = [...form.asstExamSections];
                                next[idx] = { ...next[idx], reading: e.target.value };
                                setForm({ ...form, asstExamSections: next });
                              }}
                            />
                          </Field>
                          <Field label="Writing">
                            <input
                              className={INPUT}
                              value={row.writing}
                              disabled={!canManage || profile.isEnrolled}
                              onChange={(e) => {
                                const next = [...form.asstExamSections];
                                next[idx] = { ...next[idx], writing: e.target.value };
                                setForm({ ...form, asstExamSections: next });
                              }}
                            />
                          </Field>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}
          </div>
        </div>

      {showNew && (
        <NewStudentModal
          formOptions={formOptions}
          counsellors={counsellors}
          onClose={() => setShowNew(false)}
          onCreated={async (student) => {
            setShowNew(false);
            await loadStudents();
            if (student?.id) setSelectedId(student.id);
            flash('Student created');
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

function NewStudentModal({ formOptions = {}, countries = [], industries = [], counsellors = [], onClose, onCreated }) {
  const [form, setForm] = useState(emptyEnquiryForm);
  const [busy, setBusy] = useState(false);
  const options = {
    ...formOptions,
    countries: formOptions.countries || countries,
    industries: formOptions.industries || industries,
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await createStudent(enquiryFormToStudentPayload(form));
      onCreated(res?.data);
    } catch (err) {
      alert(err?.message || 'Failed to create student');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New student" onClose={onClose} wide>
      <form onSubmit={submit} className="p-6 space-y-5">
        <StudentEnquiryForm
          form={form}
          onChange={setForm}
          formOptions={options}
          counsellors={counsellors}
          requireIdentity
        />
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

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand/30">
      <div className={`ui-panel w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} max-h-[90vh] overflow-y-auto`}>
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
