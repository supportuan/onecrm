'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAllCoursesForUniversity,
  fetchAllUniversitiesForCountry,
  findOrCreateCourse,
} from '@/services/crmSettingsApi';

const Field = ({ label, children }) => (
  <div>
    <label className="ui-label">{label}</label>
    {children}
  </div>
);

const str = (v) => (v == null || v === '' ? '' : String(v));

/**
 * Country → university → course cascade.
 * Course field shows catalog suggestions but always allows typing a new name
 * and persists it to the Course table via find-or-create.
 */
export default function CatalogCourseFields({
  countries = [],
  value,
  onChange,
  inputClass = 'ui-field',
  disabled = false,
  hideCountry = false,
  countryId: countryIdProp,
}) {
  const safeValue = value ?? {};
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingUnis, setLoadingUnis] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseQuery, setCourseQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimer = useRef(null);

  const countryId = hideCountry
    ? str(countryIdProp || safeValue.countryId)
    : str(safeValue.countryId);
  const universityId = str(safeValue.universityId);
  const universityName = str(safeValue.university);
  const courseId = str(safeValue.courseId);
  const courseName = str(safeValue.course);
  const countryName = str(safeValue.country);

  useEffect(() => {
    setCourseQuery(courseName);
  }, [courseName, universityId]);

  useEffect(() => {
    if (!countryId) {
      setUniversities([]);
      return;
    }
    let cancelled = false;
    setLoadingUnis(true);
    fetchAllUniversitiesForCountry(Number(countryId))
      .then((items) => {
        if (!cancelled) setUniversities(items);
      })
      .catch(() => {
        if (!cancelled) setUniversities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUnis(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryId]);

  useEffect(() => {
    if (!universityId) {
      setCourses([]);
      return;
    }
    let cancelled = false;
    setLoadingCourses(true);
    fetchAllCoursesForUniversity(Number(universityId))
      .then((items) => {
        if (!cancelled) setCourses(items);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCourses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universityId]);

  const suggestions = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    let list = courses;
    if (q) {
      list = courses.filter((c) => c.name?.toLowerCase().includes(q));
    }
    return list.slice(0, 50);
  }, [courses, courseQuery]);

  const exactMatch = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return null;
    return courses.find((c) => c.name?.toLowerCase() === q) || null;
  }, [courses, courseQuery]);

  const patch = useCallback((next) => onChange(next), [onChange]);

  const onCountryChange = (id) => {
    const country = countries.find((c) => String(c.id) === String(id));
    patch({
      countryId: id,
      country: country?.name || '',
      universityId: '',
      university: '',
      courseId: '',
      course: '',
    });
    setCourseQuery('');
    setShowSuggestions(false);
  };

  const onUniversityChange = (id) => {
    const uni = universities.find((u) => String(u.id) === String(id));
    patch({
      universityId: id,
      university: uni?.name || '',
      countryId: uni?.countryId ? String(uni.countryId) : countryId,
      country: uni?.country?.name || countryName,
      courseId: '',
      course: '',
    });
    setCourseQuery('');
    setShowSuggestions(false);
  };

  const selectExistingCourse = (course) => {
    patch({
      courseId: String(course.id),
      course: course.name || '',
    });
    setCourseQuery(course.name || '');
    setShowSuggestions(false);
  };

  const commitCourseName = async (rawName) => {
    const name = (rawName ?? courseQuery).trim();
    if (!name) {
      patch({ courseId: '', course: '' });
      return;
    }

    const existing =
      courses.find((c) => c.name?.toLowerCase() === name.toLowerCase()) ||
      (courseId && courses.find((c) => String(c.id) === courseId));

    if (existing && existing.name?.toLowerCase() === name.toLowerCase()) {
      patch({ courseId: String(existing.id), course: existing.name });
      setCourseQuery(existing.name);
      return;
    }

    // Keep the typed name even before DB save succeeds
    patch({ courseId: '', course: name });
    setCourseQuery(name);

    if (!universityId) return;

    setSavingCourse(true);
    try {
      const res = await findOrCreateCourse({
        universityId: Number(universityId),
        name,
      });
      const course = res?.data || res;
      if (course?.id) {
        setCourses((prev) => {
          if (prev.some((c) => String(c.id) === String(course.id))) return prev;
          return [...prev, course].sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''))
          );
        });
        patch({ courseId: String(course.id), course: course.name || name });
        setCourseQuery(course.name || name);
      }
    } catch {
      // Application can still save with free-text course name
      patch({ courseId: '', course: name });
    } finally {
      setSavingCourse(false);
    }
  };

  return (
    <div className="space-y-4">
      {!hideCountry && (
        <Field label="Country *">
          {countries.length ? (
            <select
              required
              disabled={disabled}
              value={countryId}
              onChange={(e) => onCountryChange(e.target.value)}
              className={`${inputClass} ui-select`}
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              disabled={disabled}
              value={countryName}
              onChange={(e) => patch({ country: e.target.value })}
              className={inputClass}
              placeholder="Loading countries…"
            />
          )}
        </Field>
      )}

      <Field label="University *">
        {loadingUnis ? (
          <select disabled value="" className={`${inputClass} ui-select`}>
            <option value="">Loading universities…</option>
          </select>
        ) : universities.length ? (
          <select
            required
            disabled={disabled || !countryId}
            value={universityId}
            onChange={(e) => onUniversityChange(e.target.value)}
            className={`${inputClass} ui-select`}
          >
            <option value="">{countryId ? 'Select university' : 'Select country first'}</option>
            {universities.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name}
                {u.city ? ` · ${u.city}` : ''}
                {u.courseCount != null ? ` (${u.courseCount} courses)` : ''}
              </option>
            ))}
          </select>
        ) : (
          <input
            required
            disabled={disabled}
            value={universityName}
            onChange={(e) => patch({ university: e.target.value, universityId: '' })}
            className={inputClass}
            placeholder={countryId ? 'No universities for this country' : 'Select country first'}
          />
        )}
      </Field>

      <Field
        label={`Course *${courses.length ? ` — ${courses.length.toLocaleString()} suggestions` : ''}`}
      >
        {loadingCourses ? (
          <input disabled value="" className={inputClass} placeholder="Loading courses…" />
        ) : (
          <div className="relative space-y-2">
            <input
              required
              disabled={disabled || !universityId}
              value={courseQuery}
              onChange={(e) => {
                const next = e.target.value;
                setCourseQuery(next);
                patch({ course: next, courseId: '' });
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                blurTimer.current = setTimeout(() => {
                  setShowSuggestions(false);
                  commitCourseName(courseQuery);
                }, 150);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setShowSuggestions(false);
                  commitCourseName(courseQuery);
                }
              }}
              className={inputClass}
              placeholder={
                universityId
                  ? 'Type to search or enter a new course name'
                  : 'Select university first'
              }
              autoComplete="off"
            />

            {showSuggestions && universityId && (suggestions.length > 0 || courseQuery.trim()) && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {suggestions.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-brand hover:bg-brand-soft"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectExistingCourse(c)}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                      {(c.level || c.duration) && (
                        <span className="shrink-0 text-xs text-brand-muted">
                          {[c.level, c.duration].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </button>
                  </li>
                ))}

                {courseQuery.trim() && !exactMatch && (
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-brand-accent hover:bg-brand-soft"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => commitCourseName(courseQuery)}
                    >
                      Use new course: “{courseQuery.trim()}”
                    </button>
                  </li>
                )}

                {courseQuery.trim() && suggestions.length === 0 && exactMatch && (
                  <li className="px-3 py-2 text-xs text-brand-muted">Exact catalog match available above</li>
                )}
              </ul>
            )}

            <p className="text-xs text-brand-muted">
              {savingCourse
                ? 'Saving course to catalog…'
                : courseId
                  ? `Linked to catalog (#${courseId})`
                  : courseQuery.trim()
                    ? 'New course names are saved to the catalog for this university'
                    : courses.length
                      ? 'Pick a suggestion or type a new course name'
                      : 'No catalog courses yet — type a course name to add it'}
            </p>
          </div>
        )}
      </Field>
    </div>
  );
}
