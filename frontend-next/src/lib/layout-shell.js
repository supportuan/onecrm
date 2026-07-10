/** Shared shell dimensions for staff + student portals */
export const SIDEBAR_OPEN = 232;
export const SIDEBAR_COLLAPSED = 68;

export const STAFF_SIDEBAR_STORAGE_KEY = 'staffSidebarOpen_v2';
export const STUDENT_SIDEBAR_STORAGE_KEY = 'studentPortalSidebarOpen';

export const initials = (name, email) => {
  const source = (name || email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};
