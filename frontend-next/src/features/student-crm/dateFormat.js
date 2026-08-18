const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

export const parseDate = (value) => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isValidDate(value) ? value : null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    const date = new Date(value);
    return isValidDate(date) ? date : null;
  }
  if (typeof value === 'object') {
    if (value.value != null) return parseDate(value.value);
    return null;
  }
  const raw = String(value).trim();
  if (!raw || raw === 'Invalid Date' || raw === 'null' || raw === 'undefined') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`);
    return isValidDate(date) ? date : null;
  }
  const date = new Date(raw);
  return isValidDate(date) ? date : null;
};

/** YYYY-MM-DD for `<input type="date">`. Empty string when the value is not a real date. */
export const toDateInputValue = (value) => {
  if (typeof value === 'string') {
    const raw = value.trim();
    const isoDay = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDay && isoDay[1] !== '0000-00-00') return isoDay[1];
  }
  const date = parseDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (value) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString() : '--';
};

export const formatStamp = (value) => {
  const date = parseDate(value);
  if (!date) return '--';
  return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}; ${date.toLocaleDateString()}`;
};
