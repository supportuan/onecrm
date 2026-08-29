'use client';

import { useEffect, useState } from 'react';
import StudentEnquiryForm from './StudentEnquiryForm';
import { enquiryFormFromStudent, enquiryFormToStudentPayload } from '../studentEnquiryForm';

export default function StudentInfoPanel({
  student,
  canManage,
  counsellors = [],
  formOptions = {},
  onSave,
}) {
  const [form, setForm] = useState(() => enquiryFormFromStudent(student));
  const [saving, setSaving] = useState(false);
  const locked = Boolean(student?.isEnrolled) || !canManage;

  useEffect(() => {
    setForm(enquiryFormFromStudent(student));
  }, [student?.id, student?.updatedAt]);

  const save = async () => {
    if (locked || saving || !onSave) return;
    setSaving(true);
    try {
      await onSave(enquiryFormToStudentPayload(form));
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return <p className="text-sm text-neutral-500">No student is linked to this application yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end">
        {canManage && !student.isEnrolled ? (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="shrink-0 rounded-lg bg-brand px-5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Update'}
          </button>
        ) : null}
      </div>
      <StudentEnquiryForm
        form={form}
        onChange={setForm}
        formOptions={formOptions}
        counsellors={counsellors}
        locked={locked}
        emailLocked
      />
    </div>
  );
}
