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
  Globe,
} from 'lucide-react';
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  createApplication,
  listCounsellors,
  setStudentEnrolled,
  updateChecklistValue,
} from '@/services/studentCrmApi';
import { getFormOptions, listIndustries, listIndustrySubFields } from '@/services/crmSettingsApi';
import { studyIdsFromProfile, toNumOrNull, toSelectId } from '../studyFormOptions';
import CatalogCourseFields from '../components/CatalogCourseFields';
import { resolveCatalogCountryId, pickCatalogCountry } from '../catalogCountry';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { getStageLabel, stageBadgeClass } from '../constants';

const INPUT =
  'w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none';
const SELECT =
  "w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-800 focus:border-neutral-400 outline-none appearance-none cursor-pointer bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10";
const SELECT_BG = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
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
  const [formOptions, setFormOptions] = useState({ countries: [], industries: [] });
  const [countryIndustries, setCountryIndustries] = useState([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [industryLoadError, setIndustryLoadError] = useState('');
  const [subFields, setSubFields] = useState([]);
  const [loadingSubFields, setLoadingSubFields] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [toast, setToast] = useState({ kind: '', msg: '' });

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
    getFormOptions()
      .then((r) => setFormOptions(r?.data || { countries: [], industries: [] }))
      .catch(() => setFormOptions({ countries: [], industries: [] }));
  }, []);

  const [form, setForm] = useState(null);

  useEffect(() => {
    const catalogCountryId = resolveCatalogCountryId(form?.countryId);
    if (!catalogCountryId) {
      setCountryIndustries([]);
      setIndustryLoadError('');
      return;
    }
    setLoadingIndustries(true);
    setIndustryLoadError('');
    listIndustries({ countryId: catalogCountryId })
      .then((r) => setCountryIndustries(Array.isArray(r?.data) ? r.data : []))
      .catch((err) => {
        console.error('Failed to load fields of study', err);
        setCountryIndustries([]);
        setIndustryLoadError(err?.message || 'Failed to load fields from catalog');
      })
      .finally(() => setLoadingIndustries(false));
  }, [form?.countryId]);

  useEffect(() => {
    const catalogCountryId = resolveCatalogCountryId(form?.countryId);
    const industryId = form?.industryId;
    if (!catalogCountryId || !industryId) {
      setSubFields([]);
      return;
    }
    setLoadingSubFields(true);
    listIndustrySubFields({ countryId: catalogCountryId, industryId })
      .then((r) => setSubFields(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setSubFields([]))
      .finally(() => setLoadingSubFields(false));
  }, [form?.countryId, form?.industryId]);

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
      dob: profile.dob ? profile.dob.slice(0, 10) : '',
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
    if (!form || !selectedId) return;
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
        preferredUniversityId: toNumOrNull(form.universityId),
        preferredCourseId: toNumOrNull(form.courseId),
        preferredCourse: form.course || null,
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
    } catch (e) {
      flash(e?.message || 'Save failed', false);
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

  const toggleChecklist = async (checkListId, completed) => {
    try {
      await updateChecklistValue(selectedId, checkListId, { completed });
      await loadProfile();
    } catch (e) {
      flash(e?.message || 'Checklist update failed', false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'study', label: 'Study plan', icon: Globe },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'tests', label: 'Exams', icon: GraduationCap },
    { id: 'process', label: 'Checklist', icon: CheckCircle2 },
    { id: 'applications', label: 'Applications', icon: FileText },
  ];

  return (
    <div className="ui-container text-neutral-800">
      {toast.msg && (
        <div className="fixed bottom-6 right-6 z-50 ui-text-body border border-[var(--ui-border)] bg-white px-4 py-3 rounded-[var(--ui-radius)]">
          {toast.msg}
        </div>
      )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="ui-text-body max-w-xl">
            Manage student profiles, academic history, and applications.
          </p>
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
          <div className="lg:col-span-3 ui-panel flex flex-col max-h-[calc(100vh-180px)] overflow-hidden">
            <div className="p-4 border-b border-[var(--ui-border)] space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="ui-text-strong">Students</h2>
                <span className="ui-text-meta">{students.length}</span>
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
            <div className="flex-1 overflow-y-auto">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-neutral-900">{form.fullName}</h2>
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium ${tab === t.id ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'
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
                    <Field label="First name">
                      <input
                        className={INPUT}
                        value={form.firstName}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      />
                    </Field>
                    <Field label="Last name">
                      <input
                        className={INPUT}
                        value={form.lastName}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      />
                    </Field>
                    <Field label="Full name">
                      <input
                        className={INPUT}
                        value={form.fullName}
                        disabled={!canManage || profile.isEnrolled}
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
                    <Field label="Assigned counsellor">
                      <select
                        className={INPUT}
                        value={form.contactId}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {counsellors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName}
                          </option>
                        ))}
                      </select>
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

                {tab === 'study' && (
                  <div className="ui-panel p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Study level">
                      <select
                        className={SELECT}
                        style={SELECT_BG}
                        value={form.level}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, level: e.target.value })}
                      >
                        <option value="">Select</option>
                        {['UG', 'PG', 'PhD', 'Diploma'].map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Destination country">
                      <select
                        className={SELECT}
                        style={SELECT_BG}
                        value={form.countryId}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => {
                          const country = formOptions.countries?.find((c) => String(c.id) === e.target.value);
                          const catalogId = resolveCatalogCountryId(e.target.value) || e.target.value;
                          setForm({
                            ...form,
                            countryId: catalogId,
                            preferredCountry: country?.name || '',
                            industryId: '',
                            subIndustryId: '',
                            studyAreaId: '',
                            university: '',
                            courseId: '',
                            course: '',
                          });
                        }}
                      >
                        <option value="">Select country</option>
                        {formOptions.countries?.map((c) => (
                          <option key={c.id} value={String(c.catalogCountryId ?? c.id)}>
                            {c.name}
                            {c.courseCount > 0 ? ` (${c.courseCount.toLocaleString()} courses)` : ''}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={`Field of study${countryIndustries.length ? ` — ${countryIndustries.length} in catalog` : ''}`}>
                      <select
                        className={SELECT}
                        style={SELECT_BG}
                        value={form.industryId}
                        disabled={!canManage || profile.isEnrolled || !form.countryId || loadingIndustries}
                        onChange={(e) => setForm({ ...form, industryId: e.target.value, subIndustryId: '', studyAreaId: '' })}
                      >
                        <option value="">
                          {!form.countryId
                            ? 'Select country first'
                            : loadingIndustries
                              ? 'Scanning course catalog (first load may take ~1 min)…'
                              : industryLoadError
                                ? industryLoadError
                                : countryIndustries.length
                                  ? 'Select field of study'
                                  : 'No fields matched for this country'}
                        </option>
                        {countryIndustries.map((i) => (
                          <option key={i.id ?? i.name} value={i.id ? String(i.id) : ''} disabled={!i.id}>
                            {i.name}
                            {i.courseCount != null ? ` (${i.courseCount.toLocaleString()} courses)` : ''}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={`Program level${subFields.length ? ` — ${subFields.length} in catalog` : ''}`}>
                      <select
                        className={SELECT}
                        style={SELECT_BG}
                        value={form.subIndustryId}
                        disabled={!canManage || profile.isEnrolled || !form.industryId || loadingSubFields}
                        onChange={(e) => {
                          const selected = subFields.find((s) => s.id && String(s.id) === e.target.value);
                          setForm({
                            ...form,
                            subIndustryId: e.target.value,
                            level: selected?.name || form.level,
                            studyAreaId: '',
                          });
                        }}
                      >
                        <option value="">
                          {!form.industryId
                            ? 'Select field of study first'
                            : loadingSubFields
                              ? 'Loading program levels…'
                              : subFields.length
                                ? 'Select program level'
                                : 'No program levels for this field'}
                        </option>
                        {subFields.map((s) => (
                          <option key={s.id ?? s.name} value={s.id ? String(s.id) : ''} disabled={!s.id}>
                            {s.name}
                            {s.courseCount != null ? ` (${s.courseCount.toLocaleString()} courses)` : ''}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <CatalogCourseFields
                        hideCountry
                        countryId={resolveCatalogCountryId(form.countryId) || form.countryId}
                        countries={formOptions.countries}
                        value={form}
                        onChange={(catalog) => setForm((prev) => ({ ...prev, ...catalog }))}
                        inputClass={INPUT}
                        disabled={!canManage || profile.isEnrolled}
                      />
                    </div>
                    <Field label="Intake month">
                      <input
                        className={INPUT}
                        value={form.intakeMonth}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, intakeMonth: e.target.value })}
                      />
                    </Field>
                    <Field label="Intake year">
                      <input
                        className={INPUT}
                        value={form.intakeYear}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, intakeYear: e.target.value })}
                      />
                    </Field>
                    <Field label="Study mode">
                      <input
                        className={INPUT}
                        value={form.studyMode}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, studyMode: e.target.value })}
                        placeholder="On-campus / Online"
                      />
                    </Field>
                    <Field label="Duration">
                      <input
                        className={INPUT}
                        value={form.studyDuration}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, studyDuration: e.target.value })}
                      />
                    </Field>
                    <Field label="Budget">
                      <input
                        className={INPUT}
                        value={form.studyBudget}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, studyBudget: e.target.value })}
                      />
                    </Field>
                    <Field label="Work experience">
                      <input
                        className={INPUT}
                        value={form.workExperience}
                        disabled={!canManage || profile.isEnrolled}
                        onChange={(e) => setForm({ ...form, workExperience: e.target.value })}
                      />
                    </Field>
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

                {tab === 'process' && (
                  <div className="ui-panel p-6 space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-800">Application checklist</h3>
                    {!profile.checklists?.length ? (
                      <p className="text-sm text-neutral-500">Select a destination country in Study plan to load checklist items.</p>
                    ) : (
                      profile.checklists.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            disabled={!canManage || profile.isEnrolled}
                            onChange={(e) => toggleChecklist(item.checkListId, e.target.checked)}
                            className="mt-1"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{item.checkList?.name}</p>
                            <p className="text-xs text-neutral-500">
                              {PROCESS_STAGE_LABELS[item.checkList?.stage] || item.checkList?.stage}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
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

      {showNew && (
        <NewStudentModal
          countries={formOptions.countries}
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
          countries={formOptions.countries}
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

function NewStudentModal({ countries = [], onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    nationality: 'India',
    preferredCountry: '',
    countryId: '',
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
        countryId: form.countryId ? Number(form.countryId) : undefined,
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
          {countries.length ? (
            <select
              className={SELECT}
              style={SELECT_BG}
              value={form.countryId}
              onChange={(e) => {
                const country = countries.find((c) => String(c.id) === e.target.value);
                setForm({
                  ...form,
                  countryId: e.target.value,
                  preferredCountry: country?.name || '',
                });
              }}
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input className={INPUT} value={form.preferredCountry} onChange={(e) => setForm({ ...form, preferredCountry: e.target.value })} />
          )}
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

function NewAppModal({ student, countries = [], counsellors, onClose, onCreated }) {
  const initialCountryId =
    student.countryId != null
      ? String(student.countryId)
      : countries.find((c) => c.name === student.preferredCountry)?.id != null
        ? String(countries.find((c) => c.name === student.preferredCountry).id)
        : '';

  const [form, setForm] = useState({
    country: student.preferredCountry || '',
    countryId: initialCountryId,
    university: '',
    universityId: '',
    course: '',
    courseId: '',
    intake: '',
    deadline: '',
    assignedToId: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.country || !form.university || !form.course) return;
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
        <CatalogCourseFields
          countries={countries}
          value={form}
          onChange={(catalog) => setForm((prev) => ({ ...prev, ...catalog }))}
          inputClass={INPUT}
        />
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
