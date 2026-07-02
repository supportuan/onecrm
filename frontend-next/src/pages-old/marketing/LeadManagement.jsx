'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
import { getCounsellors } from '../../services/userApi';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLeadBulkUpload } from '../../hooks/useLeadBulkUpload';

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
  Send
} from 'lucide-react';

const LEAD_RATING_OPTIONS = ['HOT', 'WARM', 'COLD', 'MAYBE'];
const LEAD_STATUS_OPTIONS = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSED',
  'CONVERTED',
  'LOST',
];

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
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [counsellorFilter, setCounsellorFilter] = useState('');

  const activityEndRef = useRef(null);

  const isAdminOrSuperAdmin = useMemo(() => {
    return user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
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

    if (ratingFilter) {
      filtered = filtered.filter((lead) => lead.rating === ratingFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
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
  }, [search, page, sortBy, sortOrder]);

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
        meetingDate: new Date().toISOString(),
        meetingLink: 'Meeting link will be shared soon',
        message: `Hi ${lead.fullName}, your counselling meeting will be scheduled shortly.`
      };
    }

    return {};
  };

  const refreshActivities = async () => {
    if (!activeLead) return;

    const res = await getLeadActivities(activeLead.id);

    if (res.success) {
      setActivities(res.data || []);
    }
  };

  const handleLeadQuickAction = async (type) => {
    if (!activeLead) return;

    setSendingAction(true);

    try {
      const payload = buildLeadMessage(type, activeLead);
      let response;

      if (type === 'EMAIL') response = await sendLeadEmail(activeLead.id, payload);
      if (type === 'SMS') response = await sendLeadSMS(activeLead.id, payload);
      if (type === 'WHATSAPP') response = await sendLeadWhatsApp(activeLead.id, payload);
      if (type === 'MEETING') response = await scheduleLeadMeeting(activeLead.id, payload);

      if (response?.success) {
        alert(`${type} completed successfully`);
        await refreshActivities();
      } else {
        alert(response?.message || `${type} failed`);
      }
    } catch (error) {
      console.error(error);
      alert(`${type} failed`);
    } finally {
      setSendingAction(false);
    }
  };

  const handleDeleteLead = async (e, id) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to soft-delete this lead?')) return;

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
        alert('Student login created successfully. A welcome email has been sent with credentials.');
        fetchLeadsList();

        if (activeLead && activeLead.id === leadId) {
          setActiveLead((prev) => ({
            ...prev,
            isStudentLoginCreated: true,
            studentUserId: response.data.id
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

  // const handleExport = () => {
  //   if (leads.length === 0) {
  //     alert('No leads found to export.');
  //     return;
  //   }

  //   const headers = [
  //     'Lead Name',
  //     'Country',
  //     'Email',
  //     'Phone',
  //     'Source',
  //     'Interested In',
  //     'Lead Status',
  //     'Assigned By',
  //     'Assigned To',
  //     'Remark',
  //     'Created At'
  //   ];

  //   const rows = leads.map((lead) => [
  //     lead.fullName,
  //     lead.country || '',
  //     lead.email,
  //     lead.phone || '',
  //     lead.source?.name || '',
  //     lead.interestedIn || lead.preferredCourse || '',
  //     lead.rating || 'WARM',
  //     lead.assignedBy?.name || '-',
  //     lead.assignedCounsellor?.name || 'Unassigned',
  //     lead.remark || '',
  //     new Date(lead.createdAt).toLocaleString()
  //   ]);

  //   const csvContent =
  //     'data:text/csv;charset=utf-8,' +
  //     [headers.join(','), ...rows.map((e) =>
  //       e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
  //     )].join('\n');

  //   const encodedUri = encodeURI(csvContent);
  //   const link = document.createElement('a');

  //   link.setAttribute('href', encodedUri);
  //   link.setAttribute(
  //     'download',
  //     `leads_export_${new Date().toISOString().slice(0, 10)}.csv`
  //   );

  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

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
        'Interested In',
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
        lead.interestedIn || lead.preferredCourse || '',
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
    setLoadingActivities(true);

    try {
      const res = await getLeadActivities(lead.id);
      if (res.success) setActivities(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();

    if (!activityForm.comment.trim()) return;

    try {
      const response = await logLeadActivity(activeLead.id, activityForm);

      if (response.success) {
        setActivityForm((p) => ({ ...p, comment: '' }));

        const res = await getLeadActivities(activeLead.id);
        if (res.success) setActivities(res.data || []);
      }
    } catch (err) {
      console.error(err);
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
    try {
      const res = await updateLeadRating(leadId, rating);

      if (res.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, rating } : lead
          )
        );

        if (activeLead?.id === leadId) {
          setActiveLead((prev) => ({ ...prev, rating }));
        }
      } else {
        alert(res.message || 'Failed to update lead status');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while updating lead status.');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateFilter('all');
    setSourceFilter('');
    setRatingFilter('');
    setStatusFilter('');
    setCounsellorFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6 w-full">
      {/* <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-1 py-1 rounded-2xl">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 sm:max-w-md shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#0084ff]/20 focus-within:border-[#0084ff]/60">
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
            className="border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 px-5 py-2.5 rounded-full text-sm font-semibold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
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
            className="border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-full text-sm font-semibold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4 text-slate-600 stroke-[2.5]" />
            Export
          </button>

          <button
            onClick={() => setIsIntakeOpen(true)}
            className="bg-[#1a2b4c] hover:bg-[#253b66] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95 hover:shadow-lg"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Add Lead
          </button>
        </div>
      </div> */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#0084ff]/20 focus-within:border-[#0084ff]/60 xl:max-w-md">
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
              className="border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
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
              className="border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
            >
              <Download className="h-4 w-4 text-slate-600 stroke-[2.5]" />
              Export
            </button>

            <button
              onClick={() => setIsIntakeOpen(true)}
              className="bg-[#1a2b4c] hover:bg-[#253b66] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Add Lead
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
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

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="">All Ratings</option>
            {LEAD_RATING_OPTIONS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
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
                {status}
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
          <Loader2 className="h-10 w-10 text-[#0084ff] animate-spin" />
          <p className="text-sm text-slate-400 font-semibold mt-4">
            Loading active leads database...
          </p>
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
                    className="w-[14%] cursor-pointer px-3 py-4 text-sm font-semibold text-[#556987]"
                  >
                    Lead
                  </th>

                  <th className="w-[18%] px-3 py-4 text-sm font-semibold text-[#556987] text-center">
                    Contact
                  </th>

                  <th
                    onClick={() => handleSort('sourceId')}
                    className="w-[10%] cursor-pointer px-3 py-4 text-sm font-semibold text-[#556987] text-center"
                  >
                    Source
                  </th>

                  <th className="w-[12%] px-3 py-4 text-sm font-semibold text-[#556987] text-center">
                    Interested In
                  </th>

                  <th
                    onClick={() => handleSort('rating')}
                    className="w-[12%] cursor-pointer px-3 py-4 text-sm font-semibold text-[#556987] text-center"
                  >
                    Lead Status
                  </th>

                  <th className="w-[10%] px-3 py-4 text-sm font-semibold text-[#556987] text-center">
                    Assigned By
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
                        <span className="font-semibold text-slate-800 text-[14.5px] leading-tight">
                          {lead.fullName}
                        </span>
                        <span className="text-slate-400 text-xs font-semibold mt-1">
                          {lead.country || 'Unknown'} {formatRelativeTime(lead.createdAt)}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1 text-[13px] text-slate-600">
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            title={lead.email}
                            className="hover:text-[#0084ff] flex items-center gap-1.5 transition font-semibold"
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
                            className="hover:text-[#0084ff] flex items-center gap-1.5 transition font-semibold"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-400 stroke-[2]" />
                            <span>{lead.phone}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span className="font-semibold text-slate-700 text-sm">
                        {lead.source?.name || 'N/A'}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span className="font-semibold text-slate-700 text-sm">
                        {lead.interestedIn || lead.preferredCourse || 'N/A'}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {isAdminOrSuperAdmin ? (
                        <div className="relative inline-block">
                          <select
                            value={lead.rating || 'WARM'}
                            onChange={(e) =>
                              handleLeadRatingChange(lead.id, e.target.value)
                            }
                            className={`appearance-none border px-3 pr-8 py-1.5 rounded-xl text-xs font-bold outline-none cursor-pointer transition shadow-sm w-[100px]${getRatingClasses(
                              lead.rating || 'WARM'
                            )}`}
                          >
                            {LEAD_RATING_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" />
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRatingClasses(
                            lead.rating || 'WARM'
                          )} shadow-sm`}
                        >
                          {lead.rating || 'WARM'}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span className="font-semibold text-slate-600 text-sm">
                        {lead.assignedBy?.name || '-'}
                      </span>
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
                            className="appearance-none border border-slate-200 bg-white hover:bg-slate-50 pl-2 pr-8 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer transition shadow-sm w-full max-w-[140px]"
                          // className="appearance-none border border-slate-200 bg-white hover:bg-slate-50 pl-3 pr-10 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer transition shadow-sm min-w-[180px]"
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
                        <span className="font-semibold text-slate-700 text-sm">
                          {lead.assignedCounsellor?.fullName ||
                            lead.assignedCounsellor?.name ||
                            "Unassigned"}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status || 'NEW'}
                        onChange={(e) => handleLeadStatusChange(lead.id, e.target.value)}
                        className="border border-slate-200 bg-white px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="PROPOSED">Proposed</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </td>
                    <td className="px-4 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {!lead.isStudentLoginCreated ? (
                          <button
                            onClick={() => handleCreateStudentLogin(lead.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm transition-all whitespace-nowrap cursor-pointer"
                            title="Create Student Login"
                          >
                            Create Login
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Login Active
                          </span>
                        )}

                        <button
                          onClick={(e) => handleDeleteLead(e, lead.id)}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer opacity-0 group-hover:opacity-100"
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
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl text-slate-600 font-semibold transition cursor-pointer shadow-sm active:scale-95"
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
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl text-slate-600 font-semibold transition cursor-pointer shadow-sm active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {isIntakeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Add New Lead
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Integrate counselor intake logs with CRM automation
                </p>
              </div>

              <button
                onClick={() => setIsIntakeOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={intakeForm.fullName}
                    onChange={(e) =>
                      setIntakeForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    value={intakeForm.email}
                    onChange={(e) =>
                      setIntakeForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={intakeForm.phone}
                    onChange={(e) =>
                      setIntakeForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    placeholder="India"
                    value={intakeForm.country}
                    onChange={(e) =>
                      setIntakeForm((p) => ({ ...p, country: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Preferred Course
                  </label>
                  <input
                    type="text"
                    placeholder="MBA"
                    value={intakeForm.preferredCourse}
                    onChange={(e) =>
                      setIntakeForm((p) => ({
                        ...p,
                        preferredCourse: e.target.value
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Preferred Country
                  </label>
                  <input
                    type="text"
                    placeholder="Canada"
                    value={intakeForm.preferredCountry}
                    onChange={(e) =>
                      setIntakeForm((p) => ({
                        ...p,
                        preferredCountry: e.target.value
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Lead Source
                  </label>
                  <select
                    value={intakeForm.sourceId}
                    onChange={(e) =>
                      setIntakeForm((p) => ({ ...p, sourceId: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  >
                    <option value="">Select source</option>
                    {sourcesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Assigned Counsellor
                  </label>
                  <select
                    value={intakeForm.assignedCounsellorId || ''}
                    onChange={(e) =>
                      setIntakeForm((p) => ({
                        ...p,
                        assignedCounsellorId: e.target.value
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  >
                    <option value="">Select counsellor</option>
                    {counsellorsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">
                    Lead Status
                  </label>
                  <select
                    value={intakeForm.rating || 'WARM'}
                    onChange={(e) =>
                      setIntakeForm((p) => ({ ...p, rating: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  >
                    {LEAD_RATING_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Counselor Remarks
                </label>
                <textarea
                  placeholder="Call after 1 week. Interested in MBA programs."
                  value={intakeForm.remark}
                  onChange={(e) =>
                    setIntakeForm((p) => ({ ...p, remark: e.target.value }))
                  }
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsIntakeOpen(false)}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingLead}
                  className="bg-[#0084ff] hover:bg-[#0070d9] disabled:bg-[#0084ff]/50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-md hover:shadow-lg"
                >
                  {submittingLead ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Lead'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isActivityOpen && activeLead && (
        <div className="fixed inset-y-0 right-0 z-50 w-[420px] max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full transform transition-transform duration-300">
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
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Rating:</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full border ${getRatingClasses(
                    activeLead.rating || 'WARM'
                  )} text-[10px] font-bold`}
                >
                  {activeLead.rating || 'WARM'}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                  Student Login
                </span>
                <span
                  className={
                    activeLead.isStudentLoginCreated
                      ? 'text-emerald-600 font-bold'
                      : 'text-slate-500'
                  }
                >
                  {activeLead.isStudentLoginCreated
                    ? 'Login Active'
                    : 'No Login Created'}
                </span>
              </div>

              {!activeLead.isStudentLoginCreated && (
                <button
                  onClick={() => handleCreateStudentLogin(activeLead.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                >
                  Create Login
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 stroke-[2]" />
              Interaction History
            </h4>

            {loadingActivities ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 text-[#0084ff] animate-spin" />
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
                          : 'bg-[#0084ff] border-[#0084ff] text-white rounded-br-md'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wide ${isInbound ? 'text-[#0084ff]' : 'text-white/90'
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
                            className={`mt-2 inline-block text-[11px] font-bold underline ${isInbound ? 'text-[#0084ff]' : 'text-white'
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
            onSubmit={handleActivitySubmit}
            className="p-4 border-t border-slate-100 bg-white"
          >
            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
              {['NOTE', 'CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'MEETING'].map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={sendingAction}
                    onClick={() => {
                      if (type === 'NOTE' || type === 'CALL') {
                        setActivityForm((p) => ({ ...p, activityType: type }));
                      } else {
                        handleLeadQuickAction(type);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${activityForm.activityType === type
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                  >
                    {sendingAction &&
                      ['EMAIL', 'SMS', 'WHATSAPP', 'MEETING'].includes(type)
                      ? 'Sending...'
                      : type}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Log activity details or counselor notes..."
                value={activityForm.comment}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, comment: e.target.value }))
                }
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition bg-slate-50"
              />

              <button
                type="submit"
                disabled={!activityForm.comment.trim()}
                className="rounded-xl bg-[#0084ff] hover:bg-[#0070d9] disabled:bg-slate-100 disabled:text-slate-400 text-white p-2.5 shadow-sm transition flex-shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;