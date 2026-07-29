'use client';

import Link from 'next/link';
import { ArrowUpRight, Plug } from 'lucide-react';
import LinkedInIcon from '@/components/icons/LinkedInIcon';

const PLUGINS = [
  {
    id: 'linkedin',
    title: 'LinkedIn Plugin',
    description:
      'Connect LinkedIn to sync leads, enrich profiles, and launch campaigns from OneCRM.',
    path: '/connector/linkedin-plugin',
    icon: LinkedInIcon,
    accent: 'bg-[#0A66C2]',
    accentSoft: 'bg-[#E8F4FC] text-[#0A66C2]',
  },
];

export default function ConnectorHub() {
  return (
    <div className="ui-page-shell space-y-6">
      <div className="ui-panel p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Plug className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="ui-text-h2">Connector</h2>
            <p className="ui-text-body mt-1 max-w-2xl">
              Install and manage integrations that connect OneCRM with external platforms.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLUGINS.map((plugin) => {
          const Icon = plugin.icon;
          return (
            <Link
              key={plugin.id}
              href={plugin.path}
              className="ui-panel group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${plugin.accent}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${plugin.accentSoft}`}>
                  Plugin
                </span>
              </div>
              <h3 className="ui-text-h3 mt-4">{plugin.title}</h3>
              <p className="ui-text-body mt-2 flex-1">{plugin.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand group-hover:gap-2 transition-all">
                Open plugin
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
