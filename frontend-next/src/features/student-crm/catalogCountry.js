/** @see Backend/src/modules/crm-settings/catalog-country.ts */
export const CATALOG_COUNTRY_ALIASES = {
  3: 23, // United States → United States Of America
};

export const resolveCatalogCountryId = (countryId) => {
  if (countryId == null || countryId === '') return '';
  const n = Number(countryId);
  if (!Number.isFinite(n)) return '';
  return String(CATALOG_COUNTRY_ALIASES[n] ?? n);
};

export const pickCatalogCountry = (countries, countryId) => {
  const catalogId = resolveCatalogCountryId(countryId);
  if (!catalogId) return null;
  return countries?.find((c) => String(c.id) === catalogId || String(c.catalogCountryId) === catalogId) ?? null;
};
