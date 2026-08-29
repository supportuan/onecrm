export const ALLIED_HEADING_DEFAULT = 'One Platform, Multiple Services';

export const ALLIED_ICON_IDS = [
  'GraduationCap',
  'Banknote',
  'House',
  'BriefcaseBusiness',
  'Code2',
  'Handshake',
  'Landmark',
  'Plane',
  'Compass',
  'Building2',
  'BookOpenText',
  'Users',
  'Sparkles',
  'Globe',
] as const;

export type AlliedIconId = (typeof ALLIED_ICON_IDS)[number];

export type AlliedServiceItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: AlliedIconId;
  placeholder: boolean;
  enabled: boolean;
};

export type AlliedServicesConfig = {
  heading: string;
  items: AlliedServiceItem[];
};

export const DEFAULT_ALLIED_SERVICES: AlliedServiceItem[] = [
  {
    id: 'applyuninow',
    title: 'ApplyUniNow',
    description:
      'Explore destinations and universities, manage applications, and receive end-to-end study-abroad support.',
    url: 'https://applyuninow.com',
    icon: 'GraduationCap',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'applyuniloans',
    title: 'ApplyUniLoans',
    description: 'Future-ready financing that makes education funding and study expenses simpler to plan.',
    url: 'https://applyuniloans.com',
    icon: 'Banknote',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'applyunihomes',
    title: 'ApplyUniHomes',
    description: 'Find student-friendly housing and simplify accommodation planning before arrival.',
    url: 'https://applyunihomes.com',
    icon: 'House',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'applyunijobs',
    title: 'ApplyUniJobs',
    description: 'Discover part-time opportunities, graduate roles, and support for long-term employability.',
    url: 'https://applyunijobs.com',
    icon: 'BriefcaseBusiness',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'aun-tech-consulting',
    title: 'AUN Tech Consulting',
    description:
      'Future-ready ERP, CRM, and digital transformation consulting—planned and delivered simply.',
    url: '',
    icon: 'Code2',
    placeholder: true,
    enabled: true,
  },
  {
    id: 'adminconnects',
    title: 'AdminConnects',
    description: 'Future-ready guidance connecting education administrators, partners, and operations.',
    url: 'https://adminconnects.com',
    icon: 'Handshake',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'unifeatures',
    title: 'UniFeatures',
    description: 'Student resources, the latest opportunities, and smarter admissions information in one place.',
    url: 'https://unifeatures.com',
    icon: 'Landmark',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'internationalstudentvisas',
    title: 'InternationalStudentVisas',
    description: 'Stay informed, organise documentation, and follow each step of the student visa journey.',
    url: 'https://internationalstudentvisas.com',
    icon: 'Plane',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'australiaskills',
    title: 'AustraliaSkills',
    description:
      'Connect your skills with global opportunities through Australian assessment and migration guidance.',
    url: 'https://australiaskills.com',
    icon: 'Compass',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'canadaadmits',
    title: 'CanadaAdmits',
    description: 'Connect students with Canadian universities and simplify admissions, documents, and study choices.',
    url: 'https://canadaadmits.com',
    icon: 'Building2',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'pikopop',
    title: 'PikoPop',
    description: 'A digital platform for university services, online engagement, and student recruitment support.',
    url: 'https://pikopop.com',
    icon: 'BookOpenText',
    placeholder: false,
    enabled: true,
  },
  {
    id: 'defacomcon',
    title: 'DeFaComCon',
    description: 'Build meaningful connections between students, institutions, and destination communities.',
    url: 'https://defacomcon.com',
    icon: 'Users',
    placeholder: false,
    enabled: true,
  },
];

const ICON_SET = new Set<string>(ALLIED_ICON_IDS);

const clip = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `service-${Date.now()}`;

const isSafeUrl = (value: string) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const sanitizeAlliedServiceItem = (
  raw: unknown,
  index: number,
  usedIds: Set<string>,
): AlliedServiceItem | null => {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const title = clip(item.title, 80);
  if (!title) return null;

  let id = clip(item.id, 64).replace(/[^a-zA-Z0-9_-]/g, '') || slugify(title);
  if (usedIds.has(id)) id = `${id}-${index + 1}`;
  usedIds.add(id);

  const iconRaw = clip(item.icon, 40);
  const icon = (ICON_SET.has(iconRaw) ? iconRaw : 'GraduationCap') as AlliedIconId;
  const urlRaw = clip(item.url, 500);
  const url = isSafeUrl(urlRaw) ? urlRaw : '';

  return {
    id,
    title,
    description: clip(item.description, 280),
    url,
    icon,
    placeholder: Boolean(item.placeholder) || !url,
    enabled: item.enabled !== false,
  };
};

export const normalizeAlliedServices = (stored: unknown): AlliedServicesConfig => {
  const fallback: AlliedServicesConfig = {
    heading: ALLIED_HEADING_DEFAULT,
    items: DEFAULT_ALLIED_SERVICES.map((item) => ({ ...item })),
  };

  if (!stored || typeof stored !== 'object') return fallback;

  const raw = stored as Record<string, unknown>;
  const heading = clip(raw.heading, 80) || fallback.heading;
  const list = Array.isArray(raw.items) ? raw.items : Array.isArray(stored) ? (stored as unknown[]) : null;

  if (!list || list.length === 0) return { heading, items: fallback.items };

  const usedIds = new Set<string>();
  const items = list
    .slice(0, 24)
    .map((item, index) => sanitizeAlliedServiceItem(item, index, usedIds))
    .filter((item): item is AlliedServiceItem => Boolean(item));

  return {
    heading,
    items: items.length ? items : fallback.items,
  };
};

export const publicAlliedServices = (stored: unknown): AlliedServicesConfig => {
  const normalized = normalizeAlliedServices(stored);
  return {
    heading: normalized.heading,
    items: normalized.items.filter((item) => item.enabled),
  };
};
