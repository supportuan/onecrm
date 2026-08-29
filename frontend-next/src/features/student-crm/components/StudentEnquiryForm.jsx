'use client';

import { Download } from 'lucide-react';
import { resolveFormDropdowns } from '../studentFormOptions';
import { downloadStudentEnquiryForm } from '../downloadEnquiryForm';

const fieldClass =
  'w-full rounded-lg border-0 border-b border-neutral-300 bg-transparent px-0 py-1.5 text-sm text-neutral-800 outline-none focus:border-brand disabled:text-neutral-500';
const labelClass = 'mb-0.5 block text-[11px] text-neutral-500';

const Field = ({ label, className = '', children }) => (
  <div className={className}>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

const Select = ({ value, onChange, disabled, children, required }) => (
  <select className={fieldClass} value={value || ''} onChange={onChange} disabled={disabled} required={required}>
    <option value="" />
    {children}
  </select>
);

export default function StudentEnquiryForm({
  form,
  onChange,
  formOptions = {},
  counsellors = [],
  locked = false,
  emailLocked = false,
  requireIdentity = false,
  showDownload = true,
}) {
  const d = resolveFormDropdowns(formOptions);
  const patch = (next) => onChange({ ...form, ...next });
  const countries = d.countries;
  const industries = d.industries;
  const sources = d.leadSources.length
    ? d.leadSources
    : ['Walk-in', 'Website', 'Referral', 'Agent', 'Other'].map((name) => ({ id: name, name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Student Enquiry Form</h2>
          <p className="ui-text-meta mt-0.5">Same form used for New student and the application Students-info step.</p>
        </div>
        {showDownload ? (
          <button
            type="button"
            className="ui-btn-secondary inline-flex items-center gap-1.5 text-xs"
            onClick={() => {
              downloadStudentEnquiryForm({ ...formOptions, counsellors }, form).catch(() => {
                alert('Could not download the PDF. Try again.');
              });
            }}
          >
            <Download size={13} /> Download PDF
          </button>
        ) : null}
      </div>

      <section className="space-y-3">
        <h3 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Student details
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Student's name" className="sm:col-span-2">
            <input
              className={fieldClass}
              value={form.fullName || ''}
              required={requireIdentity}
              disabled={locked}
              onChange={(e) => patch({ fullName: e.target.value })}
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              className={fieldClass}
              value={form.dob || ''}
              disabled={locked}
              onChange={(e) => patch({ dob: e.target.value })}
            />
          </Field>
          <Field label="Mobile">
            <input
              className={fieldClass}
              value={form.phone || ''}
              disabled={locked}
              onChange={(e) => patch({ phone: e.target.value })}
            />
          </Field>
          <Field label="Email ID" className="sm:col-span-2">
            <input
              type="email"
              className={fieldClass}
              value={form.email || ''}
              required={requireIdentity}
              disabled={locked || emailLocked}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input
              className={fieldClass}
              value={form.address || ''}
              disabled={locked}
              onChange={(e) => patch({ address: e.target.value })}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Source of enquiry
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Source of enquiry">
            <Select
              value={form.source}
              disabled={locked}
              onChange={(e) => patch({ source: e.target.value })}
            >
              {sources.map((item) => (
                <option key={item.id || item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Counsellor / POC">
            <Select
              value={form.contactId}
              disabled={locked}
              onChange={(e) => patch({ contactId: e.target.value })}
            >
              {counsellors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Course details
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="SSLC (10th) mark %">
            <input className={fieldClass} value={form.sslcMark || ''} disabled={locked} onChange={(e) => patch({ sslcMark: e.target.value })} />
          </Field>
          <Field label="Overall mark %">
            <input className={fieldClass} value={form.overallMark || ''} disabled={locked} onChange={(e) => patch({ overallMark: e.target.value })} />
          </Field>
          <Field label="Diploma / course completed">
            <input className={fieldClass} value={form.diplomaCourse || ''} disabled={locked} onChange={(e) => patch({ diplomaCourse: e.target.value })} />
          </Field>
          <Field label="Year">
            <input className={fieldClass} value={form.diplomaYear || ''} disabled={locked} onChange={(e) => patch({ diplomaYear: e.target.value })} />
          </Field>
          <Field label="Working experience (years)">
            <input className={fieldClass} value={form.workExperience || ''} disabled={locked} onChange={(e) => patch({ workExperience: e.target.value })} />
          </Field>
          <Field label="Study level">
            <Select value={form.level} disabled={locked} onChange={(e) => patch({ level: e.target.value })}>
              {d.studyLevels.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Exam">
            <Select value={form.examType} disabled={locked} onChange={(e) => patch({ examType: e.target.value })}>
              {d.examTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="English / overall %">
            <input className={fieldClass} value={form.englishPercent || ''} disabled={locked} onChange={(e) => patch({ englishPercent: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Course want to study
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Option 1 — Country">
            <Select
              value={form.countryId}
              disabled={locked}
              onChange={(e) => {
                const country = countries.find((item) => String(item.id) === e.target.value);
                patch({ countryId: e.target.value, preferredCountry: country?.name || '' });
              }}
            >
              {countries.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Option 2 — Country">
            <Select
              value={form.countryOption2Id}
              disabled={locked}
              onChange={(e) => patch({ countryOption2Id: e.target.value })}
            >
              {countries.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Study industry">
            <Select
              value={form.industryId}
              disabled={locked}
              onChange={(e) => patch({ industryId: e.target.value, subIndustryId: '', studyAreaId: '' })}
            >
              {industries.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Intake">
            <Select value={form.intakeMonth} disabled={locked} onChange={(e) => patch({ intakeMonth: e.target.value })}>
              {d.intakeMonths.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Intake year">
            <Select value={form.intakeYear} disabled={locked} onChange={(e) => patch({ intakeYear: e.target.value })}>
              {d.intakeYears.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Course 1">
            <input className={fieldClass} value={form.course1 || ''} disabled={locked} onChange={(e) => patch({ course1: e.target.value })} />
          </Field>
          <Field label="Course 2" className="sm:col-span-2">
            <input className={fieldClass} value={form.course2 || ''} disabled={locked} onChange={(e) => patch({ course2: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Previous history
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ['hasPassport', 'Do you have passport?'],
            ['travelledOutside', 'Travelled outside country of residence?'],
            ['studiedAbroad', 'Studied in any country before?'],
            ['banned', 'Ever been banned for any country?'],
            ['visaRefused', 'Ever been refused a visa?'],
            ['appliedOtherAgent', 'Applied via another agent or own?'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <Select value={form[key]} disabled={locked} onChange={(e) => patch({ [key]: e.target.value })}>
                {d.yesNo.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </Field>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Office use only — visa information
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="UK / destination visa">
            <Select value={form.ukVisa} disabled={locked} onChange={(e) => patch({ ukVisa: e.target.value })}>
              {d.yesNo.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Visa type">
            <Select value={form.visaType} disabled={locked} onChange={(e) => patch({ visaType: e.target.value })}>
              {d.visaTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Visa fees (approx INR)">
            <input className={fieldClass} value={form.visaFees || ''} disabled={locked} onChange={(e) => patch({ visaFees: e.target.value })} />
          </Field>
          <Field label="Inner London">
            <input className={fieldClass} value={form.innerLondon || ''} disabled={locked} onChange={(e) => patch({ innerLondon: e.target.value })} />
          </Field>
          <Field label="Outer London">
            <input className={fieldClass} value={form.outerLondon || ''} disabled={locked} onChange={(e) => patch({ outerLondon: e.target.value })} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea
              className="min-h-[72px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand"
              value={form.officeNotes || ''}
              disabled={locked}
              onChange={(e) => patch({ officeNotes: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input type="date" className={fieldClass} value={form.officeDate || ''} disabled={locked} onChange={(e) => patch({ officeDate: e.target.value })} />
          </Field>
          <Field label="Place">
            <input className={fieldClass} value={form.place || ''} disabled={locked} onChange={(e) => patch({ place: e.target.value })} />
          </Field>
        </div>
      </section>
    </div>
  );
}
