'use client';

import { Construction } from 'lucide-react';

/**
 * Placeholder screen for modules that are registered in nav but not built yet.
 */
export default function BlankModulePage({
  title,
  description = 'This module is under construction. Content will appear here soon.',
}) {
  return (
    <div className="ui-page-shell">
      <div className="ui-panel flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Construction className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h2 className="ui-text-h2">{title}</h2>
        <p className="ui-text-body mt-2 max-w-md">{description}</p>
      </div>
    </div>
  );
}
