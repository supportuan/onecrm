/** Normalize FK ids for controlled <select> values (always strings). */
export const toSelectId = (value) => (value == null || value === '' ? '' : String(value));

export const toNumOrNull = (value) => (value === '' || value == null ? null : Number(value));

export const resolveStudyCascades = (industries, industryId, subIndustryId) => {
  const industryKey = toSelectId(industryId);
  const selectedIndustry = industries?.find((i) => String(i.id) === industryKey);
  const subIndustries = selectedIndustry?.subIndustries ?? [];
  const allStudyAreas = selectedIndustry?.studyAreas ?? [];
  const subKey = toSelectId(subIndustryId);
  const studyAreas =
    subKey && subIndustries.length
      ? allStudyAreas.filter((a) => !a.subIndustryId || String(a.subIndustryId) === subKey)
      : allStudyAreas;
  return { selectedIndustry, subIndustries, studyAreas };
};

export const studyIdsFromProfile = (profile) => ({
  industryId: toSelectId(profile?.industryId ?? profile?.industry?.id),
  subIndustryId: toSelectId(profile?.subIndustryId ?? profile?.subIndustry?.id),
  studyAreaId: toSelectId(profile?.studyAreaId ?? profile?.studyArea?.id),
  countryId: toSelectId(profile?.countryId ?? profile?.country?.id),
});
