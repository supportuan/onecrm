'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import authFetch from '@/lib/api';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export default function NewTenantPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    modules: ['HR', 'ADMIN'],
    admin: { fullName: '', email: '', password: '', phone: '' },
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch('/api/super-admin/catalog/modules')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCatalog(j.data);
      })
      .catch(() => null);
  }, []);

  const toggleModule = (key) =>
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(key)
        ? f.modules.filter((k) => k !== key)
        : [...f.modules, key],
    }));

  const onLogoPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
      const tenantId = json.data.tenant.id;
      if (logoFile) {
        const body = new FormData();
        body.append('file', logoFile);
        const logoRes = await authFetch(`/api/super-admin/tenants/${tenantId}/logo`, {
          method: 'POST',
          body,
        });
        const logoJson = await logoRes.json().catch(() => null);
        if (!logoRes.ok || !logoJson?.success) {
          throw new Error(logoJson?.message || 'Tenant created, but logo upload failed');
        }
      }
      router.push(`/super-admin/tenants/${tenantId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <button
        onClick={() => router.push('/super-admin')}
        className="text-sm text-neutral-500 hover:text-neutral-800 mb-4"
      >
        ← Back to tenants
      </button>
      <h1 className="text-2xl font-semibold text-brand">Onboard tenant</h1>
      <p className="text-sm text-neutral-500 mt-1 mb-6">
        Creates the tenant, enables selected modules, and provisions the initial admin account.
      </p>

      <form onSubmit={submit} className="space-y-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-medium text-brand">Organization</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v, slug: f.slug || slugify(v) }))}
              required
            />
            <Field
              label="Slug"
              value={form.slug}
              onChange={(v) => setForm((f) => ({ ...f, slug: slugify(v) }))}
              hint="lowercase, hyphens, used in URLs/keys"
              required
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-neutral-700 mb-2">Logo (optional)</span>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-brand">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  'Logo'
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {logoFile ? 'Change logo' : 'Choose logo'}
                  </button>
                  {logoFile && (
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="text-xs text-neutral-500 hover:text-neutral-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={onLogoPick}
                />
                <p className="text-xs text-neutral-500">JPG, PNG or WebP · max 5MB</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-medium text-brand">Modules</h2>
          <p className="text-xs text-neutral-500">
            Only enabled modules appear in the tenant's sidebar and pass through API guards.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {catalog.map((m) => (
              <label
                key={m.key}
                className="flex items-start gap-3 rounded-lg border border-neutral-200 px-4 py-3 hover:border-neutral-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.modules.includes(m.key)}
                  onChange={() => toggleModule(m.key)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand">{m.label}</span>
                    {m.beta && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        Beta
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">{m.key}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="font-medium text-brand">Primary admin user</h2>
          <p className="text-xs text-neutral-500">
            Hand these credentials to the client. They can manage their own users from Admin Settings.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Full name"
              value={form.admin.fullName}
              onChange={(v) => setForm((f) => ({ ...f, admin: { ...f.admin, fullName: v } }))}
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.admin.email}
              onChange={(v) => setForm((f) => ({ ...f, admin: { ...f.admin, email: v } }))}
              required
            />
            <Field
              label="Password"
              type="password"
              value={form.admin.password}
              onChange={(v) => setForm((f) => ({ ...f, admin: { ...f.admin, password: v } }))}
              hint="min 8 chars"
              required
            />
            <Field
              label="Phone (optional)"
              value={form.admin.phone}
              onChange={(v) => setForm((f) => ({ ...f, admin: { ...f.admin, phone: v } }))}
            />
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-700 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
      />
      {hint && <span className="block text-xs text-neutral-500 mt-1">{hint}</span>}
    </label>
  );
}
