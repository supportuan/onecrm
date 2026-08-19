/** Red ! for a required field that is empty; green check after it is submitted. */
export default function RequiredStatusIcon({ submitted = false, className = 'h-4 w-4', title }) {
  const label = title || (submitted ? 'Submitted' : 'Required');
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ${className}`}
      title={label}
      aria-label={label}
    >
      {submitted ? (
        <svg viewBox="0 0 16 16" className="block h-full w-full" aria-hidden="true">
          <circle cx="8" cy="8" r="8" fill="#fff" />
          <circle cx="8" cy="8" r="7" fill="#39D52D" />
          <path
            d="M4.4 8.2 6.75 10.6 11.6 5.4"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="block h-full w-full" aria-hidden="true">
          <circle cx="8" cy="8" r="8" fill="#fff" />
          <circle cx="8" cy="8" r="7" fill="#E53935" />
          <path d="M8 3.7v5.7" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
          <circle cx="8" cy="12" r="1.1" fill="#fff" />
        </svg>
      )}
    </span>
  );
}

export const isFilledValue = (value) => {
  if (value == null || value === false) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return value;
  return String(value).trim() !== '' && String(value).trim() !== 'Invalid Date';
};
