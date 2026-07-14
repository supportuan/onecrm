'use client';

import { useEffect, useState } from 'react';
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
  const [photoUrl, setPhotoUrl] = useState(user?.profilePhotoUrl || null);
  const [imgFailed, setImgFailed] = useState(false);
  const sizeClass = size === 'lg' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-[11px]';
  const label = user?.fullName || user?.email || 'Profile';

  useEffect(() => {
    setPhotoUrl(user?.profilePhotoUrl || null);
    setImgFailed(false);
  }, [user?.profilePhotoUrl]);

  useEffect(() => {
    const onUpdated = (e) => {
      if (e?.detail?.photoUrl !== undefined) {
        setPhotoUrl(e.detail.photoUrl || null);
        setImgFailed(false);
      }
    };
    window.addEventListener(STAFF_PROFILE_PHOTO_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(STAFF_PROFILE_PHOTO_UPDATED_EVENT, onUpdated);
  }, []);

  const showPhoto = Boolean(photoUrl) && !imgFailed;

  return (
    <Link
      href="/profile"
      title="View profile"
      aria-label="View profile"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8eef7] font-semibold tracking-wide text-[#0b2a5b] transition hover:ring-2 hover:ring-brand/20 ${sizeClass} ${className}`}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span aria-hidden>{initials(user?.fullName, user?.email)}</span>
      )}
      <span className="sr-only">{label}</span>
    </Link>
  );
}