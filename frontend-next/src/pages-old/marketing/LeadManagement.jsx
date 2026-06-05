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
  saveStudentCRMReply,
  createStudentLogin,
  assignLeadCounsellor
} from '../../services/marketingApi';
import { getCounsellors } from '../../services/userApi';
import { useAuth } from '@/lib/auth/AuthContext';

import {
  Search,
  Plus,
  Phone,
  Mail,
  Download,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  MessageSquare,
  Send
} from 'lucide-react';

// Helper to format relative time nicely, e.g. "2 hours ago", "5 hours ago", "1 day ago"
const formatRelativeTime = (createdAtString) => {
  if (!createdAtString) return '';
  const date = new Date(createdAtString);
  const now = new Date();
  const diffMs = now - date;

  if (diffMs < 0) return 'just now'; // catch future times

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

// Map status labels to show as readable strings
const mapStatusLabel = (status) => {
  const map = {
    'NEW': 'New',
    'CONTACTED': 'Contacted',
    'QUALIFIED': 'Qualified',
    'PROPOSED': 'Proposal',
    'CONVERTED': 'Converted',
    'LOST': 'Lost'
  };
  return map[status] || status;
};

// Map status classes to match screenshot's outlined pills
const getStatusClasses = (status) => {
  switch (status) {
    case 'NEW':
      return 'border-[#38bdf8]/40 bg-[#f0f9ff] text-[#0284c7]';
    case 'CONTACTED':
      return 'border-[#f59e0b]/40 bg-[#fffbeb] text-[#d97706]';
    case 'QUALIFIED':
      return 'border-[#f97316]/40 bg-[#fff7ed] text-[#ea580c]';
    case 'PROPOSED':
      return 'border-[#64748b]/40 bg-[#f8fafc] text-[#475569]';
    case 'CONVERTED':
      return 'border-[#10b981]/40 bg-[#ecfdf5] text-[#059669]';
    case 'LOST':
      return 'border-[#ef4444]/40 bg-[#fef2f2] text-[#dc2626]';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
};

const LeadManagement = () => {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [sourcesList, setSourcesList] = useState([]);
  const [counsellorsList, setCounsellorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth context
  const { user } = useAuth();
  const isAdminOrSuperAdmin = useMemo(() => {
    return user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
  }, [user]);

  // Filters and Query State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // limit set high or standard to show seeded leads cleanly
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter leads for counsellor role (UI-side, in addition to backend filtering)
  const displayedLeads = useMemo(() => {
    if (!user) return leads;
    if (user.role === 'COUNSELLOR') {
      return leads.filter(l => l.assignedCounsellor?.id === user.id);
    }
    return leads;
  }, [leads, user]);

  // Pagination metadata
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 10, totalPages: 1 });

  // Modals & Side Drawer State
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [sendingAction, setSendingAction] = useState(false);

  // Form States
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
    status: 'NEW',
    assignedCounsellorId: ''
  });

  const [activityForm, setActivityForm] = useState({
    activityType: 'NOTE',
    comment: ''
  });

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
    One Workspace`,
      };
    }

    if (type === 'SMS') {
      return {
        message: `Hi ${lead.fullName}, thank you for your interest in ${course}. Our counsellor will contact you shortly. - One Workspace`,
      };
    }

    if (type === 'WHATSAPP') {
      return {
        message: `Hi ${lead.fullName}, thanks for showing interest in ${course} in ${country}. Reply YES to connect with our counsellor.`,
      };
    }

    if (type === 'MEETING') {
      return {
        meetingDate: new Date().toISOString(),
        meetingLink: 'Meeting link will be shared soon',
        message: `Hi ${lead.fullName}, your counselling meeting will be scheduled shortly.`,
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

      if (type === 'EMAIL') {
        response = await sendLeadEmail(activeLead.id, payload);
      }

      if (type === 'SMS') {
        response = await sendLeadSMS(activeLead.id, payload);
      }

      if (type === 'WHATSAPP') {
        response = await sendLeadWhatsApp(activeLead.id, payload);
      }

      if (type === 'MEETING') {
        response = await scheduleLeadMeeting(activeLead.id, payload);
      }

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
  // Check query parameters to open intake modal automatically
  useEffect(() => {
    if (searchParams && searchParams.get('intake') === 'true') {
      setIsIntakeOpen(true);
    }
  }, [searchParams]);

  // Load Lead Sources and Counsellors from API on mount
  useEffect(() => {
    const loadSources = async () => {
      try {
        const res = await getSources();
        if (res.success) {
          setSourcesList(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load sources from database', err);
      }
    };
    const loadCounsellorsData = async () => {
      try {
        const res = await getCounsellors();
        if (res.success) {
          setCounsellorsList(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load counsellors from database', err);
      }
    };
    loadSources();
    loadCounsellorsData();
  }, []);

  // Fetch Leads dynamically based on search, status, sorting, and pagination
  const fetchLeadsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLeads({
        search,
        status: statusFilter || undefined,
        sourceId: sourceFilter ? parseInt(sourceFilter, 10) : undefined,
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
          totalPages: Math.ceil((response.data.total || 0) / (response.data.limit || 10))
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

  // Re-fetch on filter/sorting changes
  useEffect(() => {
    fetchLeadsList();
  }, [search, statusFilter, sourceFilter, page, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sourceFilter]);

  // Soft delete a lead
  const handleDeleteLead = async (e, id) => {
    e.stopPropagation(); // prevent opening details drawer
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

  // Create student login for a lead
  const handleCreateStudentLogin = async (leadId) => {
    try {
      const response = await createStudentLogin(leadId);
      if (response.success) {
        alert('Student login created successfully. A welcome email has been sent with credentials.');
        fetchLeadsList();
        // If the active lead in the drawer is this lead, update it
        if (activeLead && activeLead.id === leadId) {
          setActiveLead(prev => ({
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

  // Handle lead creation
  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLead(true);
    try {
      // Parse parameters matching validation rules
      const payload = {
        ...intakeForm,
        sourceId: intakeForm.sourceId ? parseInt(intakeForm.sourceId, 10) : null,
        assignedCounsellorId: intakeForm.assignedCounsellorId ? parseInt(intakeForm.assignedCounsellorId, 10) : null,
      };

      const response = await createLead(payload);
      if (response.success) {
        setIsIntakeOpen(false);
        // Reset form
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
          status: 'NEW',
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

  // Dynamic Export currently queried backend data as CSV
  const handleExport = () => {
    if (leads.length === 0) {
      alert("No leads found to export.");
      return;
    }
    const headers = [
      'Lead Name',
      'Country',
      'Email',
      'Phone',
      'Source',
      'Interested In',
      'Lead Status',
      'Status',
      'Assigned By',
      'Assigned To',
      'Remark',
      'Created At'
    ];
    const rows = leads.map(lead => [
      lead.fullName,
      lead.country || '',
      lead.email,
      lead.phone || '',
      lead.source?.name || '',
      lead.interestedIn || '',
      lead.rating || 'WARM',
      mapStatusLabel(lead.status),
      lead.assignedBy?.name || '-',
      lead.assignedCounsellor?.name || 'Unassigned',
      lead.remark || '',
      new Date(lead.createdAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open active lead's interaction logs/side panel
  const handleRowClick = async (lead) => {
    setActiveLead(lead);
    setIsActivityOpen(true);
    setLoadingActivities(true);
    try {
      const res = await getLeadActivities(lead.id);
      if (res.success) {
        setActivities(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Log new counselor activity
  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!activityForm.comment.trim()) return;
    try {
      const response = await logLeadActivity(activeLead.id, activityForm);
      if (response.success) {
        setActivityForm(p => ({ ...p, comment: '' }));
        // Refresh activities
        const res = await getLeadActivities(activeLead.id);
        if (res.success) {
          setActivities(res.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle sorting fields
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Assign or change counsellor directly from row
  const handleAssignCounsellor = async (leadId, counsellorId) => {
    try {
      const res = await assignLeadCounsellor(leadId, counsellorId ? parseInt(counsellorId, 10) : null);
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

  const activityEndRef = useRef(null);

  const sortActivitiesOldToNew = (list = []) => {
    return [...list].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  };



  return (
    <div className="space-y-6">

      {/* 1. FILTER & ACTION BAR - Pill styled exactly as screenshot */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-2 py-1 rounded-2xl">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 sm:max-w-md shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#0084ff]/20 focus-within:border-[#0084ff]/60">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 font-semibold"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Source Dropdown - loaded from database */}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="appearance-none border border-slate-200 bg-slate-50 hover:bg-slate-100/50 pl-5 pr-10 py-2.5 rounded-full text-sm font-semibold text-slate-700 outline-none cursor-pointer transition shadow-sm"
            >
              <option value="">All sources</option>
              {sourcesList.map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none stroke-[2]" />
          </div>

          {/* Status Dropdown - pill shaped */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none border border-slate-200 bg-slate-50 hover:bg-slate-100/50 pl-5 pr-10 py-2.5 rounded-full text-sm font-semibold text-slate-700 outline-none cursor-pointer transition shadow-sm"
            >
              <option value="">All status</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROPOSED">Proposal</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none stroke-[2]" />
          </div>

          {/* Export Button - pill shaped */}
          <button
            onClick={handleExport}
            className="border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-full text-sm font-semibold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4 text-slate-600 stroke-[2.5]" />
            Export
          </button>

          {/* Add Lead Button - styled dark blue exactly like screenshot */}
          <button
            onClick={() => setIsIntakeOpen(true)}
            className="bg-[#1a2b4c] hover:bg-[#253b66] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95 hover:shadow-lg"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Add Lead
          </button>
        </div>
      </div>

      {/* 2. MAIN TABLE VIEW OR LOADING/ERROR STATES */}
      {loading && leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="h-10 w-10 text-[#0084ff] animate-spin" />
          <p className="text-sm text-slate-400 font-semibold mt-4">Loading active leads database...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-red-200/80 shadow-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-red-800">Connection Error</h3>
          <p className="text-sm text-red-500 font-medium mt-1">{error}</p>
          <button onClick={fetchLeadsList} className="mt-4 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition">
            Retry Connection
          </button>
        </div>
      ) : leads.length === 0 ? (
        /* Dynamic Empty State Message */
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No leads found</h3>
          <p className="text-sm text-slate-400 font-medium mt-1">Add a new lead in marketing or adjust filters to begin.</p>
        </div>
      ) : (
        /* PREMIUM TABLE GRID DESIGN - matching screenshot precisely */
        <div className="border border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-100">
                  <th
                    onClick={() => handleSort('fullName')}
                    className="cursor-pointer select-none px-6 py-4.5 text-sm font-semibold text-[#556987] hover:text-slate-800 transition"
                  >
                    <div className="flex items-center gap-1">
                      Lead
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4.5 text-sm font-semibold text-[#556987] text-center">Contact</th>
                  <th
                    onClick={() => handleSort('source')}
                    className="cursor-pointer select-none px-6 py-4.5 text-sm font-semibold text-[#556987] hover:text-slate-800 text-center transition"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Source
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4.5 text-sm font-semibold text-[#556987] text-center">Interested in</th>
                  <th
                    onClick={() => handleSort('rating')}
                    className="cursor-pointer select-none px-6 py-4.5 text-sm font-semibold text-[#556987] hover:text-slate-800 text-center transition"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Lead Status
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="cursor-pointer select-none px-6 py-4.5 text-sm font-semibold text-[#556987] hover:text-slate-800 text-center transition"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Status
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4.5 text-sm font-semibold text-[#556987] text-center">Assigned By</th>
                  <th className="px-6 py-4.5 text-sm font-semibold text-[#556987] text-center">Assigned To</th>
                  <th className="px-6 py-4.5 text-sm font-semibold text-[#556987] text-center">Remark</th>
                  <th className="px-6 py-4.5 text-sm font-semibold text-[#556987] text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className="group hover:bg-[#f8fafc]/70 transition-all cursor-pointer duration-150"
                  >
                    {/* Column 1: Lead Details (Name + Country/Time) */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-[14.5px] leading-tight">
                          {lead.fullName}
                        </span>
                        <span className="text-slate-400 text-xs font-semibold mt-1">
                          {lead.country || 'Unknown'} {formatRelativeTime(lead.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Column 2: Contact Details (Email & Phone Number text display) */}
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1 text-[13px] text-slate-600">
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            title={lead.email}
                            className="hover:text-[#0084ff] flex items-center gap-1.5 transition font-semibold"
                          >
                            <Mail className="h-3.5 w-3.5 text-slate-400 stroke-[2]" />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
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

                    {/* Column 3: Source */}
                    <td className="px-6 py-5 text-center">
                      <span className="font-semibold text-slate-700 text-sm">
                        {lead.source?.name || 'N/A'}
                      </span>
                    </td>

                    {/* Column 4: Interested in */}
                    <td className="px-6 py-5 text-center">
                      <span className="font-semibold text-slate-700 text-sm">
                        {lead.interestedIn || 'N/A'}
                      </span>
                    </td>

                    {/* Column 5: Lead Status badge */}
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        lead.rating === 'HOT' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                        lead.rating === 'WARM' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        lead.rating === 'COLD' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                        'bg-blue-50 text-blue-600 border border-blue-200'
                      } shadow-sm`}>
                        {lead.rating || 'WARM'}
                      </span>
                    </td>

                    {/* Column 6: Custom Badges outline pills mapped to style */}
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-4 py-0.5 rounded-full text-xs font-bold border ${getStatusClasses(lead.status)} shadow-sm`}>
                        {mapStatusLabel(lead.status)}
                      </span>
                    </td>

                    {/* Column 7: Assigned By */}
                    <td className="px-6 py-5 text-center">
                      <span className="font-semibold text-slate-600 text-sm">
                        {lead.assignedBy?.name || '-'}
                      </span>
                    </td>

                    {/* Column 8: Assigned To (Dropdown for admin, label for others) */}
                    <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                      {isAdminOrSuperAdmin ? (
                        <select
                          value={lead.assignedCounsellor?.id || ''}
                          onChange={(e) => handleAssignCounsellor(lead.id, e.target.value)}
                          className="appearance-none border border-slate-200 bg-white hover:bg-slate-50 pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer transition shadow-sm w-36"
                        >
                          <option value="">Unassigned</option>
                          {counsellorsList.map(c => (
                            <option key={c.id} value={c.id}>{c.fullName}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-700 text-sm">
                          {lead.assignedCounsellor?.name || 'Unassigned'}
                        </span>
                      )}
                    </td>

                    {/* Column 9: Remark */}
                    <td className="px-6 py-5 text-center max-w-[200px] truncate">
                      <span className="font-semibold text-slate-600 text-sm">
                        {lead.remark || 'No remarks'}
                      </span>
                    </td>

                    {/* Column 10: Actions */}
                    <td className="px-4 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {!lead.isStudentLoginCreated ? (
                          <button
                            onClick={() => handleCreateStudentLogin(lead.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm transition-all"
                            title="Create Student Login"
                          >
                            Create Login
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-full">
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
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm font-medium text-slate-700">
            <div>
              Showing <span className="font-bold text-slate-900">{leads.length > 0 ? (page - 1) * pagination.limit + 1 : 0}</span> to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{pagination.total}</span> records
            </div>
            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl text-slate-600 font-semibold transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-500">
                Page <span className="text-slate-800 font-bold">{page}</span> of{' '}
                <span className="text-slate-800 font-bold">{pagination.totalPages || 1}</span>
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl text-slate-600 font-semibold transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD LEAD intake modal - elegant, premium forms */}
      {isIntakeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Add New Lead</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Integrate counselor intake logs with CRM automation</p>
              </div>
              <button
                onClick={() => setIsIntakeOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleIntakeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={intakeForm.fullName}
                    onChange={(e) => setIntakeForm(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    value={intakeForm.email}
                    onChange={(e) => setIntakeForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={intakeForm.phone}
                    onChange={(e) => setIntakeForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                {/* Country of Origin */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Country of Origin</label>
                  <input
                    type="text"
                    placeholder="India"
                    value={intakeForm.country}
                    onChange={(e) => setIntakeForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                {/* Preferred Course */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Preferred Course</label>
                  <input
                    type="text"
                    placeholder="MBA"
                    value={intakeForm.preferredCourse}
                    onChange={(e) => setIntakeForm(p => ({ ...p, preferredCourse: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                {/* Preferred Country */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Preferred Country</label>
                  <input
                    type="text"
                    placeholder="Canada"
                    value={intakeForm.preferredCountry}
                    onChange={(e) => setIntakeForm(p => ({ ...p, preferredCountry: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  />
                </div>

                {/* Lead Source */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Lead Source</label>
                  <select
                    value={intakeForm.sourceId}
                    onChange={(e) => setIntakeForm(p => ({ ...p, sourceId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  >
                    <option value="">Select source</option>
                    {sourcesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assigned Counsellor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Assigned Counsellor</label>
                  <select
                    value={intakeForm.assignedCounsellorId || ''}
                    onChange={(e) => setIntakeForm(p => ({ ...p, assignedCounsellorId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  >
                    <option value="">Select counsellor</option>
                    {counsellorsList.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Status</label>
                  <select
                    value={intakeForm.status}
                    onChange={(e) => setIntakeForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSED">Proposal</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                {/* Lead Rating Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Lead Status (Rating)</label>
                  <select
                    value={intakeForm.rating || 'WARM'}
                    onChange={(e) => setIntakeForm(p => ({ ...p, rating: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition"
                  >
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="COLD">COLD</option>
                    <option value="MAYBE">MAYBE</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Counselor Remarks</label>
                <textarea
                  placeholder="Call after 1 week. Interested in MBA programs."
                  value={intakeForm.remark}
                  onChange={(e) => setIntakeForm(p => ({ ...p, remark: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 focus:outline-none transition resize-none"
                />
              </div>

              {/* Actions Footer */}
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
                  className="bg-[#0084ff] hover:bg-[#0070d9] disabled:bg-[#0084ff]/50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-md hover:shadow-lg"
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

      {/* 4. INTERACTIVE SIDE PANEL (DRAWER) - for lead activities & logging */}
      {isActivityOpen && activeLead && (
        <div className="fixed inset-y-0 right-0 z-50 w-[420px] max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full transform transition-transform duration-300">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700 text-sm shadow-inner">
                  {activeLead.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800 leading-tight">{activeLead.fullName}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{activeLead.email}</p>
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
                <span>Milestone:</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full border ${getStatusClasses(activeLead.status)} text-[10px]`}>
                  {mapStatusLabel(activeLead.status)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Rating:</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full ${
                  activeLead.rating === 'HOT' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                  activeLead.rating === 'WARM' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                  activeLead.rating === 'COLD' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                  'bg-blue-50 text-blue-600 border border-blue-200'
                } text-[10px] font-bold`}>
                  {activeLead.rating || 'WARM'}
                </span>
              </div>
            </div>

            {/* Student Login Status inside Drawer */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs font-semibold">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Student Login</span>
                <span className={activeLead.isStudentLoginCreated ? "text-emerald-600 font-bold" : "text-slate-500"}>
                  {activeLead.isStudentLoginCreated ? "Login Active" : "No Login Created"}
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

          {/* Activities Timeline */}
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
              // <div className="relative border-l-2 border-slate-200 ml-3.5 pl-6 space-y-6 py-2">
              //   {activities.map((act) => (
              //     <div key={act.id} className="relative group">
              //       <span className="absolute -left-[33px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-4 ring-white shadow-inner group-hover:bg-[#0084ff] group-hover:text-white transition-all">
              //         <Phone className="h-3 w-3 stroke-[2.5]" />
              //       </span>
              //       <div>
              //         <div className="flex items-center justify-between text-[11px] font-semibold">
              //           <span className="text-[#0084ff]">{act.activityType}</span>
              //           <span className="text-slate-400 font-semibold">{new Date(act.createdAt).toLocaleDateString()}</span>
              //         </div>
              //         <p className="mt-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200/60 p-3 rounded-2xl leading-relaxed shadow-sm">
              //           {act.comment}
              //         </p>
              //       </div>
              //     </div>
              //   ))}
              // </div>
              <div className="flex flex-col gap-3 py-2">
                {activities.map((act) => {
                  const metadata = act.metadata || {};

                  const isInbound =
                    metadata.direction === 'INBOUND' ||
                    metadata.fromLead === true;

                  const channel =
                    metadata.channel ||
                    act.activityType ||
                    'NOTE';

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
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wide ${isInbound
                                ? 'text-[#0084ff]'
                                : 'text-white/90'
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
                            className={`text-[10px] font-semibold whitespace-nowrap ${isInbound
                              ? 'text-slate-400'
                              : 'text-white/70'
                              }`}
                          >
                            {formatRelativeTime(act.createdAt)}
                          </span>
                        </div>

                        {/* Message */}
                        <div className="text-xs font-semibold leading-relaxed whitespace-pre-line break-words">
                          {act.comment}
                        </div>

                        {/* Reply metadata */}
                        {metadata?.from && (
                          <div
                            className={`mt-2 text-[10px] ${isInbound
                              ? 'text-slate-400'
                              : 'text-white/70'
                              }`}
                          >
                            From: {metadata.from}
                          </div>
                        )}

                        {/* Meeting link */}
                        {metadata?.meetingLink && (
                          <a
                            href={metadata.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-2 inline-block text-[11px] font-bold underline ${isInbound
                              ? 'text-[#0084ff]'
                              : 'text-white'
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

          {/* Activity Log Form Input */}
          <form onSubmit={handleActivitySubmit} className="p-4 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
              {/* {['NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'MEETING'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityForm(p => ({ ...p, activityType: type }))}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${activityForm.activityType === type
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                >
                  {type}
                </button>
              ))} */}
              {['NOTE', 'CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'MEETING'].map((type) => (
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
                  {sendingAction && ['EMAIL', 'SMS', 'WHATSAPP', 'MEETING'].includes(type)
                    ? 'Sending...'
                    : type}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Log activity details or counselor notes..."
                value={activityForm.comment}
                onChange={(e) => setActivityForm(p => ({ ...p, comment: e.target.value }))}
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
