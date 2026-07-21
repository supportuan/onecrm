'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyStudent } from '@/services/studentCrmApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { initials } from '@/lib/layout-shell';

export const PROFILE_PHOTO_UPDATED_EVENT = 'student-profile-photo-updated';

export function notifyProfilePhotoUpdated(photoUrl) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROFILE_PHOTO_UPDATED_EVENT, { detail: { photoUrl } }));
}

/**
 * Avatar that shows the student profile photo when available, otherwise initials.
 * Clicking navigates to the profile page.
 */
export default function StudentAvatarLink({ className = '', size = 'md' }) {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMyStudent();
      setPhotoUrl(res?.data?.profilePhotoUrl || null);
      setImgFailed(false);
    } catch {
      setPhotoUrl(null);
      setImgFailed(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onUpdated = (e) => {
      if (e?.detail?.photoUrl !== undefined) {
        setPhotoUrl(e.detail.photoUrl || null);
        setImgFailed(false);
      } else {
        load();
      }
    };
    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, onUpdated);
  }, [load]);

  const sizeClass = size === 'lg' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-[11px]';
  const label = user?.fullName || user?.email || 'Profile';
  const showPhoto = Boolean(photoUrl) && !imgFailed;

  return (
    <Link
      href="/applicant/profile/view"
      title="View profile"
      aria-label="View profile"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold tracking-wide text-brand transition hover:ring-2 hover:ring-brand/20 ${sizeClass} ${className}`}
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