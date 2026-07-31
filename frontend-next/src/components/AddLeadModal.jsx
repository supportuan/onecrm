'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

import { createLead, getSources } from '@/services/marketingApi';
import { getCounsellors } from '@/services/userApi';
import CountryDropdown from '@/lib/CountryDropdown/CountryDropdown';

const LEAD_RATING_OPTIONS = ['HOT', 'WARM', 'COLD', 'MAYBE'];

const createEmptyForm = () => ({
  fullName: '',
  email: '',
  phone: '',
  country: '',
  preferredCountryId: '',
  preferredCountry: '',
  preferredCourse: '',
  sourceId: '',
  rating: 'WARM',
  remark: '',
  assignedCounsellorId: '',
});

const FIELD_CLASS =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition focus:border-[#0084ff] focus:outline-none focus:ring-2 focus:ring-[#0084ff]/20';

const AddLeadModal = ({
  open,
  onClose,
  onCreated,
}) => {
  const [form, setForm] = useState(createEmptyForm);
  const [sources, setSources] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const loadDropdownData = async () => {
      try {
        const [sourcesResponse, counsellorsResponse] =
          await Promise.all([
            getSources(),
            getCounsellors(),
          ]);

        setSources(
          sourcesResponse?.success
            ? sourcesResponse.data || []
            : []
        );

        setCounsellors(
          counsellorsResponse?.success
            ? counsellorsResponse.data || []
            : []
        );
      } catch (error) {
        console.error(
          'Failed to load Add Lead options:',
          error
        );

        setSources([]);
        setCounsellors([]);
      }
    };

    loadDropdownData();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setForm(createEmptyForm());
      return undefined;
    }

    // Safari: fixed modals inside overflow-hidden shells clip/mis-size;
    // lock body scroll while open and escape via Escape.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, submitting]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const {
        preferredCountryId,
        ...formData
      } = form;

      const payload = {
        ...formData,

        sourceId: form.sourceId
          ? Number(form.sourceId)
          : null,

        assignedCounsellorId:
          form.assignedCounsellorId
            ? Number(form.assignedCounsellorId)
            : null,
      };

      const response = await createLead(payload);

      if (!response?.success) {
        alert(
          response?.message || 'Failed to create lead'
        );
        return;
      }

      setForm(createEmptyForm());
      onCreated?.(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to create lead:', error);

      alert(
        error?.message ||
          'Error saving lead. Please check the entered information.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-lead-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="flex h-[min(100dvh,100%)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-100 bg-white shadow-2xl sm:h-auto sm:max-h-[min(85dvh,820px)] sm:rounded-3xl"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="min-w-0 pr-3">
            <h3
              id="add-lead-title"
              className="text-lg font-semibold text-slate-900 sm:text-xl"
            >
              Add New Lead
            </h3>

            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Add a new lead to the CRM
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close Add Lead popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full Name *">
                <input
                  required
                  type="text"
                  placeholder="Rahul Sharma"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField(
                      'fullName',
                      event.target.value
                    )
                  }
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="Email Address *">
                <input
                  required
                  type="email"
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      'email',
                      event.target.value
                    )
                  }
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="Phone Number">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="9876543210"
                  value={form.phone}
                  maxLength={10}
                  pattern="[0-9]*"
                  onChange={(event) =>
                    updateField(
                      'phone',
                      event.target.value
                    )
                  }
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="Country of Origin">
                <input
                  type="text"
                  placeholder="India"
                  value={form.country}
                  onChange={(event) =>
                    updateField(
                      'country',
                      event.target.value
                    )
                  }
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="Preferred Course">
                <input
                  type="text"
                  placeholder="MBA"
                  value={form.preferredCourse}
                  onChange={(event) =>
                    updateField(
                      'preferredCourse',
                      event.target.value
                    )
                  }
                  className={FIELD_CLASS}
                />
              </Field>

              <Field label="Preferred Country">
                <CountryDropdown
                  value={form.preferredCountryId}
                  placeholder="Select preferred country"
                  onChange={(country) =>
                    setForm((previous) => ({
                      ...previous,
                      preferredCountryId: country
                        ? String(country.id)
                        : '',
                      preferredCountry:
                        country?.name || '',
                    }))
                  }
                />
              </Field>

              <Field label="Lead Source">
                <select
                  value={form.sourceId}
                  onChange={(event) =>
                    updateField(
                      'sourceId',
                      event.target.value
                    )
                  }
                  className={FIELD_CLASS}
                >
                  <option value="">
                    Select source
                  </option>

                  {sources.map((source) => (
                    <option
                      key={source.id}
                      value={source.id}
                    >
                      {source.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Assigned Counsellor">
                <select
                  value={form.assignedCounsellorId}
                  onChange={(event) =>
                    updateField(
                      'assignedCounsellorId',
                      event.target.value
                    )
                  }
                  className={FIELD_CLASS}
                >
                  <option value="">
                    Select counsellor
                  </option>

                  {counsellors.map((counsellor) => (
                    <option
                      key={counsellor.id}
                      value={counsellor.id}
                    >
                      {counsellor.fullName}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lead Status">
                <select
                  value={form.rating}
                  onChange={(event) =>
                    updateField(
                      'rating',
                      event.target.value
                    )
                  }
                  className={FIELD_CLASS}
                >
                  {LEAD_RATING_OPTIONS.map(
                    (rating) => (
                      <option
                        key={rating}
                        value={rating}
                      >
                        {rating}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Counsellor Remarks">
                  <textarea
                    rows={3}
                    placeholder="Call after one week..."
                    value={form.remark}
                    onChange={(event) =>
                      updateField(
                        'remark',
                        event.target.value
                      )
                    }
                    className={`${FIELD_CLASS} resize-none`}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:py-2.5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0084ff] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0070d9] disabled:opacity-50 sm:py-2.5"
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {submitting
                ? 'Creating...'
                : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500">
      {label}
    </label>

    {children}
  </div>
);

export default AddLeadModal;