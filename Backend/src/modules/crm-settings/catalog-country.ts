/**
 * Maps seed / legacy country rows to the catalog country that holds imported courses.
 * United States (seed id 3) has no courses; United States Of America (id 23) has ~154k.
 */
export const CATALOG_COUNTRY_ALIASES: Record<number, number> = {
  3: 23,
};

export const resolveCatalogCountryId = (countryId?: number | null): number | undefined => {
  if (countryId == null) return undefined;
  const n = Number(countryId);
  if (!Number.isFinite(n)) return undefined;
  return CATALOG_COUNTRY_ALIASES[n] ?? n;
};
