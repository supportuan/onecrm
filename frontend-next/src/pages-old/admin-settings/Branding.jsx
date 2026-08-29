'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { useOrgBranding } from '@/lib/branding/BrandingContext';
import {
  ALLIED_HEADING_DEFAULT,
  ALLIED_ICON_OPTIONS,
  ALLIED_SERVICE_ICONS,
  DEFAULT_ALLIED_SERVICES,
} from '@/lib/allied-services';
import {
  deleteLoginBackground,
  deleteOrgLogo,
  getOrgSettings,
  updateOrgSettings,
  uploadLoginBackground,
  uploadOrgLogo,
} from '@/services/orgApi';

const fieldClass =
  'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-700 focus:ring-2 focus:ring-neutral-200';

const newService = () => ({
  id: `custom-${Date.now()}`,
  title: 'New service',
  description: 'Short description of this allied service.',
  url: '',
  icon: 'Sparkles',
  placeholder: true,
  enabled: true,
});

export default function Branding() {
  const { refresh } = useOrgBranding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [loginHeadline, setLoginHeadline] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [loginBackgroundUrl, setLoginBackgroundUrl] = useState(null);
  const [alliedHeading, setAlliedHeading] = useState(ALLIED_HEADING_DEFAULT);
  const [services, setServices] = useState(DEFAULT_ALLIED_SERVICES);

  const flash = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const applySettings = (data) => {
    if (!data) return;
    setName(data.name || '');
    setTagline(data.tagline || '');
    setLoginHeadline(data.loginHeadline || '');
    setLogoUrl(data.logoUrl || null);
    setHasCustomLogo(Boolean(data.hasCustomLogo));
    setLoginBackgroundUrl(data.loginBackgroundUrl || null);
    setAlliedHeading(data.alliedHeading || ALLIED_HEADING_DEFAULT);
    setServices(
      Array.isArray(data.alliedServices) && data.alliedServices.length
        ? data.alliedServices
        : DEFAULT_ALLIED_SERVICES,
    );
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getOrgSettings();
        if (!cancelled) applySettings(res?.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load appearance settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCount = useMemo(
    () => services.filter((item) => item.enabled).length,
    [services],
  );

  const updateService = (index, patch) => {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const moveService = (index, delta) => {
    setServices((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await updateOrgSettings({
        name,
        tagline,
        loginHeadline,
        alliedHeading,
        alliedServices: services,
      });
      applySettings(res?.data);
      await refresh?.();
      flash('Appearance settings saved.');
    } catch (err) {
      setError(err.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      setError('Please upload a JPG, PNG, WEBP, or GIF logo.');
      return;
    }
    setUploadingLogo(true);
    setError('');
    try {
      const res = await uploadOrgLogo(file);
      applySettings(res?.data);
      await refresh?.();
      flash('Logo updated. It now fills the login mark and in-app logo.');
    } catch (err) {
      setError(err.message || 'Could not upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    setError('');
    try {
      const res = await deleteOrgLogo();
      applySettings(res?.data);
      await refresh?.();
      flash('Custom logo removed.');
    } catch (err) {
      setError(err.message || 'Could not remove logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/\.mp4$/i.test(file.name) && file.type !== 'video/mp4') {
      setError('Please upload an MP4 file.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const res = await uploadLoginBackground(file);
      applySettings(res?.data);
      await refresh?.();
      flash('Login background video uploaded.');
    } catch (err) {
      setError(err.message || 'Could not upload video.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = async () => {
    setUploading(true);
    setError('');
    try {
      const res = await deleteLoginBackground();
      applySettings(res?.data);
      await refresh?.();
      flash('Login background video removed.');
    } catch (err) {
      setError(err.message || 'Could not remove video.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading appearance settings…
      </div>
    );
  }

  return (
    <div className="space-y-6 text-neutral-800">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-semibold text-brand">Login page</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Name, logo, tagline, and headline appear on sign-in and inside the app. Optionally replace the animated background with a looping MP4.
        </p>

        <div className="mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-950 ring-1 ring-neutral-200">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-500">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-800">Organization logo</p>
              <p className="mt-0.5 text-xs leading-5 text-neutral-500">
                Uploads a square image that fully fills the logo box on the login page and in the sidebar. Use JPG, PNG, WEBP, or GIF (max 8MB).
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingLogo ? 'Uploading…' : hasCustomLogo ? 'Replace logo' : 'Upload logo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={handleLogoUpload}
                  />
                </label>
                {hasCustomLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
              Organization name
            </span>
            <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
              Tagline
            </span>
            <input className={fieldClass} value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
              Login headline
            </span>
            <input
              className={fieldClass}
              value={loginHeadline}
              onChange={(e) => setLoginHeadline(e.target.value)}
              maxLength={120}
              placeholder="Your journey starts with a quick login"
            />
          </label>
        </div>

        <div className="mt-5 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Video className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-800">Background video</p>
              <p className="mt-0.5 text-xs leading-5 text-neutral-500">
                Upload an MP4 (max 80MB). It plays muted and looping behind the login form. Visitors who prefer reduced motion still see the color theme.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? 'Uploading…' : loginBackgroundUrl ? 'Replace MP4' : 'Upload MP4'}
                  <input
                    type="file"
                    accept="video/mp4,.mp4"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleVideoUpload}
                  />
                </label>
                {loginBackgroundUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove video
                  </button>
                )}
              </div>
            </div>
          </div>
          {loginBackgroundUrl && (
            <video
              className="mt-4 h-40 w-full rounded-lg object-cover ring-1 ring-neutral-200"
              src={loginBackgroundUrl}
              muted
              loop
              autoPlay
              playsInline
            />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-brand">Allied Services</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Every card on the Allied Services page can be edited. Turn a card into a placeholder, hide it, or add a new one.
            </p>
          </div>
          <p className="text-xs text-neutral-400">{visibleCount} visible on the page</p>
        </div>

        <label className="mt-4 block max-w-xl">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            Page heading
          </span>
          <input
            className={fieldClass}
            value={alliedHeading}
            onChange={(e) => setAlliedHeading(e.target.value)}
            maxLength={80}
          />
        </label>

        <div className="mt-4 space-y-3">
          {services.map((service, index) => {
            const Icon = ALLIED_SERVICE_ICONS[service.icon] || Sparkles;
            return (
              <article
                key={service.id}
                className={`rounded-lg border p-4 ${
                  service.enabled ? 'border-neutral-200 bg-white' : 'border-neutral-200 bg-neutral-50 opacity-70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <p className="text-sm font-semibold">{service.title || 'Untitled service'}</p>
                    {service.placeholder && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Placeholder
                      </span>
                    )}
                    {!service.enabled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                        <EyeOff className="h-3 w-3" /> Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveService(index, -1)}
                      disabled={index === 0}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveService(index, 1)}
                      disabled={index === services.length - 1}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setServices((prev) => prev.filter((_, i) => i !== index))}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                      aria-label="Remove service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-neutral-500">Title</span>
                    <input
                      className={fieldClass}
                      value={service.title}
                      onChange={(e) => updateService(index, { title: e.target.value })}
                      maxLength={80}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-neutral-500">Icon</span>
                    <select
                      className={fieldClass}
                      value={service.icon}
                      onChange={(e) => updateService(index, { icon: e.target.value })}
                    >
                      {ALLIED_ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[11px] font-medium text-neutral-500">Description</span>
                    <textarea
                      className={`${fieldClass} min-h-[70px] resize-y`}
                      value={service.description}
                      onChange={(e) => updateService(index, { description: e.target.value })}
                      maxLength={280}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[11px] font-medium text-neutral-500">
                      Link URL {service.placeholder ? '(ignored while this is a placeholder)' : ''}
                    </span>
                    <input
                      className={fieldClass}
                      value={service.url}
                      onChange={(e) => updateService(index, { url: e.target.value })}
                      placeholder="https://"
                      disabled={service.placeholder}
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={service.enabled}
                      onChange={(e) => updateService(index, { enabled: e.target.checked })}
                    />
                    Show on Allied Services page
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={service.placeholder}
                      onChange={(e) =>
                        updateService(index, {
                          placeholder: e.target.checked,
                        })
                      }
                    />
                    Keep as placeholder (Coming soon)
                  </label>
                </div>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setServices((prev) => [...prev, newService()])}
          disabled={services.length >= 24}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add service card
        </button>
      </section>
    </div>
  );
}
