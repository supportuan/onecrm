'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  associateCampaignLeads,
  getLeads,
  launchCampaign
} from '../../services/marketingApi';
import {
  Search,
  Plus,
  X,
  Download,
  Loader2,
  AlertCircle,
  ChevronDown,
  ArrowUpDown,
  MoreVertical,
  Calendar,
  DollarSign,
  Users,
  Target,
  FileText,
  Percent,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PieChart,
  Megaphone,
  Briefcase
} from 'lucide-react';

const mapTypeLabel = (type) => {
  switch (type) {
    case 'EMAIL': return 'Email';
    case 'SMS': return 'SMS';
    case 'WHATSAPP': return 'WhatsApp';
    case 'SOCIAL_MEDIA': return 'Social';
    case 'PPC': return 'PPC';
    case 'CONTENT': return 'Content';
    case 'GOOGLE_ADS': return 'Google Ads';
    default: return type;
  }
};

const mapStatusLabel = (status) => {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'PAUSED': return 'Paused';
    case 'DRAFT': return 'Draft';
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
};

const AUDIENCE_TYPES = [
  { label: 'All', value: 'ALL' },
  { label: 'Hot', value: 'HOT' },
  { label: 'Warm', value: 'WARM' },
  { label: 'Cold', value: 'COLD' },
  { label: 'Maybe', value: 'MAYBE' },
];



const getLeadAudienceValue = (lead) => {
  return String(lead?.rating || "").toUpperCase();
};

const getTypeBadgeStyle = (type) => {
  switch (type) {
    case 'EMAIL': return 'border-purple-200 bg-purple-50/50 text-purple-700';
    case 'PPC': return 'border-orange-200 bg-orange-50/50 text-orange-700';
    case 'SOCIAL_MEDIA': return 'border-pink-200 bg-pink-50/50 text-pink-700';
    case 'SMS': return 'border-teal-200 bg-teal-50/50 text-teal-700';
    case 'CONTENT': return 'border-blue-200 bg-blue-50/50 text-blue-700';
    case 'WHATSAPP': return 'border-emerald-200 bg-emerald-50/50 text-emerald-700';
    default: return 'border-neutral-200 bg-neutral-50/50 text-neutral-700';
  }
};

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'ACTIVE': return 'border-emerald-200 bg-emerald-50/50 text-emerald-700';
    case 'PAUSED': return 'border-amber-200 bg-amber-50/50 text-amber-700';
    case 'DRAFT': return 'border-neutral-200 bg-neutral-50/50 text-neutral-600';
    case 'COMPLETED': return 'border-blue-200 bg-blue-50/50 text-blue-700';
    case 'CANCELLED': return 'border-red-200 bg-red-50/50 text-red-700';
    default: return 'border-neutral-200 bg-neutral-50/50 text-neutral-700';
  }
};

const getConvRateStyle = (rate) => {
  if (rate >= 30.0) return 'text-emerald-600 font-bold';
  if (rate > 0.0) return 'text-amber-600 font-semibold';
  return 'text-neutral-500 font-medium';
};

const formatCurrency = (val) => {
  if (val === null || val === undefined) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
};

const formatDuration = (start, end) => {
  if (!start) return 'N/A';
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const startDateStr = new Date(start).toLocaleDateString('en-US', options);
  if (!end) return `${startDateStr} - Present`;
  const endDateStr = new Date(end).toLocaleDateString('en-US', options);
  return `${startDateStr} - ${endDateStr}`;
};

