'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Users,
  Megaphone,
} from 'lucide-react';
import LinkedInIcon from '@/components/icons/LinkedInIcon';

const STORAGE_KEY = 'onecrm.connector.linkedin';

const DEFAULT_SETTINGS = {
  connected: false,
  accountName: '',
  syncLeads: true,
  syncCampaigns: false,
  enrichProfiles: true,
};

export default function LinkedInPlugin() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const handleConnect = () => {
    persist({
      ...settings,
      connected: true,
      accountName: 'OneCRM LinkedIn Workspace',
    });
    setSaved(false);
  };

  const handleDisconnect = () => {
    persist({ ...DEFAULT_SETTINGS });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    persist(settings);
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="ui-page-shell space-y-6">
      <Link
        href="/connector"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Connector
      </Link>

      <div className="ui-panel overflow-hidden">
        <div className="border-b border-slate-100 bg-[#0A66C2] px-6 py-5 text-white">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <LinkedInIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">LinkedIn Plugin</h2>
              <p className="mt-1 text-sm text-white/85">
                Sync leads and campaigns with your LinkedIn workspace.
              </p>
            </div>
            <span
              className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${
                settings.connected
                  ? 'bg-emerald-400/20 text-emerald-50 ring-1 ring-emerald-200/40'
                  : 'bg-white/15 text-white/90 ring-1 ring-white/20'
              }`}
            >
              {settings.connected ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800">Account connection</h3>
              <p className="mt-1 text-sm text-slate-500">
                Authorize OneCRM to access LinkedIn lead and campaign data.
              </p>

              {settings.connected ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    <CheckCircle2 className="h-4 w-4" />
                    {settings.accountName}
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004182]"
                >
                  <LinkedInIcon className="h-4 w-4" />
                  Connect LinkedIn
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800">Sync settings</h3>
              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={settings.syncLeads}
                    onChange={(e) => {
                      persist({ ...settings, syncLeads: e.target.checked });
                      setSaved(false);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Users className="h-4 w-4 text-[#0A66C2]" />
                      Lead sync
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Import LinkedIn form leads into Opportunity Tracking.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={settings.enrichProfiles}
                    onChange={(e) => {
                      persist({ ...settings, enrichProfiles: e.target.checked });
                      setSaved(false);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <RefreshCw className="h-4 w-4 text-[#0A66C2]" />
                      Profile enrichment
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Attach LinkedIn profile details to matched CRM leads.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={settings.syncCampaigns}
                    onChange={(e) => {
                      persist({ ...settings, syncCampaigns: e.target.checked });
                      setSaved(false);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Megaphone className="h-4 w-4 text-[#0A66C2]" />
                      Campaign integration
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Push OneCRM audiences to LinkedIn Campaign Manager.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save settings'}
                </button>
                {saved && (
                  <span className="text-sm font-semibold text-emerald-600">Settings saved</span>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-800">What this plugin does</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• Pull LinkedIn lead-gen form submissions into OneCRM</li>
                <li>• Match prospects with existing marketing records</li>
                <li>• Launch LinkedIn campaigns from Campaign Mission</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Secure connection
              </div>
              <p className="mt-2 text-sm text-slate-500">
                OAuth credentials are stored securely. Only authorized staff can manage this plugin.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
