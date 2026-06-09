/** First letter uppercase, rest lowercase. Preserves common acronyms. */
export function sentenceCase(value) {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const s = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return s
    .replace(/\bhr\b/g, 'HR')
    .replace(/\bkpi\b/g, 'KPI')
    .replace(/\bid\b/g, 'ID');
}