const CampaignTypeFields = ({ type, launchDetails, onChange }) => {
  const updateDetails = (key, value) => {
    onChange({ ...launchDetails, [key]: value });
  };

  if (type === 'SOCIAL_MEDIA') {
    return (
      <div className="space-y-4 pt-4 border-t border-neutral-100 mt-4">
        <h4 className="font-semibold text-neutral-800 text-sm">Social Media Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label>Platform *</label>
            <select
              value={launchDetails.platform || 'FACEBOOK'}
              onChange={(e) => updateDetails('platform', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
            >
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div className="space-y-1">
            <label>Campaign Objective *</label>
            <select
              value={launchDetails.objective || 'LEAD_GENERATION'}
              onChange={(e) => updateDetails('objective', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
            >
              <option value="LEAD_GENERATION">Lead Generation</option>
              <option value="TRAFFIC">Traffic</option>
              <option value="ENGAGEMENT">Engagement</option>
              <option value="CONVERSIONS">Conversions</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label>Target Country</label>
            <input
              type="text"
              value={launchDetails.targetCountry || ''}
              onChange={(e) => updateDetails('targetCountry', e.target.value)}
              placeholder="e.g. India"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
            />
          </div>
          <div className="space-y-1">
            <label>Target Age Range</label>
            <input
              type="text"
              value={launchDetails.targetAgeRange || ''}
              onChange={(e) => updateDetails('targetAgeRange', e.target.value)}
              placeholder="e.g. 18-35"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-neutral-500 bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p>Social Media campaigns use leads to create a Custom Audience. No direct messages are sent.</p>
        </div>
      </div>
    );
  } else if (type === 'SMS') {
    return (
      <div className="space-y-4 pt-4 border-t border-neutral-100 mt-4">
        <h4 className="font-semibold text-neutral-800 text-sm">SMS Settings</h4>
        <div className="space-y-1">
          <label>SMS Message Content *</label>
          <textarea
            rows="3"
            required
            value={launchDetails.smsContent || ''}
            onChange={(e) => updateDetails('smsContent', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white resize-none"
          />
          <p className="text-[10px] text-neutral-500 text-right mt-1">
            {launchDetails.smsContent?.length || 0} characters
          </p>
        </div>
      </div>
    );
  } else if (type === 'WHATSAPP') {
    return (
      <div className="space-y-4 pt-4 border-t border-neutral-100 mt-4">
        <h4 className="font-semibold text-neutral-800 text-sm">WhatsApp Settings</h4>
        <div className="space-y-1">
          <label>Template Name *</label>
          <input
            type="text"
            required
            value={launchDetails.whatsappTemplate || ''}
            onChange={(e) => updateDetails('whatsappTemplate', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
          />
        </div>
        <div className="space-y-1">
          <label>Message Content</label>
          <textarea
            rows="3"
            value={launchDetails.whatsappContent || ''}
            onChange={(e) => updateDetails('whatsappContent', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label>CTA Button Text</label>
            <input
              type="text"
              value={launchDetails.ctaText || ''}
              onChange={(e) => updateDetails('ctaText', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
            />
          </div>
          <div className="space-y-1">
            <label>CTA URL</label>
            <input
              type="url"
              value={launchDetails.ctaUrl || ''}
              onChange={(e) => updateDetails('ctaUrl', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
            />
          </div>
        </div>
      </div>
    );
  } else if (type === 'GOOGLE_ADS') {
    return (
      <div className="space-y-4 pt-4 border-t border-neutral-100 mt-4">
        <h4 className="font-semibold text-neutral-800 text-sm">Google Ads Settings</h4>
        <div className="space-y-1">
          <label>Campaign Goal *</label>
          <select
            value={launchDetails.goal || ''}
            onChange={(e) => updateDetails('goal', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
          >
            <option value="LEADS">Leads</option>
            <option value="WEBSITE_TRAFFIC">Website Traffic</option>
            <option value="SALES">Sales</option>
            <option value="BRAND_AWARENESS">Brand Awareness</option>
          </select>
        </div>
        <div className="space-y-1">
          <label>Landing Page URL *</label>
          <input
            type="url"
            required
            value={launchDetails.landingPageUrl || ''}
            onChange={(e) => updateDetails('landingPageUrl', e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
          />
        </div>
        <div className="space-y-1">
          <label>Headlines (comma separated)</label>
          <textarea
            rows="2"
            value={launchDetails.headlines || ''}
            onChange={(e) => updateDetails('headlines', e.target.value)}
            placeholder="Headline 1, Headline 2, ..."
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white resize-none"
          />
        </div>
        <div className="space-y-1">
          <label>Descriptions (comma separated)</label>
          <textarea
            rows="2"
            value={launchDetails.descriptions || ''}
            onChange={(e) => updateDetails('descriptions', e.target.value)}
            placeholder="Description 1, Description 2, ..."
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white resize-none"
          />
        </div>
        <div className="space-y-1">
          <label>Keywords (comma separated)</label>
          <textarea
            rows="2"
            value={launchDetails.keywords || ''}
            onChange={(e) => updateDetails('keywords', e.target.value)}
            placeholder="Keyword1, Keyword2, ..."
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white resize-none"
          />
        </div>
        <div className="space-y-1">
          <label>Daily Budget *</label>
          <input
            type="number"
            min="0"
            required
            value={launchDetails.dailyBudget || ''}
            onChange={(e) => updateDetails('dailyBudget', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
          />
        </div>
        <div className="space-y-1">
          <label>Target Location *</label>
          <input
            type="text"
            value={launchDetails.targetLocation || ''}
            onChange={(e) => updateDetails('targetLocation', e.target.value)}
            placeholder="e.g. United States"
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none bg-white"
          />
        </div>
      </div>
    );
  }

  return null;
};

const filterLaunchDetailsByType = (type, details) => {
  if (!details) return {};
  switch (type) {
    case 'SOCIAL_MEDIA':
      return {
        platform: details.platform,
        objective: details.objective,
        targetCountry: details.targetCountry,
        targetAgeRange: details.targetAgeRange,
      };
    case 'SMS':
      return { smsContent: details.smsContent };
    case 'WHATSAPP':
      return {
        whatsappTemplate: details.whatsappTemplate,
        whatsappContent: details.whatsappContent,
        ctaText: details.ctaText,
        ctaUrl: details.ctaUrl,
      };
    case 'GOOGLE_ADS':
      return {
        goal: details.goal,
        landingPageUrl: details.landingPageUrl,
        headlines: details.headlines,
        descriptions: details.descriptions,
        keywords: details.keywords,
        dailyBudget: details.dailyBudget,
        targetLocation: details.targetLocation,
      };
    case 'EMAIL':
    case 'PPC':
    case 'CONTENT':
    default:
      return {};
  }
};

const Campaigns = () => {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [summary, setSummary] = useState({ totalBudget: 0, totalSpent: 0, totalLeads: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [launchingIds, setLaunchingIds] = useState([]);



  const handleLaunchCampaign = async (campaignId, audienceType = "ALL") => {
    setLaunchingIds((prev) => [...prev, campaignId]);
    setActiveMenuId(null);

    try {
      const response = await launchCampaign(campaignId, { audienceType });

      const result = response.data || response;

      alert(
        `${result.message || "Campaign launch completed"}\nSelected Audience: ${result.audienceType || audienceType
        }\nLeads Sent: ${result.totalSent ?? 0}\nFailed: ${result.totalFailed ?? 0
        }`
      );

      fetchCampaignsList();
    } catch (err) {
      console.error("Launch campaign error:", err);
      alert("Error occurred while launching the campaign.");
    } finally {
      setLaunchingIds((prev) => prev.filter((id) => id !== campaignId));
    }
  };

  // Filters, Pagination, & Sorting State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal / Slide-out controllers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Selected Campaign details
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Leads checklist for planner
  const [warmLeads, setWarmLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Actions menu ref for closing on outside click
  const menuRef = useRef(null);


  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'EMAIL',
    budget: '',
    spent: 0,
    startDate: '',
    endDate: '',
    status: 'DRAFT',
    audienceType: 'ALL',
    targetAudience: '',
    description: '',
    launchDetails: {},
  });

  const [selectedAudienceCount, setSelectedAudienceCount] = useState(0);

  // Automatically trigger create modal if URL search params indicate
  useEffect(() => {
    if (searchParams && searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Click outside to close actions menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchAudienceCount = async (audienceType = 'ALL') => {
    try {
      const response = await getLeads({ limit: 1000 });

      const leads = response?.data?.items || [];

      const filteredLeads =
        audienceType === 'ALL'
          ? leads
          : leads.filter((lead) => getLeadAudienceValue(lead) === audienceType);

      setSelectedAudienceCount(filteredLeads.length);
    } catch (err) {
      console.error('Audience count error:', err);
      setSelectedAudienceCount(0);
    }
  };

  useEffect(() => {
    if (isCreateOpen || isEditOpen) {
      fetchAudienceCount(campaignForm.audienceType);
    }
  }, [campaignForm.audienceType, isCreateOpen, isEditOpen]);

  const showAudienceType =
    campaignForm.type === 'EMAIL' ||
    campaignForm.type === 'SMS' ||
    campaignForm.type === 'WHATSAPP';

  // Fetch campaigns
  const fetchCampaignsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCampaigns({
        search,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit,
        sortBy,
        sortOrder
      });

      if (response.success) {
        setCampaigns(response.data.items || []);
        setSummary(response.data.summary || { totalBudget: 0, totalSpent: 0, totalLeads: 0 });
        setTotalCount(response.data.total || 0);
      } else {
        setError(response.message || 'Failed to retrieve campaigns.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend marketing services failed. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsList();
    // Reset active menu if parameters change
    setActiveMenuId(null);
  }, [search, typeFilter, statusFilter, page, sortBy, sortOrder]);

  // Fetch detailed info
  const handleOpenDetails = async (campaign) => {
    setSelectedCampaign(campaign);
    setIsViewOpen(true);
    setLoadingDetails(true);
    setCampaignDetails(null);
    setActiveMenuId(null);
    try {
      const response = await getCampaignById(campaign.id);
      if (response.success) {
        setCampaignDetails(response.data);
      } else {
        alert(response.message || 'Failed to fetch campaign details.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to backend detailed campaign services.');
    } finally {
      setLoadingDetails(false);
    }
  };



  const handleOpenEdit = (campaign) => {
    setSelectedCampaign(campaign);

    setCampaignForm({
      name: campaign.name || "",
      type: campaign.type || "EMAIL",
      budget: campaign.budget !== null ? String(campaign.budget) : "",
      spent: campaign.spent || 0,
      startDate: campaign.startDate
        ? new Date(campaign.startDate).toISOString().slice(0, 10)
        : "",
      endDate: campaign.endDate
        ? new Date(campaign.endDate).toISOString().slice(0, 10)
        : "",
      status: campaign.status || "DRAFT",
      audienceType: campaign.audienceType || "ALL",
      targetAudience: campaign.targetAudience || "",
      description: campaign.description || "",
      launchDetails: campaign.launchDetails || {},
    });

    setIsEditOpen(true);
    setActiveMenuId(null);
  };

  // Delete Campaign (Soft Delete)
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This is a soft-delete.')) return;
    try {
      const response = await deleteCampaign(campaignId);
      if (response.success) {
        fetchCampaignsList();
      } else {
        alert(response.message || 'Failed to delete campaign.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error occurred while deleting campaign.');
    }
    setActiveMenuId(null);
  };

  // Open Warm Leads checklist planner
  const handleOpenPlanner = async () => {
    setIsPlannerOpen(true);
    setLoadingLeads(true);
    setSelectedLeadIds([]);
    try {
      const response = await getLeads({ limit: 1000 });
      if (response.success) {
        console.log('Leads API Response:', response);
        console.log('Lead Count:', response?.data?.items?.length);
        // Filter out leads already associated
        const enrolledIds = campaignDetails?.leads?.map(l => l.leadId) || [];
        const pool = (response.data.items || []).filter(l => !enrolledIds.includes(l.id));
        setWarmLeads(pool);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Submit checklist associations
  const handleEnrollLeadsSubmit = async () => {
    if (selectedLeadIds.length === 0) return;
    try {
      const response = await associateCampaignLeads(selectedCampaign.id, {
        leadIds: selectedLeadIds,
        status: 'SENT',
        engagement: 'medium'
      });

      if (response.success) {
        setIsPlannerOpen(false);
        // Refresh details drawer
        const res = await getCampaignById(selectedCampaign.id);
        if (res.success) setCampaignDetails(res.data);
        fetchCampaignsList();
      } else {
        alert(response.message || 'Failed to enroll warm leads.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend lead association manager.');
    }
  };


  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...campaignForm,
        launchDetails: filterLaunchDetailsByType(campaignForm.type, campaignForm.launchDetails),
        budget: campaignForm.budget ? parseFloat(campaignForm.budget) : null,
        spent: campaignForm.spent ? parseFloat(campaignForm.spent) : 0,
        startDate: campaignForm.startDate
          ? new Date(campaignForm.startDate).toISOString()
          : null,
        endDate: campaignForm.endDate
          ? new Date(campaignForm.endDate).toISOString()
          : null,
        audienceType: showAudienceType ? campaignForm.audienceType || 'ALL' : 'ALL',
      };

      const response = await createCampaign(payload);

      if (!response.success) {
        alert(response.message || 'Failed to create campaign.');
        return;
      }

      const createdCampaign = response.data;

      setIsCreateOpen(false);

      setCampaignForm({
        name: '',
        type: 'EMAIL',
        budget: '',
        spent: 0,
        startDate: '',
        endDate: '',
        status: 'DRAFT',
        audienceType: 'ALL',
        targetAudience: '',
        description: '',
      });

      await fetchCampaignsList();

      
      if (payload.status === 'ACTIVE' && createdCampaign?.id) {
        // Social Media campaigns do not send leads; launch directly with NOT_APPLICABLE audience
        if (payload.type === 'SOCIAL_MEDIA') {
          await handleLaunchCampaign(createdCampaign.id, 'NOT_APPLICABLE');
          return;
        }

        // Google Ads campaigns should not associate leads – just launch
        if (payload.type === 'GOOGLE_ADS') {
          await handleLaunchCampaign(createdCampaign.id, payload.audienceType);
          return;
        }

        // Default flow: fetch leads, associate them, then launch
        const leadsResponse = await getLeads({ limit: 1000 });
        const leads = leadsResponse?.data?.items || [];

        const filteredLeads =
          payload.audienceType === 'ALL'
            ? leads
            : leads.filter((lead) => getLeadAudienceValue(lead) === payload.audienceType);

        const leadIds = filteredLeads.map((lead) => lead.id);

        if (leadIds.length === 0) {
          alert(`Campaign created, but no ${payload.audienceType} leads found.`);
          return;
        }

        const associateResponse = await associateCampaignLeads(createdCampaign.id, {
          leadIds,
          status: 'PENDING',
          engagement: 'new',
        });

        if (!associateResponse.success) {
          alert('Campaign created, but failed to attach leads.');
          return;
        }

        await handleLaunchCampaign(createdCampaign.id, payload.audienceType);
      }
    } catch (err) {
      console.error('Create campaign error:', err);
      alert('Connection error while creating campaign.');
    }
  };


  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...campaignForm,
        launchDetails: filterLaunchDetailsByType(campaignForm.type, campaignForm.launchDetails),
        budget: campaignForm.budget ? parseFloat(campaignForm.budget) : null,
        spent: campaignForm.spent ? parseFloat(campaignForm.spent) : 0,
        startDate: campaignForm.startDate ? new Date(campaignForm.startDate).toISOString() : null,
        endDate: campaignForm.endDate ? new Date(campaignForm.endDate).toISOString() : null,
        audienceType: showAudienceType ? campaignForm.audienceType || 'ALL' : 'ALL',
      };

      const response = await updateCampaign(selectedCampaign.id, payload);

      if (response.success) {
        setIsEditOpen(false);
        fetchCampaignsList();
      } else {
        alert(response.message || 'Failed to update campaign.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error while updating campaign.');
    }
  };
  // Export current list to CSV
  const handleExport = () => {
    if (campaigns.length === 0) {
      alert("No campaigns found to export.");
      return;
    }
    const headers = [
      'Campaign Name',
      'Type',
      'Status',
      'Start Date',
      'End Date',
      'Budget',
      'Spent',
      'Leads Count',
      'Conversions Count',
      'Conversion Rate'
    ];
    const rows = campaigns.map(camp => [
      camp.name,
      mapTypeLabel(camp.type),
      mapStatusLabel(camp.status),
      camp.startDate ? new Date(camp.startDate).toLocaleDateString() : '',
      camp.endDate ? new Date(camp.endDate).toLocaleDateString() : '',
      camp.budget || 0,
      camp.spent || 0,
      camp.leadsCount || 0,
      camp.conversionsCount || 0,
      `${camp.conversionRate}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaigns_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Pagination bounds
  const totalPages = Math.ceil(totalCount / limit);
  const startRow = (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, totalCount);

  return (
    <div className="space-y-6">
      {/* FILTER & ACTIONS BAR - high-fidelity rounded pills */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-2 py-1 rounded-lg border border-neutral-200/50 shadow-xs">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 sm:max-w-md shadow-xs transition-all focus-within:ring-2 focus-within:ring-neutral-900/20 focus-within:border-neutral-900/60">
          <Search className="h-5 w-5 text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-500 font-semibold"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-neutral-500 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none border border-neutral-200 bg-neutral-50 hover:bg-slate-100/50 pl-5 pr-10 py-2.5 rounded-full text-sm font-semibold text-neutral-700 outline-none cursor-pointer transition shadow-xs"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none stroke-[2]" />
          </div>

          {/* Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="appearance-none border border-neutral-200 bg-neutral-50 hover:bg-slate-100/50 pl-5 pr-10 py-2.5 rounded-full text-sm font-semibold text-neutral-700 outline-none cursor-pointer transition shadow-xs"
            >
              <option value="">All Types</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="CONTENT">Content</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none stroke-[2]" />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="border border-neutral-200 bg-white hover:bg-neutral-50 px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-700 flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95 animate-in fade-in"
          >
            <Download className="h-4 w-4 text-neutral-600 stroke-[2.5]" />
            Export
          </button>

          {/* Create Campaign Button */}
          <button
            onClick={() => {
              setCampaignForm({
                name: '',
                type: 'EMAIL',
                budget: '',
                spent: 0,
                startDate: '',
                endDate: '',
                status: 'DRAFT',
                audienceType: 'ALL',
                targetAudience: '',
                description: '',
                launchDetails: {},
              });
              setIsCreateOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95 hover:shadow-lg"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* ERROR FEEDBACK */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg text-sm shadow-xs font-semibold animate-in slide-in-from-top-4 duration-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* TABLE PERFORMANCE GRID OR EMPTY/LOADING STATES */}
      {loading && campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-lg border border-neutral-200 shadow-xs">
          <Loader2 className="h-10 w-10 text-neutral-900 animate-spin" />
          <p className="text-sm text-neutral-500 font-semibold mt-4">Gathering outreach campaigns database...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-lg border border-neutral-200 shadow-xs">
          <AlertCircle className="h-12 w-12 text-neutral-600 mb-3" />
          <h3 className="text-lg font-semibold text-neutral-800">No campaigns found</h3>
          <p className="text-sm text-neutral-500 font-medium mt-1">Create a new outreach campaign or adjust filters to begin.</p>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-[24px] overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-neutral-100">
                  <th
                    onClick={() => handleSort('name')}
                    className="cursor-pointer select-none px-6 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition"
                  >
                    <div className="flex items-center gap-1">
                      Campaign Name
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="cursor-pointer select-none px-5 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Type
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="cursor-pointer select-none px-5 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Status
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('startDate')}
                    className="cursor-pointer select-none px-5 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition"
                  >
                    <div className="flex items-center gap-1">
                      Duration
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('budget')}
                    className="cursor-pointer select-none px-5 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition"
                  >
                    <div className="flex items-center gap-1">
                      Budget
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('spent')}
                    className="cursor-pointer select-none px-5 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition"
                  >
                    <div className="flex items-center gap-1">
                      Spent
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('leadsCount')}
                    className="cursor-pointer select-none px-5 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Leads
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('conversionsCount')}
                    className="cursor-pointer select-none px-5 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Conv.
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('conversionRate')}
                    className="cursor-pointer select-none px-5 py-4 text-xs font-semibold text-[#556987] hover:text-neutral-800 transition text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Conv. Rate
                      <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#556987] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-semibold text-neutral-700 text-sm">
                {campaigns.map((camp) => {
                  const spentPercent = camp.budget && camp.budget > 0
                    ? Math.round((camp.spent / camp.budget) * 100)
                    : 0;

                  return (
                    <tr key={camp.id} className="hover:bg-neutral-50/50 transition">

                      {/* Name & Target */}
                      <td className="px-6 py-4.5">
                        <span className="font-semibold text-neutral-800 block leading-tight">{camp.name}</span>
                        <span className="text-[11px] text-neutral-500 font-semibold block mt-0.5 max-w-[220px] truncate">
                          {camp.targetAudience || 'General pool prospects'}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-4.5 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide ${getTypeBadgeStyle(camp.type)}`}>
                          {mapTypeLabel(camp.type)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4.5 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide ${getStatusBadgeStyle(camp.status)}`}>
                          {mapStatusLabel(camp.status)}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-4.5 text-neutral-500 font-semibold whitespace-nowrap text-xs">
                        {formatDuration(camp.startDate, camp.endDate)}
                      </td>

                      {/* Budget */}
                      <td className="px-5 py-4.5 text-neutral-900 font-semibold">
                        {formatCurrency(camp.budget)}
                      </td>

                      {/* Spent & Spent Percentage below */}
                      <td className="px-5 py-4.5">
                        <span className="text-neutral-900 font-semibold block">{formatCurrency(camp.spent)}</span>
                        {camp.budget > 0 && (
                          <span className="text-[11px] text-neutral-500 font-semibold block mt-0.5">
                            {spentPercent}% spent
                          </span>
                        )}
                      </td>

                      {/* Leads Count */}
                      <td className="px-5 py-4.5 text-center text-neutral-800 font-semibold">
                        {/* {camp.leadsCount || 0} */}
                        {camp.type === 'SOCIAL_MEDIA' ? 'N/A' : camp.leadsCount || 0}
                      </td>

                      {/* Conversions Count */}
                      <td className="px-5 py-4.5 text-center text-neutral-800 font-semibold">
                        {camp.type === 'SOCIAL_MEDIA' ? 'N/A' : camp.conversionsCount || 0}
                      </td>

                      {/* Conversion Rate */}
                      <td className={`px-5 py-4.5 text-center ${getConvRateStyle(camp.conversionRate)}`}>
                        {/* {camp.conversionRate !== undefined ? `${camp.conversionRate.toFixed(1)}%` : '0.0%'} */}
                        {camp.type === 'SOCIAL_MEDIA'
                          ? 'N/A'
                          : camp.conversionRate !== undefined
                            ? `${camp.conversionRate.toFixed(1)}%`
                            : '0.0%'}
                      </td>

                      {/* Three-Dot Actions Menu */}
                      <td className="px-6 py-4.5 text-center relative">
                        {launchingIds.includes(camp.id) ? (
                          <Loader2 className="h-5.5 w-5.5 text-neutral-500 animate-spin mx-auto" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === camp.id ? null : camp.id);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-full text-neutral-500 hover:text-neutral-600 transition"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>
                        )}

                        {activeMenuId === camp.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-8 top-12 w-36 bg-white border border-neutral-200/80 rounded-xl shadow-lg py-1.5 z-10 animate-in fade-in zoom-in-95 duration-100 text-left font-semibold text-neutral-700"
                          >
                            <button
                              onClick={() => handleOpenDetails(camp)}
                              className="w-full px-4 py-2 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center gap-2 transition"
                            >
                              <FileText className="h-3.5 w-3.5 text-neutral-500" />
                              View Performance
                            </button>
                            <button
                              onClick={() => handleOpenEdit(camp)}
                              className="w-full px-4 py-2 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center gap-2 transition"
                            >
                              <Target className="h-3.5 w-3.5 text-neutral-500" />
                              Edit details
                            </button>

                            <button
                              onClick={() => handleLaunchCampaign(camp.id, camp.audienceType || 'ALL')}
                              className="w-full px-4 py-2 hover:bg-emerald-50 text-xs font-semibold text-emerald-700 flex items-center gap-2 transition"
                            >
                              <Megaphone className="h-3.5 w-3.5 text-emerald-500" />
                              {camp.type === 'SOCIAL_MEDIA' ? 'Launch Social Media Ad' : 'Launch Campaign'}
                            </button>
                            <div className="border-t border-neutral-100 my-1"></div>
                            <button
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="w-full px-4 py-2 hover:bg-red-50 text-xs font-semibold text-red-600 flex items-center gap-2 transition"
                            >
                              <X className="h-3.5 w-3.5 text-red-400" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTER VIEW: Showing elements & dynamic totals card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 animate-in fade-in duration-500">
        <span className="text-neutral-500 text-sm font-semibold pl-2">
          {totalCount > 0 ? (
            `Showing ${startRow} to ${endRow} of ${totalCount} campaigns`
          ) : (
            'Showing 0 of 0 campaigns'
          )}
        </span>

        {/* Dynamic Aggregated Totals matching screenshot */}
        <div className="bg-[#f8fafc] border border-neutral-200/80 rounded-lg px-6 py-4 flex items-center gap-8 shadow-2xs font-semibold text-neutral-800 text-sm">
          <div>
            <span className="text-xs text-neutral-500 font-semibold block">Total Budget</span>
            <strong className="text-base text-neutral-900 mt-0.5 block">{formatCurrency(summary.totalBudget)}</strong>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold block">Total Spent</span>
            <strong className="text-base text-neutral-900 mt-0.5 block">{formatCurrency(summary.totalSpent)}</strong>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold block">Total Leads</span>
            <strong className="text-base text-neutral-900 mt-0.5 block">
              {new Intl.NumberFormat('en-US').format(summary.totalLeads)}
            </strong>
          </div>
        </div>
      </div>

      {/* PAGINATION SWITCHES */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 font-semibold text-neutral-700">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${page === p
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'border border-neutral-200 hover:bg-neutral-50'
                }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW SLIDE-OVER DRAWER PERFORMANCE */}
      {isViewOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs transition duration-200 animate-fade-in">
          <div className="w-auto bg-white h-screen flex flex-col justify-between shadow-sm animate-slide-in p-1 border-l border-neutral-100">

            {/* Slide Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 line-clamp-1">{selectedCampaign.name}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Campaign Type: {mapTypeLabel(selectedCampaign.type)}</p>
              </div>
              <button
                onClick={() => setIsViewOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Performance Stats Panel */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-neutral-50/50 space-y-6">
              {loadingDetails ? (
                <div className="text-center py-20">
                  <Loader2 className="h-8 w-8 text-neutral-600 animate-spin mx-auto" />
                </div>
              ) : (
                <>
                  {/* Stats Ribbon */}
                  <div className="bg-white border border-neutral-200/80 p-5 rounded-lg shadow-xs space-y-4">
                    <h4 className="text-xs font-semibold text-neutral-500">Demographics / Target Audience</h4>
                    <p className="text-sm font-semibold text-neutral-700 leading-relaxed">
                      {campaignDetails?.targetAudience || 'All inquiries and direct registrants.'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        <span className="text-neutral-500 block font-semibold">Budget Allocated</span>
                        <strong className="text-base font-semibold text-neutral-900 mt-1 block">
                          {formatCurrency(campaignDetails?.budget)}
                        </strong>
                      </div>
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        <span className="text-neutral-500 block font-semibold">Outreach Spent</span>
                        <strong className="text-base font-semibold text-neutral-900 mt-1 block">
                          {formatCurrency(campaignDetails?.spent)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* SVG Radial Charts for rates */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                      <PieChart className="h-4.5 w-4.5 text-neutral-600" />
                      Audience Funnel Rates
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white border border-neutral-200/80 rounded-lg p-4 text-center shadow-xs">
                        <div className="mx-auto h-12 w-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm shadow-3xs">
                          {campaignDetails?.metrics?.openRate || '0%'}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-semibold block mt-2">Open Rate</span>
                      </div>

                      <div className="bg-white border border-neutral-200/80 rounded-lg p-4 text-center shadow-xs">
                        <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shadow-3xs">
                          {campaignDetails?.metrics?.clickRate || '0%'}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-semibold block mt-2">Click-Through</span>
                      </div>

                      <div className="bg-white border border-neutral-200/80 rounded-lg p-4 text-center shadow-xs">
                        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm shadow-3xs">
                          {campaignDetails?.metrics?.conversionRate || '0%'}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-semibold block mt-2">Conversions</span>
                      </div>
                    </div>
                  </div>

                  {/* List of Enrolled Leads */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                        <Users className="h-4.5 w-4.5 text-neutral-500" />
                        Targeted Lead Associations ({campaignDetails?.leads?.length || 0})
                      </h4>
                      <button
                        onClick={handleOpenPlanner}
                        className="text-xs font-semibold text-neutral-900 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/50 px-3 py-1 rounded-full border border-blue-100 transition active:scale-95"
                      >
                        {/* Enroll Warm Leads */}
                        Enroll {campaignDetails?.audienceType || 'All'} Leads
                      </button>
                    </div>

                    <div className="bg-white rounded-lg border border-neutral-200 shadow-xs overflow-hidden divide-y divide-neutral-100">
                      {campaignDetails?.leads?.length === 0 ? (
                        <div className="text-center py-10 text-neutral-500 text-xs font-semibold">
                          No candidate leads enrolled yet. Launch Targeted Planner.
                        </div>
                      ) : (
                        campaignDetails?.leads?.map((l) => (
                          <div key={l.id} className="flex justify-between items-center px-4 py-3 hover:bg-neutral-50 transition font-semibold">
                            <div>
                              <strong className="text-neutral-800 text-xs block font-semibold">{l.lead?.fullName}</strong>
                              <span className="text-[10px] text-neutral-500 font-semibold">
                                Lead Status: {mapStatusLabel(l.lead?.status)}
                              </span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${l.status === 'CLICKED' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                              l.status === 'OPENED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                'bg-neutral-50 text-neutral-600 border border-neutral-100'
                              }`}>
                              {l.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TARGET AUDIENCE CHECKLIST PLANNER MODAL */}
      {isPlannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs transition p-4 animate-fade-in">
          <div className="w-auto bg-white rounded-[24px] border border-neutral-100 shadow-sm flex flex-col justify-between overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-lg flex items-center gap-1.5">
                  <Target className="h-5 w-5 text-neutral-900" />
                  Target Audience Planner
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Select candidates to register into this campaign stream</p>
              </div>
              <button
                onClick={() => setIsPlannerOpen(false)}
                className="p-1 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Checklist items */}
            <div className="p-6 flex-1 max-h-[300px] overflow-y-auto space-y-3 bg-neutral-50/50">
              {loadingLeads ? (
                <div className="text-center py-12">
                  <Loader2 className="h-6 w-6 text-neutral-900 animate-spin mx-auto" />
                </div>
              ) : warmLeads.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs font-semibold">
                  No additional student leads available for enrollment.
                </div>
              ) : (
                warmLeads.map((lead) => (
                  <label
                    key={lead.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-900/50 hover:bg-slate-100/20 cursor-pointer select-none transition font-semibold"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(lead.id)}
                      onChange={() => {
                        setSelectedLeadIds(prev =>
                          prev.includes(lead.id) ? prev.filter(id => id !== lead.id) : [...prev, lead.id]
                        );
                      }}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <div>
                      <strong className="text-neutral-800 text-sm block font-semibold leading-tight">{lead.fullName}</strong>
                      <span className="text-[10px] text-neutral-500 font-semibold block mt-0.5">
                        {lead.preferredCourse || 'General Coursework'} in {lead.country || 'Any country'}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Footer actions */}
            <div className="p-6 border-t border-neutral-100 flex items-center gap-3 bg-white">
              <button
                onClick={handleEnrollLeadsSubmit}
                disabled={selectedLeadIds.length === 0}
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50 active:scale-95"
              >
                {/* Enroll {selectedLeadIds.length} Warm Leads */}
                Enroll {selectedLeadIds.length} {campaignDetails?.audienceType || 'All'} Leads
              </button>
              <button
                onClick={() => setIsPlannerOpen(false)}
                className="px-5 py-3 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-sm font-semibold text-neutral-500 transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs transition p-4 animate-fade-in">
          <div className="w-auto bg-white rounded-[24px] border border-neutral-100 shadow-sm flex flex-col justify-between overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-lg flex items-center gap-1.5">
                  <Megaphone className="h-5 w-5 text-neutral-900 animate-pulse" />
                  Launch Campaign
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Establish outreach channel broadcast specifications</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[420px] overflow-y-auto bg-neutral-50/50 font-semibold text-xs text-neutral-500">

              <div className="space-y-1">
                <label className="">Campaign Identity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sep 2026 UK Intake Ads"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20 outline-none transition font-semibold text-neutral-700 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="">Broadcast Type *</label>
                  <select
                    required
                    value={campaignForm.type}
                    onChange={(e) => {
                      const selectedType = e.target.value;

                      setCampaignForm((p) => ({
                        ...p,
                        type: selectedType,
                        audienceType:
                          selectedType === 'EMAIL' ||
                            selectedType === 'SMS' ||
                            selectedType === 'WHATSAPP'
                            ? p.audienceType || 'ALL'
                            : 'ALL',
                      }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  >
                    <option value="EMAIL">Email Marketing</option>
                    {/* <option value="SMS">SMS Promo Broadcast</option> */}
                    {/* <option value="WHATSAPP">WhatsApp Automation</option> */}
                    <option value="SOCIAL_MEDIA">Social Media Ads</option>
                    {/* <option value="LINKEDIN">LinkedIn Ads</option> */}
                    <option value="GOOGLE_ADS">Google Ads</option>
                    {/* <option value="PPC">Paid Search (PPC)</option> */}
                    {/* <option value="CONTENT">Content Marketing</option> */}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="">Status Milestone</label>
                  <select
                    value={campaignForm.status}
                    onChange={(e) => setCampaignForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="">Budget Allocation ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={campaignForm.budget}
                    onChange={(e) => setCampaignForm(p => ({ ...p, budget: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="">Direct Spent ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={campaignForm.spent}
                    onChange={(e) => setCampaignForm(p => ({ ...p, spent: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="">Start Date</label>
                  <input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="">End Date</label>
                  <input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  />
                </div>
              </div>


              {showAudienceType && (
                <div className="space-y-1">
                  <label>Target Audience Category *</label>
                  <select
                    value={campaignForm.audienceType}
                    onChange={(e) =>
                      setCampaignForm((p) => ({ ...p, audienceType: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  >
                    {AUDIENCE_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] font-semibold text-neutral-500">
                    Selected audience count: {selectedAudienceCount}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="">Campaign description / brief</label>
                <textarea
                  rows="3"
                  placeholder="Ad copywriting guidelines, objectives, conversion metrics..."
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white resize-none"
                />
              </div>

              <CampaignTypeFields
                type={campaignForm.type}
                launchDetails={campaignForm.launchDetails}
                onChange={(newDetails) => setCampaignForm(p => ({ ...p, launchDetails: newDetails }))}
              />

              {/* Submit actions */}
              <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold shadow-sm transition active:scale-95"
                >
                  {campaignForm.type === 'SOCIAL_MEDIA' ? 'Save & Launch Ad' : 'Save & Launch'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-3 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-sm font-semibold text-neutral-500 transition"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      {/* EDIT CAMPAIGN MODAL */}
      {isEditOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs transition p-4 animate-fade-in">
          <div className="w-auto bg-white rounded-[24px] border border-neutral-100 shadow-sm flex flex-col justify-between overflow-hidden">

            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 text-lg flex items-center gap-1.5">
                  <Megaphone className="h-5 w-5 text-neutral-900" />
                  Edit Campaign Detail
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Modify established outreach channel parameters
                </p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="p-6 space-y-4 max-h-[420px] overflow-y-auto bg-neutral-50/50 font-semibold text-xs text-neutral-500"
            >
              <div className="space-y-1">
                <label>Campaign Identity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sep 2026 UK Intake Ads"
                  value={campaignForm.name}
                  onChange={(e) =>
                    setCampaignForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/20 outline-none transition font-semibold text-neutral-700 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Broadcast Type *</label>
                  <select
                    required
                    value={campaignForm.type}
                    onChange={(e) =>
                      setCampaignForm((p) => ({ ...p, type: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  >
                    <option value="EMAIL">Email Marketing</option>
                    {/* <option value="SMS">SMS Promo Broadcast</option> */}
                    {/* <option value="WHATSAPP">WhatsApp Automation</option> */}
                    <option value="SOCIAL_MEDIA">Social Media Ads</option>
                    {/* <option value="PPC">Paid Search (PPC)</option> */}
                    {/* <option value="CONTENT">Content Marketing</option> */}
                  </select>
                </div>

                <div className="space-y-1">
                  <label>Status Milestone</label>
                  <select
                    value={campaignForm.status}
                    onChange={(e) =>
                      setCampaignForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Budget Allocation ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={campaignForm.budget}
                    onChange={(e) =>
                      setCampaignForm((p) => ({ ...p, budget: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label>Direct Spent ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={campaignForm.spent}
                    onChange={(e) =>
                      setCampaignForm((p) => ({
                        ...p,
                        spent: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) =>
                      setCampaignForm((p) => ({ ...p, startDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) =>
                      setCampaignForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  />
                </div>
              </div>
              {showAudienceType && (
                <div className="space-y-1">
                  <label>Target Audience Category *</label>
                  <select
                    value={campaignForm.audienceType}
                    onChange={(e) =>
                      setCampaignForm((p) => ({ ...p, audienceType: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                  >
                    {AUDIENCE_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] font-semibold text-neutral-500">
                    Selected audience count: {selectedAudienceCount}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <label>Target Audience Demographics</label>
                <input
                  type="text"
                  placeholder="e.g. IT and engineering graduates in South Asia"
                  value={campaignForm.targetAudience}
                  onChange={(e) =>
                    setCampaignForm((p) => ({
                      ...p,
                      targetAudience: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label>Campaign description / brief</label>
                <textarea
                  rows="3"
                  placeholder="Ad copywriting guidelines, objectives, conversion metrics..."
                  value={campaignForm.description}
                  onChange={(e) =>
                    setCampaignForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:border-neutral-900 outline-none transition font-semibold text-neutral-700 bg-white resize-none"
                />
              </div>

              <CampaignTypeFields
                type={campaignForm.type}
                launchDetails={campaignForm.launchDetails}
                onChange={(newDetails) => setCampaignForm(p => ({ ...p, launchDetails: newDetails }))}
              />

              <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-sm font-semibold shadow-sm transition active:scale-95"
                >
                  Save & Apply Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-3 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-sm font-semibold text-neutral-500 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Campaigns;
