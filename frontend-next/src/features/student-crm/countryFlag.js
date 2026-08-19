const COUNTRY_ISO = {
  afghanistan: 'af',
  australia: 'au',
  austria: 'at',
  belgium: 'be',
  canada: 'ca',
  china: 'cn',
  cyprus: 'cy',
  'czech republic': 'cz',
  czechia: 'cz',
  denmark: 'dk',
  dubai: 'ae',
  england: 'gb',
  finland: 'fi',
  france: 'fr',
  germany: 'de',
  'great britain': 'gb',
  'hong kong': 'hk',
  india: 'in',
  ireland: 'ie',
  italy: 'it',
  japan: 'jp',
  korea: 'kr',
  malaysia: 'my',
  malta: 'mt',
  netherlands: 'nl',
  'new zealand': 'nz',
  norway: 'no',
  poland: 'pl',
  portugal: 'pt',
  singapore: 'sg',
  'south korea': 'kr',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  uae: 'ae',
  uk: 'gb',
  'united arab emirates': 'ae',
  'united kingdom': 'gb',
  'united states': 'us',
  'united states of america': 'us',
  us: 'us',
  usa: 'us',
};

export const countryToIso = (name) => {
  if (!name) return '';
  const key = String(name).trim().toLowerCase();
  if (COUNTRY_ISO[key]) return COUNTRY_ISO[key];
  const compact = key.replace(/[^a-z]+/g, ' ').trim();
  return COUNTRY_ISO[compact] || '';
};

export const countryFlagUrl = (name) => {
  const iso = countryToIso(name);
  return iso ? `https://flagcdn.com/w40/${iso}.png` : '';
};
