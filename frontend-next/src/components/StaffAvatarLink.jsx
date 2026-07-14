'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { initials } from '@/lib/layout-shell';

export const STAFF_PROFILE_PHOTO_UPDATED_EVENT = 'staff-profile-photo-updated';

export function notifyStaffProfilePhotoUpdated(photoUrl) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(STAFF_PROFILE_PHOTO_UPDATED_EVENT, { detail: { photoUrl } })
  );
}

/** Clickable avatar — photo when available, otherwise initials. Links to /profile. */
export default function StaffAvatarLink({ className = '', size = 'md' }) {
  const { user } = useAuth();
  const photoUrl = user?.profilePhotoUrl || null;
  const sizeClass = size === 'lg' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-[11px]';
  const label = user?.fullName || user?.email || 'Profile';

  return (
    <Link
      href="/profile"
      title="View profile"
      aria-label="View profile"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8eef7] font-semibold tracking-wide text-[#0b2a5b] transition hover:ring-2 hover:ring-brand/20 ${sizeClass} ${className}`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initials(user?.fullName, user?.email)}</span>
      )}
      <span className="sr-only">{label}</span>
    </Link>
  );
}
