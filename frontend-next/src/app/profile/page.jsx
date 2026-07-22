'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, KeyRound, Loader2, Mail, Phone, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { uploadProfilePhoto } from '@/lib/apiService';
import { initials } from '@/lib/layout-shell';
import { notifyStaffProfilePhotoUpdated } from '@/components/StaffAvatarLink';
import { useAppearanceStore } from '@/lib/stores/appearanceStore';
import LogoLoader from '@/components/LogoLoader';

const panelClass =
  'w-full rounded-2xl border border-[var(--ui-border)] bg-white/90 p-6 shadow-[var(--ui-glass-shadow)] backdrop-blur-sm';

export default function StaffProfilePage() {
  const { user, updateUser, syncProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    syncProfile?.();
  }, [syncProfile]);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <LogoLoader label="Loading profile…" size="md" />
      </div>
    );
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const res = await uploadProfilePhoto(file);
      const next = res?.data || null;
      if (next) {
        updateUser?.(next);
        notifyStaffProfilePhotoUpdated(next.profilePhotoUrl || null);
      }
    } catch (err) {
      setUploadError(err?.message || 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">Account</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-brand">Your profile</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Upload a photo for the top bar. Role and permissions are managed by your administrator.
        </p>
      </div>

      <section className={panelClass}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xl font-semibold text-brand">
              {user.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profilePhotoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                className="h-full w-full items-center justify-center"
                style={{ display: user.profilePhotoUrl ? 'none' : 'flex' }}
                aria-hidden
              >
                {initials(user.fullName, user.email)}
              </span>
            </div>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white bg-brand text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-60"
              aria-label={user.profilePhotoUrl ? 'Replace profile photo' : 'Upload profile photo'}
              title={user.profilePhotoUrl ? 'Replace photo' : 'Upload photo'}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-lg font-semibold tracking-tight text-brand">{user.fullName}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-xs text-slate-400">JPG, PNG or WebP · max 5MB</p>
            {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--ui-border)] bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand/30 hover:bg-brand-soft"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" />
                {user.profilePhotoUrl ? 'Replace photo' : 'Upload photo'}
              </>
            )}
          </button>
        </div>
      </section>

      <section className={`${panelClass} space-y-4`}>
        <h3 className="border-b border-[var(--ui-border)] pb-3 text-[15px] font-semibold tracking-tight text-brand">
          Account details
        </h3>
        <Row icon={Mail} label="Email" value={user.email} />
        <Row icon={Phone} label="Phone" value={user.phone} />
        <Row
          icon={Shield}
          label="Role"
          value={user.roleLabel || user.permissionRole || user.role || '—'}
        />
        <div className="pt-2">
          <Link
            href="/change-password"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--ui-border)] bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-brand/30 hover:bg-brand-soft"
          >
            <KeyRound className="h-3.5 w-3.5" /> Change password
          </Link>
        </div>
      </section>

      <AppearanceSection />
    </div>
  );
}

function AppearanceSection() {
  const { loginThemeId, themes, setLoginThemeId } = useAppearanceStore();

  return (
    <section className={`${panelClass} space-y-4`}>
      <div className="border-b border-[var(--ui-border)] pb-3">
        <h3 className="text-[15px] font-semibold tracking-tight text-brand">Appearance</h3>
        <p className="mt-1 text-sm text-slate-500">
          Choose Brand, Aurora, or Mist. Colors update across the app right away, and on the login screen.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {themes.map((theme) => {
          const active = loginThemeId === theme.id;
          const blurb =
            theme.id === 'brand'
              ? 'Royal blue + crimson (logo)'
              : theme.id === 'aurora'
                ? 'Blue → purple app accents'
                : 'Teal palette (#008081)';
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setLoginThemeId(theme.id)}
              aria-pressed={active}
              className={`flex flex-1 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                active
                  ? 'border-brand bg-brand-soft ring-2 ring-brand/20'
                  : 'border-[var(--ui-border)] bg-white hover:border-brand/30 hover:bg-brand-soft/40'
              }`}
            >
              <span
                className="h-10 w-10 shrink-0 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
                style={{ backgroundImage: theme.swatch }}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-brand">{theme.label}</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">{blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="inline-flex items-center gap-1.5 text-neutral-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="break-all text-right font-medium text-brand">{value || '—'}</span>
    </div>
  );
}
