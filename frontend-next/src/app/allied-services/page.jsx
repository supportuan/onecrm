import {
  ArrowUpRight,
  Banknote,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  Code2,
  Compass,
  GraduationCap,
  Handshake,
  House,
  Landmark,
  Plane,
  Users,
} from 'lucide-react';

const services = [
  {
    title: 'ApplyUniNow',
    description:
      'Explore destinations and universities, manage applications, and receive end-to-end study-abroad support.',
    url: 'https://applyuninow.com',
    icon: GraduationCap,
  },
  {
    title: 'ApplyUniLoans',
    description:
      'Future-ready financing that makes education funding and study expenses simpler to plan.',
    url: 'https://applyuniloans.com',
    icon: Banknote,
  },
  {
    title: 'ApplyUniHomes',
    description:
      'Find student-friendly housing and simplify accommodation planning before arrival.',
    url: 'https://applyunihomes.com',
    icon: House,
  },
  {
    title: 'ApplyUniJobs',
    description:
      'Discover part-time opportunities, graduate roles, and support for long-term employability.',
    url: 'https://applyunijobs.com',
    icon: BriefcaseBusiness,
  },
  {
    title: 'AUN Tech Consulting',
    description:
      'Future-ready ERP, CRM, and digital transformation consulting—planned and delivered simply.',
    status: 'Coming soon',
    icon: Code2,
  },
  {
    title: 'AdminConnects',
    description:
      'Future-ready guidance connecting education administrators, partners, and operations.',
    url: 'https://adminconnects.com',
    icon: Handshake,
  },
  {
    title: 'UniFeatures',
    description:
      'Student resources, the latest opportunities, and smarter admissions information in one place.',
    url: 'https://unifeatures.com',
    icon: Landmark,
  },
  {
    title: 'InternationalStudentVisas',
    description:
      'Stay informed, organise documentation, and follow each step of the student visa journey.',
    url: 'https://internationalstudentvisas.com',
    icon: Plane,
  },
  {
    title: 'AustraliaSkills',
    description:
      'Connect your skills with global opportunities through Australian assessment and migration guidance.',
    url: 'https://australiaskills.com',
    icon: Compass,
  },
  {
    title: 'CanadaAdmits',
    description:
      'Connect students with Canadian universities and simplify admissions, documents, and study choices.',
    url: 'https://canadaadmits.com',
    icon: Building2,
  },
  {
    title: 'PikoPop',
    description:
      'A digital platform for university services, online engagement, and student recruitment support.',
    url: 'https://pikopop.com',
    icon: BookOpenText,
  },
  {
    title: 'DeFaComCon',
    description:
      'Build meaningful connections between students, institutions, and destination communities.',
    url: 'https://defacomcon.com',
    icon: Users,
  },
];

export default function AlliedServices() {
  return (
    <div className="relative overflow-hidden rounded-2xl text-[var(--ui-text)]">
      <div
        aria-hidden="true"
        className="app-ambient-accent pointer-events-none absolute inset-0"
      />

      <div className="relative z-10 mx-auto max-w-7xl pt-4">
        <div className="mb-5 flex justify-center">
          <h2 className="app-title-gradient text-3xl font-semibold tracking-tight sm:text-4xl">
            One Platform, Multiple Services
          </h2>
        </div>
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            const card = (
              <>
                <div className="relative flex w-full items-center justify-center">
                  <div className="app-gradient-icon">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  {service.status ? (
                    <span className="absolute right-0 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand">
                      {service.status}
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

            return service.url ? (
              <a
                key={service.title}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="app-glass-card group flex flex-col items-center rounded-2xl p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-brand/30"
              >
                {card}
              </a>
            ) : (
              <div
                key={service.title}
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
