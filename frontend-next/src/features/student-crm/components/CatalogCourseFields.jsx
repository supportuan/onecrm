'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAllCoursesForUniversity,
  fetchAllUniversitiesForCountry,
} from '@/services/crmSettingsApi';

const Field = ({ label, children }) => (
  <div>
    <label className="ui-label">{label}</label>
    {children}
  </div>
);

const str = (v) => (v == null || v === '' ? '' : String(v));

/**
 * Country → university → course cascade backed by CRM catalog tables.
 * Loads all courses for the selected university (paginated server-side).
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
  const [courseSearch, setCourseSearch] = useState('');

  const countryId = hideCountry
    ? str(countryIdProp || safeValue.countryId)
    : str(safeValue.countryId);
  const universityId = str(safeValue.universityId);
  const universityName = str(safeValue.university);
  const courseId = str(safeValue.courseId);
  const courseName = str(safeValue.course);
  const countryName = str(safeValue.country);

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
      setCourseSearch('');
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

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    let list = courses;
    if (q) {
      list = courses.filter((c) => c.name?.toLowerCase().includes(q));
    } else if (courses.length > 100) {
      list = courses.slice(0, 100);
    }
    return list.slice(0, 200);
  }, [courses, courseSearch]);

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === courseId),
    [courses, courseId]
  );

  const courseOptions = useMemo(() => {
    if (!selectedCourse) return filteredCourses;
    if (filteredCourses.some((c) => String(c.id) === String(selectedCourse.id))) return filteredCourses;
    return [selectedCourse, ...filteredCourses];
  }, [filteredCourses, selectedCourse]);

  const needsSearchHint = courses.length > 100 && !courseSearch.trim();

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
    setCourseSearch('');
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
    setCourseSearch('');
  };

  const onCourseChange = (id) => {
    const course = courseOptions.find((c) => String(c.id) === String(id));
    patch({
      courseId: id,
      course: course?.name || '',
    });
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

      <Field label={`Course *${courses.length ? ` — ${courses.length.toLocaleString()} in catalog` : ''}`}>
        {loadingCourses ? (
          <select disabled value="" className={`${inputClass} ui-select`}>
            <option value="">Loading courses from database…</option>
          </select>
        ) : courses.length ? (
          <div className="space-y-2">
            <input
              type="search"
              disabled={disabled}
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder={courses.length > 100 ? 'Search courses (type to narrow down)…' : 'Search courses…'}
              className={inputClass}
            />
            {needsSearchHint && (
              <p className="text-xs text-neutral-500">
                Showing first 100 courses — search to find a specific program.
              </p>
            )}
            <select
              required
              disabled={disabled}
              value={courseId}
              onChange={(e) => onCourseChange(e.target.value)}
              className={`${inputClass} ui-select`}
            >
              <option value="">
                {courseOptions.length
                  ? `Select course (${courseOptions.length.toLocaleString()} shown)`
                  : courseSearch.trim()
                    ? 'No courses match search'
                    : 'Select course'}
              </option>
              {courseOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                  {c.level ? ` · ${c.level}` : ''}
                  {c.duration ? ` · ${c.duration}` : ''}
                </option>
              ))}
            </select>
            {courseId && courseName && (
              <p className="text-xs text-neutral-600">
                Selected: <span className="font-medium text-neutral-800">{courseName}</span>
              </p>
            )}
          </div>
        ) : (
          <input
            required
            disabled={disabled}
            value={courseName}
            onChange={(e) => patch({ course: e.target.value, courseId: '' })}
            className={inputClass}
            placeholder={universityId ? 'No courses in database — type manually' : 'Select university first'}
          />
        )}
      </Field>
    </div>
  );
}
