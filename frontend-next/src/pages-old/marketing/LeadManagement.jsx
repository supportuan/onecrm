'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  getLeads,
  createLead,
  deleteLead,
  getSources,
  getLeadActivities,
  logLeadActivity,
  sendLeadEmail,
  sendLeadSMS,
  sendLeadWhatsApp,
  scheduleLeadMeeting,
  createStudentLogin,
  assignLeadCounsellor,
  updateLeadRating,
  updateLeadStatus,
} from '../../services/marketingApi';
import { listStudents } from '@/services/studentCrmApi';
import { getCounsellors } from '../../services/userApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLeadBulkUpload } from '../../hooks/useLeadBulkUpload';
import CountryDropdown from '@/lib/CountryDropdown/CountryDropdown';
import LogoLoader from '@/components/LogoLoader';

import {
  Search,
  Plus,
  Phone,
  Mail,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  MessageSquare,
  Send,
  Lock,
  LockOpen,
  Flame,
  ChevronsRight,
  Check,
  ExternalLink,
  Copy,
} from 'lucide-react';
import AddLeadModal from '@/components/AddLeadModal';

const RedPhonePngIcon = () => (
  <img src="/images/red_phone.png" alt="Red Phone" className="h-6 w-6 object-contain mix-blend-multiply scale-[2.5] shrink-0" />
);

const GreenPhonePngIcon = () => (
  <img src="/images/green_phone.png" alt="Green Phone" className="h-6 w-6 object-contain mix-blend-multiply scale-[2.5] shrink-0" />
);

const CallbackPhonePngIcon = () => (
  <img src="/images/callback_phone.png" alt="Callback Phone" className="h-6 w-6 object-contain mix-blend-multiply scale-[2.5] shrink-0" />
);

const ConvertedPngIcon = () => (
  <img src="/images/converted.png" alt="Converted" className="h-6 w-6 object-contain scale-[2.2] shrink-0" />
);

const LEAD_RATING_OPTIONS = ['HOT', 'WARM', 'COLD', 'MAYBE'];

const RATING_CONFIG = {
  HOT: {
    title: 'Hot',
    icon: Flame,
    bgClass: 'bg-red-50 border-red-200 hover:bg-red-100',
    iconClass: 'text-[#e12d39] fill-[#e12d39]',
  },
  WARM: {
    title: 'Warm',
    icon: Flame,
    bgClass: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    iconClass: 'text-[#e8b61c] fill-[#e8b61c]',
  },
  COLD: {
    title: 'Cold',
    icon: Flame,
    bgClass: 'bg-sky-50 border-sky-200 hover:bg-sky-100',
    iconClass: 'text-[#38b6ff] fill-[#38b6ff]',
  },
  MAYBE: {
    title: 'Maybe',
    icon: ChevronsRight,
    bgClass: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    iconClass: 'text-[#ff6f1a] stroke-[2.75]',
  },
};

const STATUS_OPTIONS = [
  { key: 'HOT', label: 'Hot', config: RATING_CONFIG.HOT },
  { key: 'WARM', label: 'Warm', config: RATING_CONFIG.WARM },
  { key: 'COLD', label: 'Cold', config: RATING_CONFIG.COLD },
  { key: 'MAYBE', label: 'Maybe', config: RATING_CONFIG.MAYBE },
];

const STAGE_CONFIG = {
  NOT_CONTACTED: {
    title: 'Not Contacted',
    icon: RedPhonePngIcon,
    bgClass: 'bg-red-50 border-red-200 hover:bg-red-100',
    iconClass: '',
  },
  CONTACTED: {
    title: 'Contacted',
    icon: GreenPhonePngIcon,
    bgClass: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    iconClass: '',
  },
  CALLBACK: {
    title: 'Callback',
    icon: CallbackPhonePngIcon,
    bgClass: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    iconClass: '',
  },
  CONVERTED: {
    title: 'Converted',
    icon: ConvertedPngIcon,
    bgClass: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    iconClass: '',
  },
};

const LEAD_STATUS_OPTIONS = ['NOT_CONTACTED', 'CONTACTED', 'CALLBACK', 'CONVERTED'];

const LEGACY_STAGE_MAP = {
  FOLLOW_UP: 'CALLBACK',
  QUALIFIED: 'CONVERTED',
  LOST: 'NOT_CONTACTED',
  PROPOSED: 'CONVERTED',
};

const formatLeadStatus = (status) =>
  String(status || 'NEW')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const STAGE_OPTIONS = LEAD_STATUS_OPTIONS.map((key) => ({
  key,
  label: STAGE_CONFIG[key]?.title || formatLeadStatus(key),
  config: STAGE_CONFIG[key] || STAGE_CONFIG.NOT_CONTACTED,
}));

const PHONE_RATING_KEYS = new Set(['RED_PHONE', 'GREEN_PHONE', 'CALLBACK_PHONE']);
const PHONE_RATING_TO_STAGE = {
  RED_PHONE: 'NOT_CONTACTED',
  GREEN_PHONE: 'CONTACTED',
  CALLBACK_PHONE: 'CALLBACK',
};

const resolveLeadStage = (lead) => {
  const rating = String(lead?.rating || '').toUpperCase();
  if (PHONE_RATING_KEYS.has(rating) && (!lead?.status || lead.status === 'NEW')) {
    return PHONE_RATING_TO_STAGE[rating];
  }
  if (lead?.status && lead.status !== 'NEW') {
    return LEGACY_STAGE_MAP[lead.status] || lead.status;
  }
  return 'NOT_CONTACTED';
};

