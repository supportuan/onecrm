'use client';

import {
  ArrowUpRight,
} from 'lucide-react';
import { useTenantBrand } from '@/components/AppBrand';
import { ALLIED_HEADING_DEFAULT, ALLIED_SERVICE_ICONS, DEFAULT_ALLIED_SERVICES } from '@/lib/allied-services';

export default function AlliedServices() {
  const { alliedHeading, alliedServices } = useTenantBrand();
  const heading = alliedHeading || ALLIED_HEADING_DEFAULT;
  const services =
    Array.isArray(alliedServices) && alliedServices.length
      ? alliedServices
      : DEFAULT_ALLIED_SERVICES.filter((item) => item.enabled);

  return (
    <div className="relative overflow-hidden rounded-2xl text-[var(--ui-text)]">
      <div
        aria-hidden="true"
        className="app-ambient-accent pointer-events-none absolute inset-0"
      />

      <div className="relative z-10 mx-auto max-w-7xl pt-4">
        <div className="mb-5 flex justify-center">
          <h2 className="app-title-gradient text-3xl font-semibold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        </div>
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = ALLIED_SERVICE_ICONS[service.icon] || ALLIED_SERVICE_ICONS.GraduationCap;
            const isPlaceholder = Boolean(service.placeholder) || !service.url;
            const card = (
              <>
                <div className="relative flex w-full items-center justify-center">
                  <div className="app-gradient-icon">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  {isPlaceholder ? (
                    <span className="absolute right-0 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand">
                      Coming soon
                    </span>
                  ) : (
                    <ArrowUpRight className="absolute right-0 h-4 w-4 text-[var(--ui-text-muted)] transition group-hover:text-brand" />
                  )}
                </div>
                <h2 className="app-title-gradient mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
                  {service.title}
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-[var(--ui-text-secondary)]">
                  {service.description}
                </p>
              </>
            );

            return !isPlaceholder && service.url ? (
              <a
                key={service.id || service.title}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="app-glass-card group flex flex-col items-center rounded-2xl p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-brand/30"
              >
                {card}
              </a>
            ) : (
              <div
                key={service.id || service.title}
                className="app-glass-card group flex flex-col items-center rounded-2xl p-4 text-center"
              >
                {card}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
