'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAllCoursesForUniversity,
  fetchAllUniversitiesForCountry,
  findOrCreateCourse,
  findOrCreateUniversity,
} from '@/services/crmSettingsApi';

const Field = ({ label, children }) => (
  <div>
    <label className="ui-label">{label}</label>
    {children}
  </div>
);

const str = (v) => (v == null || v === '' ? '' : String(v));

/**
 * Country → university → course.
 * University and course show catalog suggestions but always allow typing a new name
 * (persisted via find-or-create). These are form fields, not catalog filters.
 */
export default function CatalogCourseFields({
  countries = [],
  value,
  onChange,
  inputClass = 'ui-field',
  disabled = false,
  hideCountry = false,
  countryId: countryIdProp,
  layout = 'stack',
  compact = false,
  countryLabel = 'Country *',
  universityLabel = 'University *',
  courseLabel = 'Course *',
}) {
  const safeValue = value ?? {};
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingUnis, setLoadingUnis] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [savingUniversity, setSavingUniversity] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [universityQuery, setUniversityQuery] = useState('');
  const [courseQuery, setCourseQuery] = useState('');
  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const uniBlurTimer = useRef(null);
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
    setUniversityQuery(universityName);
  }, [universityName, countryId]);

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

  const uniSuggestions = useMemo(() => {
    const q = universityQuery.trim().toLowerCase();
    let list = universities;
    if (q) {
      list = universities.filter((u) => u.name?.toLowerCase().includes(q));
    }
    return list.slice(0, 50);
  }, [universities, universityQuery]);

  const exactUniMatch = useMemo(() => {
    const q = universityQuery.trim().toLowerCase();
    if (!q) return null;
    return universities.find((u) => u.name?.toLowerCase() === q) || null;
  }, [universities, universityQuery]);

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
    setUniversityQuery('');
    setCourseQuery('');
    setShowUniSuggestions(false);
    setShowSuggestions(false);
  };

  const selectExistingUniversity = (uni) => {
    patch({
      universityId: String(uni.id),
      university: uni.name || '',
      countryId: uni?.countryId ? String(uni.countryId) : countryId,
      country: uni?.country?.name || countryName,
      courseId: '',
      course: '',
    });
    setUniversityQuery(uni.name || '');
    setCourseQuery('');
    setShowUniSuggestions(false);
    setShowSuggestions(false);
  };

  const commitUniversityName = async (rawName) => {
    const name = (rawName ?? universityQuery).trim();
    if (!name) {
      patch({ universityId: '', university: '', courseId: '', course: '' });
      setCourseQuery('');
      return;
    }

    const existing =
      universities.find((u) => u.name?.toLowerCase() === name.toLowerCase()) ||
      (universityId && universities.find((u) => String(u.id) === universityId));

    if (existing && existing.name?.toLowerCase() === name.toLowerCase()) {
      selectExistingUniversity(existing);
      return;
    }

    patch({ universityId: '', university: name, courseId: '', course: '' });
    setUniversityQuery(name);
    setCourseQuery('');

    if (!countryId) return;

    setSavingUniversity(true);
    try {
      const res = await findOrCreateUniversity({
        countryId: Number(countryId),
        name,
      });
      const uni = res?.data || res;
      if (uni?.id) {
        setUniversities((prev) => {
          if (prev.some((u) => String(u.id) === String(uni.id))) return prev;
          return [...prev, uni].sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''))
          );
        });
        patch({
          universityId: String(uni.id),
          university: uni.name || name,
          courseId: '',
          course: '',
        });
        setUniversityQuery(uni.name || name);
      }
    } catch {
      patch({ universityId: '', university: name, courseId: '', course: '' });
    } finally {
      setSavingUniversity(false);
    }
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
      patch({ courseId: '', course: name });
    } finally {
      setSavingCourse(false);
    }
  };

  return (
    <div className={layout === 'columns' ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'space-y-4'}>
      {!hideCountry && (
        <Field label={countryLabel}>
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

      <Field label={universityLabel}>
        {loadingUnis ? (
          <input disabled value="" className={inputClass} placeholder="Loading universities…" />
        ) : (
          <div className="relative space-y-2">
            <input
              required
              disabled={disabled || !countryId}
              value={universityQuery}
              onChange={(e) => {
                const next = e.target.value;
                setUniversityQuery(next);
                patch({ university: next, universityId: '', courseId: '', course: '' });
                setCourseQuery('');
                setShowUniSuggestions(true);
              }}
              onFocus={() => setShowUniSuggestions(true)}
              onBlur={() => {
                if (uniBlurTimer.current) clearTimeout(uniBlurTimer.current);
                uniBlurTimer.current = setTimeout(() => {
                  setShowUniSuggestions(false);
                  commitUniversityName(universityQuery);
                }, 150);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setShowUniSuggestions(false);
                  commitUniversityName(universityQuery);
                }
              }}
              className={inputClass}
              placeholder={
                countryId
                  ? 'Type to search or enter a new university'
                  : 'Select country first'
              }
              autoComplete="off"
            />

            {showUniSuggestions && countryId && (uniSuggestions.length > 0 || universityQuery.trim()) && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {uniSuggestions.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-brand hover:bg-brand-soft"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectExistingUniversity(u)}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{u.name}</span>
                      {u.city && (
                        <span className="shrink-0 text-xs text-brand-muted">{u.city}</span>
                      )}
                    </button>
                  </li>
                ))}

                {universityQuery.trim() && !exactUniMatch && (
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-brand-accent hover:bg-brand-soft"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => commitUniversityName(universityQuery)}
                    >
                      Use new university: “{universityQuery.trim()}”
                    </button>
                  </li>
                )}
              </ul>
            )}

            {!compact && (
              <p className="text-xs text-brand-muted">
                {savingUniversity
                  ? 'Saving university…'
                  : universityId
                    ? `Linked to catalog (#${universityId})`
                    : universityQuery.trim()
                      ? 'New university names are saved for this country'
                      : 'Pick a suggestion or type a new university name'}
              </p>
            )}
          </div>
        )}
      </Field>

      <Field label={courseLabel}>
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
                  : 'Select or enter university first'
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
              </ul>
            )}

            {!compact && (
              <p className="text-xs text-brand-muted">
                {savingCourse
                  ? 'Saving course to catalog…'
                  : courseId
                    ? `Linked to catalog (#${courseId})`
                    : courseQuery.trim()
                      ? 'New course names are saved for this university'
                      : 'Pick a suggestion or type a new course name'}
              </p>
            )}
          </div>
        )}
      </Field>
    </div>
  );
}