const StatusDropdown = ({ currentRating, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const rKey = (currentRating || 'WARM').toUpperCase();
  const currentConfig = RATING_CONFIG[rKey] || RATING_CONFIG.WARM;
  const CurrentIcon = currentConfig.icon;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        title={`Status: ${currentConfig.title}`}
        aria-label={`Status: ${currentConfig.title}`}
        className={`inline-flex items-center justify-center p-2 rounded-full border shadow-sm transition hover:scale-110 active:scale-95 cursor-pointer ${currentConfig.bgClass}`}
      >
        <CurrentIcon className={`h-4.5 w-4.5 ${currentConfig.iconClass}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 mb-1 text-left">
            Select Lead Status
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {STATUS_OPTIONS.map((opt) => {
              const IconComp = opt.config.icon;
              const isSelected = rKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ target: { value: opt.key } });
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-2.5 py-2 text-xs font-medium rounded-xl transition-all duration-150 ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center p-1.5 rounded-full border shadow-2xs shrink-0 ${opt.config.bgClass}`}>
                    <IconComp className={`h-3.5 w-3.5 ${opt.config.iconClass}`} />
                  </span>
                  <span className="flex-1 text-left truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-brand shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const renderLeadStatus = (rating, onChange = null, isEditable = true) => {
  const rawKey = (rating || 'WARM').toUpperCase();
  const rKey = PHONE_RATING_KEYS.has(rawKey) ? 'WARM' : rawKey;
  const config = RATING_CONFIG[rKey] || RATING_CONFIG.WARM;
  const IconComponent = config.icon;

  if (isEditable && onChange) {
    return <StatusDropdown currentRating={rKey} onChange={onChange} />;
  }

  return (
    <span
      title={`Status: ${config.title}`}
      aria-label={`Status: ${config.title}`}
      className={`inline-flex items-center justify-center p-2 rounded-full border shadow-sm ${config.bgClass}`}
    >
      <IconComponent className={`h-4.5 w-4.5 ${config.iconClass}`} />
    </span>
  );
};

const StageDropdown = ({ currentStatus, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const sKey = (currentStatus || 'NOT_CONTACTED').toUpperCase();
  const currentConfig = STAGE_CONFIG[sKey] || STAGE_CONFIG.NOT_CONTACTED;
  const CurrentIcon = currentConfig.icon;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        title={`Stage: ${currentConfig.title}`}
        aria-label={`Stage: ${currentConfig.title}`}
        className={`inline-flex items-center justify-center p-2 rounded-full border shadow-sm transition hover:scale-110 active:scale-95 cursor-pointer ${currentConfig.bgClass}`}
      >
        <CurrentIcon className={`h-4.5 w-4.5 ${currentConfig.iconClass}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 mb-1 text-left">
            Select Lead Stage
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {STAGE_OPTIONS.map((opt) => {
              const IconComp = opt.config.icon;
              const isSelected = sKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ target: { value: opt.key } });
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-2.5 py-2 text-xs font-medium rounded-xl transition-all duration-150 ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center p-1.5 rounded-full border shadow-2xs shrink-0 ${opt.config.bgClass}`}>
                    <IconComp className={`h-3.5 w-3.5 ${opt.config.iconClass}`} />
                  </span>
                  <span className="flex-1 text-left truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-brand shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const renderLeadStage = (status, onChange = null, isEditable = true) => {
  const sKey = (status || 'NOT_CONTACTED').toUpperCase();
  const config = STAGE_CONFIG[sKey] || STAGE_CONFIG.NOT_CONTACTED;
  const IconComponent = config.icon;

  if (isEditable && onChange) {
    return <StageDropdown currentStatus={sKey} onChange={onChange} />;
  }

  return (
    <span
      title={`Stage: ${config.title}`}
      aria-label={`Stage: ${config.title}`}
      className={`inline-flex items-center justify-center p-2 rounded-full border shadow-sm ${config.bgClass}`}
    >
      <IconComponent className={`h-4.5 w-4.5 ${config.iconClass}`} />
    </span>
  );
};

export const getSavedStatus = (leadId, defaultRating) => {
  if (typeof window === 'undefined') return defaultRating || 'WARM';
  try {
    const saved = JSON.parse(localStorage.getItem('onecrm.lead_symbols') || '{}');
    const value = saved[leadId] || defaultRating || 'WARM';
    return PHONE_RATING_KEYS.has(String(value).toUpperCase()) ? (defaultRating || 'WARM') : value;
  } catch {
    return defaultRating || 'WARM';
  }
};
export const getSavedSymbol = getSavedStatus;

const DATE_FILTER_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Quarterly', value: 'quarter' },
  { label: 'Half Yearly', value: 'halfyear' },
  { label: 'Annually', value: 'year' },
];

const getStartDateByFilter = (filter) => {
  const now = new Date();
  const start = new Date(now);

  if (filter === 'today') {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (filter === 'week') {
    start.setDate(now.getDate() - 7);
    return start;
  }

  if (filter === 'month') {
    start.setMonth(now.getMonth() - 1);
    return start;
  }

  if (filter === 'quarter') {
    start.setMonth(now.getMonth() - 3);
    return start;
  }

  if (filter === 'halfyear') {
    start.setMonth(now.getMonth() - 6);
    return start;
  }

  if (filter === 'year') {
    start.setFullYear(now.getFullYear() - 1);
    return start;
  }

  return null;
};

const isWithinDateFilter = (dateValue, filter) => {
  if (filter === 'all') return true;
  if (!dateValue) return false;

  const startDate = getStartDateByFilter(filter);
  const date = new Date(dateValue);

  return date >= startDate;
};
const formatRelativeTime = (createdAtString) => {
  if (!createdAtString) return '';
  const date = new Date(createdAtString);
  const now = new Date();
  const diffMs = now - date;

  if (diffMs < 0) return 'just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
};

const getRatingClasses = (rating) => {
  switch (rating) {
    case 'HOT':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'WARM':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'COLD':
      return 'bg-slate-50 text-slate-600 border-slate-200';
    case 'MAYBE':
      return 'bg-blue-50 text-blue-600 border-blue-200';
    default:
      return 'bg-amber-50 text-amber-600 border-amber-200';
  }
};

const LeadManagement = () => {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const [leads, setLeads] = useState([]);
  const [sourcesList, setSourcesList] = useState([]);
  const [counsellorsList, setCounsellorsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');


  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 10,
    totalPages: 1
  });

  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [sendingAction, setSendingAction] = useState(false);

  const [dateFilter, setDateFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [countryFilterId, setCountryFilterId] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [counsellorFilter, setCounsellorFilter] = useState('');

  const activityEndRef = useRef(null);

  const isAdminOrSuperAdmin = useMemo(() => {
    return user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === "GLOBAL_ADMIN");
  }, [user]);

  // const displayedLeads = useMemo(() => {
  //   if (!user) return leads;

  //   if (user.role === 'COUNSELLOR') {
  //     return leads.filter((l) => l.assignedCounsellor?.id === user.id);
  //   }

  //   return leads;
  // }, [leads, user]);

  const displayedLeads = useMemo(() => {
    let filtered = [...leads];

    if (user?.role === 'COUNSELLOR') {
      filtered = filtered.filter((lead) => lead.assignedCounsellor?.id === user.id);
    }

    if (dateFilter !== 'all') {
      filtered = filtered.filter((lead) =>
        isWithinDateFilter(lead.createdAt, dateFilter)
      );
    }

    if (sourceFilter) {
      filtered = filtered.filter(
        (lead) => String(lead.source?.id || lead.sourceId || '') === sourceFilter
      );
    }

    if (countryFilter) {
      filtered = filtered.filter((lead) => lead.country === countryFilter);
    }

    if (ratingFilter) {
      filtered = filtered.filter((lead) => getSavedStatus(lead.id, lead.rating) === ratingFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((lead) => resolveLeadStage(lead) === statusFilter);
    }

    if (counsellorFilter) {
      filtered = filtered.filter(
        (lead) =>
          String(lead.assignedCounsellor?.id || lead.assignedCounsellorId || '') ===
          counsellorFilter
      );
    }

    return filtered;
  }, [
    leads,
    user,
    dateFilter,
    sourceFilter,
    countryFilter,
    ratingFilter,
    statusFilter,
    counsellorFilter,
  ]);

  const [intakeForm, setIntakeForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    preferredCountry: '',
    preferredCourse: '',
    sourceId: '',
    rating: 'WARM',
    remark: '',
    assignedCounsellorId: ''
  });

  const [activityForm, setActivityForm] = useState({
    activityType: 'NOTE',
    comment: ''
  });

  const [communicationDraft, setCommunicationDraft] = useState({
    subject: '',
    message: '',
    meetingDate: '',
    meetingLink: '',
  });

  const [studentLoginMeta, setStudentLoginMeta] = useState(null);

  const getStudentLoginUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/login`;
    }
    return '/login';
  };

  const buildStudentLoginMessages = (lead, tempPassword) => {
    const loginUrl = getStudentLoginUrl();
    const passwordLine = tempPassword
      ? `Temporary password: ${tempPassword}`
      : 'If you forgot your password, use "Forgot password" on the login page.';

    const longMessage = `Hi ${lead.fullName},

Your student account is ready.

Login page: ${loginUrl}
Email: ${lead.email || '—'}
${passwordLine}

You will be asked to set a new password on first login.

Regards,
ApplyUniNow`;

    const shortMessage = `Hi ${lead.fullName}, your ApplyUniNow student login is ready: ${loginUrl} | Email: ${lead.email || '—'}${tempPassword ? ` | Temp password: ${tempPassword}` : ''}`;

    return {
      subject: 'Your ApplyUniNow student login',
      emailMessage: longMessage,
      smsMessage: shortMessage,
      whatsAppMessage: shortMessage,
      loginUrl,
    };
  };

  const openStudentLoginCommunication = (channel) => {
    if (!activeLead) return;

    const templates = buildStudentLoginMessages(
      activeLead,
      studentLoginMeta?.tempPassword
    );

    if (channel === 'EMAIL') {
      setCommunicationDraft({
        subject: templates.subject,
        message: templates.emailMessage,
        meetingDate: '',
        meetingLink: '',
      });
      setActivityForm((p) => ({ ...p, activityType: 'EMAIL', comment: '' }));
      return;
    }

    if (channel === 'SMS' || channel === 'WHATSAPP') {
      setCommunicationDraft({
        subject: '',
        message: channel === 'SMS' ? templates.smsMessage : templates.whatsAppMessage,
        meetingDate: '',
        meetingLink: '',
      });
      setActivityForm((p) => ({ ...p, activityType: channel, comment: '' }));
    }
  };

  const copyStudentLoginLink = async () => {
    const loginUrl = getStudentLoginUrl();
    try {
      await navigator.clipboard.writeText(loginUrl);
      alert('Student login link copied.');
    } catch {
      alert(loginUrl);
    }
  };

  const defaultMeetingDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const fileInputRef = useRef(null);
  // const [uploadingLeads, setUploadingLeads] = useState(false);

  const handleLeadStatusChange = async (leadId, status) => {
    try {
      const res = await updateLeadStatus(leadId, status);

      if (res.success) {
        fetchLeadsList();
      } else {
        alert(res.message || 'Failed to update lead status');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while updating lead status.');
    }
  };

  useEffect(() => {
    if (searchParams && searchParams.get('intake') === 'true') {
      setIsIntakeOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadSources = async () => {
      try {
        const res = await getSources();
        if (res.success) setSourcesList(res.data || []);
      } catch (err) {
        console.error('Failed to load sources', err);
      }
    };

    const loadCounsellorsData = async () => {
      try {
        const res = await getCounsellors();
        if (res.success) setCounsellorsList(res.data || []);
      } catch (err) {
        console.error('Failed to load counsellors', err);
      }
    };

    loadSources();
    loadCounsellorsData();
  }, []);

  const fetchLeadsList = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getLeads({
        search,
        sourceId: sourceFilter || undefined,
        country: countryFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit,
        sortBy,
        sortOrder
      });

      if (response.success) {
        setLeads(response.data.items || []);
        setPagination({
          page: response.data.page || 1,
          total: response.data.total || 0,
          limit: response.data.limit || 10,
          totalPages: Math.ceil(
            (response.data.total || 0) / (response.data.limit || 10)
          )
        });
      } else {
        setError(response.message || 'Failed to fetch marketing leads');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend database server lost. Please retry.');
    } finally {
      setLoading(false);
    }
  };
  const { uploadingLeads, handleBulkUpload } =
    useLeadBulkUpload(fetchLeadsList);

  useEffect(() => {
    fetchLeadsList();
  }, [search, sourceFilter, countryFilter, statusFilter, page, sortBy, sortOrder]);

  const buildLeadMessage = (type, lead) => {
    const course = lead.preferredCourse || 'your selected course';
    const country = lead.preferredCountry || 'your preferred country';

    if (type === 'EMAIL') {
      return {
        subject: `Study Abroad Consultation - ${lead.fullName}`,
        message: `Hi ${lead.fullName},

    Thank you for your interest in ${course} in ${country}.

    Our counsellor will contact you shortly and guide you with the next steps.

    Regards,
    ApplyUniNow`
      };
    }

    if (type === 'SMS') {
      return {
        message: `Hi ${lead.fullName}, thank you for your interest in ${course}. Our counsellor will contact you shortly. - One Workspace`
      };
    }

    if (type === 'WHATSAPP') {
      return {
        message: `Hi ${lead.fullName}, thanks for showing interest in ${course} in ${country}. Reply YES to connect with our counsellor.`
      };
    }

    if (type === 'MEETING') {
      return {
        meetingDate: defaultMeetingDate(),
        meetingLink: '',
        message: `Hi ${lead.fullName}, your counselling meeting will be scheduled shortly.`,
      };
    }

    return {};
  };

  const applyActivityType = (type) => {
    setActivityForm((prev) => ({ ...prev, activityType: type, comment: '' }));
    if (!activeLead || type === 'NOTE' || type === 'CALL') return;

    const defaults = buildLeadMessage(type, activeLead);
    setCommunicationDraft({
      subject: defaults.subject || '',
      message: defaults.message || '',
      meetingDate: defaults.meetingDate || defaultMeetingDate(),
      meetingLink: defaults.meetingLink || '',
    });
  };

  const refreshActivities = async () => {
    if (!activeLead) return;

    const res = await getLeadActivities(activeLead.id);

    if (res.success) {
      setActivities(res.data || []);
    }
  };

  const handleLeadQuickAction = async (type, payload) => {
    if (!activeLead) return false;

    setSendingAction(true);

    try {
      let response;

      if (type === 'EMAIL') response = await sendLeadEmail(activeLead.id, payload);
      if (type === 'SMS') response = await sendLeadSMS(activeLead.id, payload);
      if (type === 'WHATSAPP') response = await sendLeadWhatsApp(activeLead.id, payload);
      if (type === 'MEETING') response = await scheduleLeadMeeting(activeLead.id, payload);

      if (response?.success) {
        await refreshActivities();
        return true;
      }

      alert(response?.message || `${type} failed`);
      return false;
    } catch (error) {
      console.error(error);
      alert(error?.message || `${type} failed`);
      return false;
    } finally {
      setSendingAction(false);
    }
  };

  const handleCommunicationSubmit = async (e) => {
    e.preventDefault();
    if (!activeLead || sendingAction) return;

    const type = activityForm.activityType;

    if (type === 'NOTE' || type === 'CALL') {
      if (!activityForm.comment.trim()) return;

      try {
        const response = await logLeadActivity(activeLead.id, {
          activityType: type,
          comment: activityForm.comment.trim(),
        });

        if (response.success) {
          setActivityForm((p) => ({ ...p, comment: '' }));
          await refreshActivities();
        } else {
          alert(response.message || 'Failed to log activity');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to log activity');
      }
      return;
    }

    if (type === 'EMAIL') {
      if (!activeLead.email?.trim()) {
        alert('This lead has no email address.');
        return;
      }
      if (!communicationDraft.message.trim()) {
        alert('Enter an email message.');
        return;
      }
      const ok = await handleLeadQuickAction('EMAIL', {
        subject: communicationDraft.subject.trim(),
        message: communicationDraft.message.trim(),
      });
      if (ok) alert('Email sent successfully');
      return;
    }

    if (type === 'SMS' || type === 'WHATSAPP') {
      if (!activeLead.phone?.trim()) {
        alert('This lead has no phone number.');
        return;
      }
      if (!communicationDraft.message.trim()) {
        alert('Enter a message.');
        return;
      }
      const ok = await handleLeadQuickAction(type, {
        message: communicationDraft.message.trim(),
      });
      if (ok) alert(`${type} sent successfully`);
      return;
    }

    if (type === 'MEETING') {
      if (!communicationDraft.message.trim()) {
        alert('Enter meeting details for the lead.');
        return;
      }
      const ok = await handleLeadQuickAction('MEETING', {
        meetingDate: communicationDraft.meetingDate
          ? new Date(communicationDraft.meetingDate).toISOString()
          : undefined,
        meetingLink: communicationDraft.meetingLink.trim(),
        message: communicationDraft.message.trim(),
      });
      if (ok) alert('Meeting scheduled successfully');
    }
  };

  const handleDeleteLead = async (e, id) => {
    e.stopPropagation();

    if (!window.confirm('Move this lead to Archive? You can restore it later from Archive.')) return;

    try {
      const response = await deleteLead(id);

      if (response.success) {
        fetchLeadsList();
      } else {
        alert(response.message || 'Failed to delete lead');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while deleting lead.');
    }
  };

  const handleCreateStudentLogin = async (leadId) => {
    try {
      const response = await createStudentLogin(leadId);

      if (response.success) {
        alert('Student converted: login, CRM profile, and draft application created. Welcome email sent if a new login was created.');
        fetchLeadsList();

        if (activeLead && activeLead.id === leadId) {
          setStudentLoginMeta({
            tempPassword: response.data?.tempPassword || null,
            studentId: response.data?.studentId || null,
            loginUrl: getStudentLoginUrl(),
          });
          setActiveLead((prev) => ({
            ...prev,
            isStudentLoginCreated: true,
            studentUserId: response.data.id,
            studentId: response.data?.studentId || prev.studentId,
          }));
        }
      } else {
        alert(response.message || 'Failed to create student login');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while creating student login.');
    }
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLead(true);

    try {
      const payload = {
        ...intakeForm,
        sourceId: intakeForm.sourceId ? parseInt(intakeForm.sourceId, 10) : null,
        assignedCounsellorId: intakeForm.assignedCounsellorId
          ? parseInt(intakeForm.assignedCounsellorId, 10)
          : null
      };

      const response = await createLead(payload);

      if (response.success) {
        setIsIntakeOpen(false);

        setIntakeForm({
          fullName: '',
          email: '',
          phone: '',
          country: '',
          preferredCountry: '',
          preferredCourse: '',
          sourceId: '',
          rating: 'WARM',
          remark: '',
          assignedCounsellorId: ''
        });

        fetchLeadsList();
      } else {
        alert(response.message || 'Failed to create lead');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving lead. Please fill all required fields correctly.');
    } finally {
      setSubmittingLead(false);
    }
  };

  

  const handleExport = async () => {
    try {
      const response = await getLeads({
        search,
        page: 1,
        limit: pagination.total || 10000,
        sortBy,
        sortOrder
      });

      if (!response.success) {
        alert(response.message || 'Failed to export leads.');
        return;
      }

      const allLeads = response.data.items || [];

      if (allLeads.length === 0) {
        alert('No leads found to export.');
        return;
      }

      const exportLeads =
        user?.role === 'COUNSELLOR'
          ? allLeads.filter((l) => l.assignedCounsellor?.id === user.id)
          : allLeads;

      const headers = [
        'Lead Name',
        'Country',
        'Email',
        'Phone',
        'Source',
        'Course',
        'Lead Status',
        'Assigned By',
        'Assigned To',
        'Remark',
        'Created At'
      ];

      const rows = exportLeads.map((lead) => [
        lead.fullName || '',
        lead.country || '',
        lead.email || '',
        lead.phone || '',
        lead.source?.name || '',
        lead.preferredCourse || lead.interestedIn || '',
        lead.rating || 'WARM',
        lead.assignedBy?.name || '-',
        lead.assignedCounsellor?.fullName ||
        lead.assignedCounsellor?.name ||
        'Unassigned',
        lead.remark || '',
        lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''
      ]);

      const csvContent =
        '\uFEFF' +
        [headers, ...rows]
          .map((row) =>
            row
              .map((value) => `"${String(value).replace(/"/g, '""')}"`)
              .join(',')
          )
          .join('\n');

      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `leads_export_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error occurred while exporting leads.');
    }
  };

  const handleRowClick = async (lead) => {
    setActiveLead(lead);
    setIsActivityOpen(true);
    setActivityForm({ activityType: 'NOTE', comment: '' });
    setCommunicationDraft({ subject: '', message: '', meetingDate: '', meetingLink: '' });
    setStudentLoginMeta(null);
    setLoadingActivities(true);

    try {
      const res = await getLeadActivities(lead.id);
      if (res.success) setActivities(res.data || []);

      if (lead.isStudentLoginCreated && lead.email) {
        try {
          const studentRes = await listStudents({ search: lead.email, limit: 10 });
          const items = Array.isArray(studentRes?.data)
            ? studentRes.data
            : studentRes?.data?.items || [];
          const match = items.find(
            (s) => String(s.email || '').toLowerCase() === String(lead.email).toLowerCase()
          );
          if (match?.id) {
            setActiveLead((prev) => (prev ? { ...prev, studentId: match.id } : prev));
          }
        } catch {
          /* optional lookup */
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleAssignCounsellor = async (leadId, counsellorId) => {
    try {
      const res = await assignLeadCounsellor(
        leadId,
        counsellorId ? parseInt(counsellorId, 10) : null
      );

      if (res.success) {
        fetchLeadsList();
      } else {
        alert(res.message || 'Failed to assign counsellor');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while assigning counsellor.');
    }
  };

  const handleLeadRatingChange = async (leadId, rating) => {
    if (PHONE_RATING_KEYS.has(String(rating).toUpperCase())) return;

    // 1. Save to local storage for persistence on page refresh
    try {
      const saved = JSON.parse(localStorage.getItem('onecrm.lead_symbols') || '{}');
      saved[leadId] = rating;
      localStorage.setItem('onecrm.lead_symbols', JSON.stringify(saved));
    } catch {
      /* ignore */
    }

    // 2. Update UI state immediately & smoothly
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, rating } : lead
      )
    );

    if (activeLead?.id === leadId) {
      setActiveLead((prev) => ({ ...prev, rating }));
    }

    // 3. Sync with backend API
    try {
      await updateLeadRating(leadId, rating);
    } catch (err) {
      console.error('Failed to sync rating with backend:', err);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateFilter('all');
    setSourceFilter('');
    setCountryFilter('');
    setCountryFilterId('');
    setRatingFilter('');
    setStatusFilter('');
    setCounsellorFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6 w-full">

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand/60 xl:max-w-md">
            <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />

            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 font-semibold"
            />

            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleBulkUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLeads}
              className="border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2 transition  shadow-sm active:scale-95"
            >
              {uploadingLeads ? (
                <Loader2 className="h-4 w-4 text-slate-600 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 text-slate-600 stroke-[2.5]" />
              )}
              {uploadingLeads ? 'Uploading...' : 'Upload'}
            </button>

            <button
              onClick={handleExport}
              className="border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2 transition  shadow-sm active:scale-95"
            >
              <Download className="h-4 w-4 text-slate-600 stroke-[2.5]" />
              Export
            </button>

            <button
              onClick={() => setIsIntakeOpen(true)}
              className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition  shadow-md active:scale-95 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Add Lead
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-3">
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            {DATE_FILTER_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">All Sources</option>
            {sourcesList.map((source) => (
              <option key={source.id} value={String(source.id)}>
                {source.name}
              </option>
            ))}
          </select>

          <CountryDropdown
            value={countryFilterId}
            onChange={(country) => {
              setCountryFilterId(country?.id ? String(country.id) : '');
              setCountryFilter(country?.name || '');
              setPage(1);
            }}
            placeholder="All Countries"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          />

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="HOT">Hot</option>
            <option value="WARM">🟡 Warm</option>
            <option value="COLD">🔵 Cold</option>
            <option value="MAYBE">⏩ Maybe</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">All Stages</option>
            {LEAD_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatLeadStatus(status)}
              </option>
            ))}
          </select>

          <select
            value={counsellorFilter}
            onChange={(e) => {
              setCounsellorFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">All Counsellors</option>
            {counsellorsList.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.fullName}
              </option>
            ))}
          </select>

          <button
            onClick={handleResetFilters}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 text-sm font-bold text-slate-700 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading && displayedLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <LogoLoader label="Loading active leads database…" size="md" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-red-200/80 shadow-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-red-800">Connection Error</h3>
          <p className="text-sm text-red-500 font-medium mt-1">{error}</p>
          <button
            onClick={fetchLeadsList}
            className="mt-4 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition"
          >
            Retry Connection
          </button>
        </div>
      ) : displayedLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No leads found</h3>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Add a new lead in marketing or adjust filters to begin.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-[24px] bg-white shadow-sm w-full overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-100">
                  <th
                    onClick={() => handleSort('fullName')}
                    className="w-[14%]  px-3 py-4 text-sm font-semibold text-[#556987]"
                  >
                    Lead
                  </th>

                  <th className="w-[18%] px-3 py-4 text-sm font-semibold text-[#556987] text-center">
                    Contact
                  </th>

                  <th
                    onClick={() => handleSort('source')}
                    className="w-[10%]  px-3 py-4 text-sm font-semibold text-[#556987] text-center"
                  >
                    Source
                  </th>

                  <th
                    onClick={() => handleSort('country')}
                    className="w-[10%] px-3 py-4 text-sm font-semibold text-[#556987] text-center"
                  >
                    Country
                  </th>

                  <th className="w-[12%] px-3 py-4 text-sm font-semibold text-[#556987] text-center">
                    Course
                  </th>

                  <th
                    onClick={() => handleSort('rating')}
                    className="w-[12%] px-3 py-4 text-sm font-semibold text-[#556987] text-center cursor-pointer hover:text-brand transition"
                  >
                    Status
                  </th>

                  <th className="w-[16%] px-3 py-4 text-sm font-semibold text-[#556987] text-center">
                    Assigned To
                  </th>
                  <th className="w-[12%] px-3 py-4 text-sm font-semibold text-[#556987] text-center">
                    Stage
                  </th>

                  <th className="w-[8%] px-3 py-4 text-sm font-semibold text-[#556987] text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayedLeads.map((lead) => (
                  <tr key={`lead-${lead.id}`}
                    className="group hover:bg-[#f8fafc]/70 transition-all duration-150"
                  >
                    <td className="px-3 py-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(lead);
                      }}>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 text-[14.5px] leading-tight">
                          {lead.fullName}
                        </span>
                        <span className="text-slate-400 text-xs font-normal mt-1">
                          {formatRelativeTime(lead.createdAt)}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1 text-[13px] text-slate-600">
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            title={lead.email}
                            className="hover:text-brand flex items-center gap-1.5 transition font-normal"
                          >
                            <Mail className="h-3.5 w-3.5 text-slate-400 stroke-[2]" />
                            <span className="truncate max-w-[150px]">
                              {lead.email}
                            </span>
                          </a>
                        )}

                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            title={lead.phone}
                            className="hover:text-brand flex items-center gap-1.5 transition font-normal"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-400 stroke-[2]" />
                            <span>{lead.phone}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span className="font-normal text-slate-700 text-sm">
                        {lead.source?.name || 'N/A'}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span className="font-normal text-slate-700 text-sm">
                        {lead.country || 'N/A'}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span className="font-normal text-slate-700 text-sm">
                        {lead.preferredCourse || 'N/A'}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {renderLeadStatus(
                        getSavedStatus(lead.id, lead.rating),
                        (e) => handleLeadRatingChange(lead.id, e.target.value),
                        isAdminOrSuperAdmin
                      )}
                    </td>

                    <td
                      className="px-3 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isAdminOrSuperAdmin ? (
                        <div className="relative inline-block">
                          <select
                            value={lead.assignedCounsellor?.id || ""}
                            onChange={(e) =>
                              handleAssignCounsellor(lead.id, e.target.value)
                            }
                            className="appearance-none border border-slate-200 bg-white hover:bg-slate-50 pl-2 pr-8 py-1.5 rounded-xl text-xs font-normal text-slate-700 outline-none transition shadow-sm w-full max-w-[140px]"
                          >
                            <option value="">Unassigned</option>

                            {counsellorsList.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.fullName}
                              </option>
                            ))}
                          </select>

                          <ChevronDown
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"
                          />
                        </div>
                      ) : (
                        <span className="font-normal text-slate-700 text-sm">
                          {lead.assignedCounsellor?.fullName ||
                            lead.assignedCounsellor?.name ||
                            "Unassigned"}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {renderLeadStage(
                        resolveLeadStage(lead),
                        (e) => handleLeadStatusChange(lead.id, e.target.value)
                      )}
                    </td>
                    <td className="px-4 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {!lead.isStudentLoginCreated ? (
                          <button
                            type="button"
                            onClick={() => handleCreateStudentLogin(lead.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 hover:text-red-700 active:scale-95"
                            title="Create login"
                            aria-label="Create login"
                          >
                            <Lock className="h-4 w-4" strokeWidth={2.25} />
                          </button>
                        ) : (
                          <span
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                            title="Login created"
                            aria-label="Login created"
                          >
                            <LockOpen className="h-4 w-4" strokeWidth={2.25} />
                          </span>
                        )}

                        <button
                          onClick={(e) => handleDeleteLead(e, lead.id)}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm font-medium text-slate-700">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-900">
                {leads.length > 0 ? (page - 1) * pagination.limit + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(page * pagination.limit, pagination.total)}

              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-900">
                {/* {pagination.total} */}
                {displayedLeads.length}
              </span>{' '}
              records
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl text-slate-600 font-semibold transition  shadow-sm active:scale-95"
              >
                Previous
              </button>

              <span className="font-semibold text-slate-500 whitespace-nowrap">
                Page{' '}
                <span className="text-slate-800 font-bold">{page}</span> of{' '}
                <span className="text-slate-800 font-bold">
                  {pagination.totalPages || 1}
                </span>
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl text-slate-600 font-semibold transition  shadow-sm active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {isActivityOpen && activeLead && (
        <div
          className="fixed right-0 top-[var(--ui-shell-header-height)] bottom-0 z-50 w-[420px] max-w-full bg-white border-l
                  border-slate-200
                  shadow-2xl
                  flex
                  flex-col
                  transition-all
                  duration-300
                "
        >
          <div className="px-3 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700 text-sm shadow-inner">
                  {activeLead.fullName
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-800 leading-tight">
                    {activeLead.fullName}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {activeLead.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsActivityOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Status:</span>
                {renderLeadStatus(getSavedStatus(activeLead.id, activeLead.rating))}
              </div>
            </div>

            <div className="mt-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2.5">
                {activeLead.isStudentLoginCreated ? (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                    title="Login created"
                  >
                    <LockOpen className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                ) : (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200"
                    title="Login not created"
                  >
                    <Lock className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                    Student login
                  </span>
                  <span
                    className={
                      activeLead.isStudentLoginCreated
                        ? 'text-emerald-600 font-bold'
                        : 'text-red-600 font-bold'
                    }
                  >
                    {activeLead.isStudentLoginCreated
                      ? 'Login created'
                      : 'Create login'}
                  </span>
                </div>
              </div>

              {!activeLead.isStudentLoginCreated && (
                <button
                  type="button"
                  onClick={() => handleCreateStudentLogin(activeLead.id)}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                  title="Create login"
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Create login
                </button>
              )}
            </div>

            {activeLead.isStudentLoginCreated && (
              <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Send login details
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => openStudentLoginCommunication('EMAIL')}
                    disabled={!activeLead.email?.trim()}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <Mail className="h-3 w-3" />
                    Email login
                  </button>
                  <button
                    type="button"
                    onClick={() => openStudentLoginCommunication('SMS')}
                    disabled={!activeLead.phone?.trim()}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <Phone className="h-3 w-3" />
                    SMS login
                  </button>
                  <button
                    type="button"
                    onClick={() => openStudentLoginCommunication('WHATSAPP')}
                    disabled={!activeLead.phone?.trim()}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <MessageSquare className="h-3 w-3" />
                    WhatsApp login
                  </button>
                  <button
                    type="button"
                    onClick={copyStudentLoginLink}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <Copy className="h-3 w-3" />
                    Copy link
                  </button>
                  <a
                    href={getStudentLoginUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Login page
                  </a>
                  {activeLead.studentId && (
                    <Link
                      href={`/student-crm/student-management?student=${activeLead.studentId}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Student profile
                    </Link>
                  )}
                </div>
                {studentLoginMeta?.tempPassword && (
                  <p className="mt-2 text-[10px] font-semibold text-emerald-800">
                    Temp password: {studentLoginMeta.tempPassword}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 stroke-[2]" />
              Interaction History
            </h4>

            {loadingActivities ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 text-brand animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                No history logs. Log an interaction note below to start the timeline.
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                {activities.map((act) => {
                  const metadata = act.metadata || {};
                  const isInbound =
                    metadata.direction === 'INBOUND' ||
                    metadata.fromLead === true;

                  const channel = metadata.channel || act.activityType || 'NOTE';
                  const senderName = isInbound
                    ? activeLead?.fullName || 'Lead'
                    : 'CRM';

                  return (
                    <div
                      key={act.id}
                      className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${isInbound
                          ? 'bg-white border-slate-200 text-slate-700 rounded-bl-md'
                          : 'bg-brand border-brand text-white rounded-br-md'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wide ${isInbound ? 'text-brand' : 'text-white/90'
                                }`}
                            >
                              {senderName}
                            </span>

                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${isInbound
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-white/20 text-white'
                                }`}
                            >
                              {channel}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-semibold whitespace-nowrap ${isInbound ? 'text-slate-400' : 'text-white/70'
                              }`}
                          >
                            {formatRelativeTime(act.createdAt)}
                          </span>
                        </div>

                        <div className="text-xs font-semibold leading-relaxed whitespace-pre-line break-words">
                          {act.comment}
                        </div>

                        {metadata?.from && (
                          <div
                            className={`mt-2 text-[10px] ${isInbound ? 'text-slate-400' : 'text-white/70'
                              }`}
                          >
                            From: {metadata.from}
                          </div>
                        )}

                        {metadata?.meetingLink && (
                          <a
                            href={metadata.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-2 inline-block text-[11px] font-bold underline ${isInbound ? 'text-brand' : 'text-white'
                              }`}
                          >
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={activityEndRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={handleCommunicationSubmit}
            className="flex-none border-t border-slate-100 bg-white p-4"
          >
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {['NOTE', 'CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'MEETING'].map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={sendingAction}
                  onClick={() => applyActivityType(type)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold transition ${
                    activityForm.activityType === type
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {(activityForm.activityType === 'NOTE' || activityForm.activityType === 'CALL') && (
              <>
                {activityForm.activityType === 'CALL' && (
                  <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Lead phone
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {activeLead.phone || 'No phone on file'}
                      </p>
                    </div>
                    {activeLead.phone && (
                      <a
                        href={`tel:${activeLead.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-hover"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call now
                      </a>
                    )}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    rows={activityForm.activityType === 'CALL' ? 3 : 2}
                    placeholder={
                      activityForm.activityType === 'CALL'
                        ? 'Log call outcome, duration, and next steps...'
                        : 'Log activity details or counsellor notes...'
                    }
                    value={activityForm.comment}
                    onChange={(e) =>
                      setActivityForm((p) => ({ ...p, comment: e.target.value }))
                    }
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="submit"
                    disabled={!activityForm.comment.trim() || sendingAction}
                    className="flex-shrink-0 rounded-xl bg-brand p-2.5 text-white shadow-sm transition hover:bg-brand-hover disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <Send className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </>
            )}

            {activityForm.activityType === 'EMAIL' && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  To: {activeLead.email || 'No email on file'}
                </p>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={communicationDraft.subject}
                  onChange={(e) =>
                    setCommunicationDraft((p) => ({ ...p, subject: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <textarea
                  rows={5}
                  placeholder="Email message..."
                  value={communicationDraft.message}
                  onChange={(e) =>
                    setCommunicationDraft((p) => ({ ...p, message: e.target.value }))
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  disabled={sendingAction || !activeLead.email?.trim() || !communicationDraft.message.trim()}
                  className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold text-white transition hover:bg-brand-hover disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {sendingAction ? 'Sending email…' : 'Send email'}
                </button>
              </div>
            )}

            {(activityForm.activityType === 'SMS' || activityForm.activityType === 'WHATSAPP') && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  To: {activeLead.phone || 'No phone on file'}
                </p>
                <textarea
                  rows={4}
                  placeholder={`${activityForm.activityType} message...`}
                  value={communicationDraft.message}
                  onChange={(e) =>
                    setCommunicationDraft((p) => ({ ...p, message: e.target.value }))
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <div className="flex gap-2">
                  {activityForm.activityType === 'WHATSAPP' && activeLead.phone && (
                    <a
                      href={`https://wa.me/${activeLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(communicationDraft.message)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Open WhatsApp
                    </a>
                  )}
                  <button
                    type="submit"
                    disabled={
                      sendingAction ||
                      !activeLead.phone?.trim() ||
                      !communicationDraft.message.trim()
                    }
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand py-2.5 text-xs font-bold text-white transition hover:bg-brand-hover disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {sendingAction
                      ? `Sending ${activityForm.activityType.toLowerCase()}…`
                      : `Send ${activityForm.activityType.toLowerCase()}`}
                  </button>
                </div>
              </div>
            )}

            {activityForm.activityType === 'MEETING' && (
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  value={communicationDraft.meetingDate}
                  onChange={(e) =>
                    setCommunicationDraft((p) => ({ ...p, meetingDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <input
                  type="url"
                  placeholder="Meeting link (Zoom, Google Meet, etc.)"
                  value={communicationDraft.meetingLink}
                  onChange={(e) =>
                    setCommunicationDraft((p) => ({ ...p, meetingLink: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <textarea
                  rows={4}
                  placeholder="Meeting invite message for the lead..."
                  value={communicationDraft.message}
                  onChange={(e) =>
                    setCommunicationDraft((p) => ({ ...p, message: e.target.value }))
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  disabled={sendingAction || !communicationDraft.message.trim()}
                  className="w-full rounded-xl bg-brand py-2.5 text-xs font-bold text-white transition hover:bg-brand-hover disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {sendingAction ? 'Scheduling…' : 'Schedule meeting'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      <AddLeadModal
        open={isIntakeOpen}
        onClose={() =>
          setIsIntakeOpen(false)
        }
      />

    </div>
  );
};

export default LeadManagement;