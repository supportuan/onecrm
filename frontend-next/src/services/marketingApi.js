import authFetch from '@/lib/api';

const API_URL = 'http://localhost:4000/api/marketing';

// ==========================================
// 1. Dashboard & Reports Service
// ==========================================

export const getMarketingDashboard = async () => {
  const res = await authFetch(`${API_URL}/dashboard`);
  return res.json();
};

export const getIntakeTrends = async () => {
  const res = await authFetch(`${API_URL}/intake-trends`);
  return res.json();
};

export const getMarketingFunnels = async () => {
  const res = await authFetch(`${API_URL}/funnels`);
  return res.json();
};

export const getMarketingAnalytics = async () => {
  const res = await authFetch(`${API_URL}/analytics`);
  return res.json();
};

// ==========================================
// 2. Leads Management Service
// ==========================================

export const getLeads = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search !== undefined && filters.search !== null) params.append('search', filters.search);
  if (filters.status !== undefined && filters.status !== null) params.append('status', filters.status);
  if (filters.sourceId !== undefined && filters.sourceId !== null) params.append('sourceId', filters.sourceId);
  if (filters.page !== undefined && filters.page !== null) params.append('page', filters.page);
  if (filters.limit !== undefined && filters.limit !== null) params.append('limit', filters.limit);
  if (filters.sortBy !== undefined && filters.sortBy !== null) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder !== undefined && filters.sortOrder !== null) params.append('sortOrder', filters.sortOrder);

  const res = await authFetch(`${API_URL}/leads?${params.toString()}`);
  return res.json();
};

export const getSources = async () => {
  const res = await authFetch(`${API_URL}/sources`);
  return res.json();
};

export const getLeadById = async (id) => {
  const res = await authFetch(`${API_URL}/leads/${id}`);
  return res.json();
};

export const createLead = async (leadData) => {
  const res = await authFetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData),
  });
  return res.json();
};

export const updateLead = async (id, leadData) => {
  const res = await authFetch(`${API_URL}/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData),
  });
  return res.json();
};

export const deleteLead = async (id) => {
  const res = await authFetch(`${API_URL}/leads/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

export const assignLeadCounsellor = async (leadId, counsellorId) => {
  const res = await authFetch(`${API_URL}/leads/${leadId}/assign-counsellor`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ counsellorId }),
  });
  return res.json();
};

export const getLeadActivities = async (leadId) => {
  const res = await authFetch(`${API_URL}/leads/${leadId}/activities`);
  return res.json();
};

export const logLeadActivity = async (leadId, activityData) => {
  const res = await authFetch(`${API_URL}/leads/${leadId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData),
  });
  return res.json();
};

// ==========================================
// 3. Campaigns Service
// ==========================================

export const getCampaigns = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search !== undefined && filters.search !== null) params.append('search', filters.search);
  if (filters.type !== undefined && filters.type !== null) params.append('type', filters.type);
  if (filters.status !== undefined && filters.status !== null) params.append('status', filters.status);
  if (filters.page !== undefined && filters.page !== null) params.append('page', filters.page);
  if (filters.limit !== undefined && filters.limit !== null) params.append('limit', filters.limit);
  if (filters.sortBy !== undefined && filters.sortBy !== null) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder !== undefined && filters.sortOrder !== null) params.append('sortOrder', filters.sortOrder);

  const res = await authFetch(`${API_URL}/campaigns?${params.toString()}`);
  return res.json();
};

export const getCampaignById = async (id) => {
  const res = await authFetch(`${API_URL}/campaigns/${id}`);
  return res.json();
};

export const createCampaign = async (campaignData) => {
  const res = await authFetch(`${API_URL}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaignData),
  });
  return res.json();
};

export const updateCampaign = async (id, campaignData) => {
  const res = await authFetch(`${API_URL}/campaigns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaignData),
  });
  return res.json();
};

export const deleteCampaign = async (id) => {
  const res = await authFetch(`${API_URL}/campaigns/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

export const associateCampaignLeads = async (id, leadData) => {
  const res = await authFetch(`${API_URL}/campaigns/${id}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData),
  });
  return res.json();
};

// ==========================================
// 4. Marketing Automation Service
// ==========================================

export const getAutomations = async (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.search) query.append('search', filters.search);
  if (filters.status) query.append('status', filters.status);
  if (filters.page) query.append('page', filters.page);
  if (filters.limit) query.append('limit', filters.limit);
  if (filters.sortBy) query.append('sortBy', filters.sortBy);
  if (filters.sortOrder) query.append('sortOrder', filters.sortOrder);

  const res = await authFetch(`${API_URL}/automations?${query.toString()}`);
  return res.json();
};

export const getAutomationSummary = async () => {
  const res = await authFetch(`${API_URL}/automations/summary`);
  return res.json();
};

export const getAutomationById = async (id) => {
  const res = await authFetch(`${API_URL}/automations/${id}`);
  return res.json();
};

export const createAutomation = async (automationData) => {
  const res = await authFetch(`${API_URL}/automations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(automationData),
  });
  return res.json();
};

export const updateLeadRating = async (leadId, rating) => {
  const res = await authFetch(`${API_URL}/leads/${leadId}/rating`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });

  return res.json();
};

export const updateAutomation = async (id, automationData) => {
  const res = await authFetch(`${API_URL}/automations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(automationData),
  });
  return res.json();
};

export const deleteAutomation = async (id) => {
  const res = await authFetch(`${API_URL}/automations/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

// ==========================================
// 5. Landing Pages Service
// ==========================================

export const getLandingPages = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search !== undefined && filters.search !== null) params.append('search', filters.search);
  if (filters.type !== undefined && filters.type !== null) params.append('type', filters.type);
  if (filters.page !== undefined && filters.page !== null) params.append('page', filters.page);
  if (filters.limit !== undefined && filters.limit !== null) params.append('limit', filters.limit);
  if (filters.sortBy !== undefined && filters.sortBy !== null) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder !== undefined && filters.sortOrder !== null) params.append('sortOrder', filters.sortOrder);

  const res = await authFetch(`${API_URL}/landing-pages?${params.toString()}`);
  return res.json();
};

export const getFormsSummary = async () => {
  const res = await authFetch(`${API_URL}/forms/summary`);
  return res.json();
};

export const getLandingPageById = async (id) => {
  const res = await authFetch(`${API_URL}/landing-pages/${id}`);
  return res.json();
};

export const createLandingPage = async (pageData) => {
  const res = await authFetch(`${API_URL}/landing-pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pageData),
  });
  return res.json();
};

export const updateLandingPage = async (id, pageData) => {
  const res = await authFetch(`${API_URL}/landing-pages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pageData),
  });
  return res.json();
};

export const deleteLandingPage = async (id) => {
  const res = await authFetch(`${API_URL}/landing-pages/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

export const submitLandingPageForm = async (slug, submitData) => {
  const res = await authFetch(`${API_URL}/landing-pages/${slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submitData),
  });
  return res.json();
};

// ==========================================
// 6. Marketing Analytics Service
// ==========================================

export const getMarketingMetricsApi = async (period = '30days') => {
  const res = await authFetch(`${API_URL}/analytics/metrics?period=${period}`);
  return res.json();
};

export const getMarketingPerformanceApi = async (period = '30days') => {
  const res = await authFetch(`${API_URL}/analytics/performance?period=${period}`);
  return res.json();
};

export const getChannelAnalyticsApi = async (period = '30days') => {
  const res = await authFetch(`${API_URL}/analytics/channels?period=${period}`);
  return res.json();
};

export const getAgencyFunnelApi = async (period = '30days') => {
  const res = await authFetch(`${API_URL}/analytics/agency-funnel?period=${period}`);
  return res.json();
};

export const getMarketingAnalyticsSummaryApi = async (period = '30days') => {
  const res = await authFetch(`${API_URL}/analytics/summary?period=${period}`);
  return res.json();
};


// ===================================================================
// 7. Messages
// ===================================================================

export const sendLeadEmail = async (leadId, payload) => {
  const res = await authFetch(`${API_URL}/leads/${leadId}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const sendLeadSMS = async (leadId, payload) => {
  const res = await authFetch(`${API_URL}/leads/${leadId}/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const sendLeadWhatsApp = async (leadId, payload) => {
  const res = await authFetch(`${API_URL}/leads/${leadId}/send-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const scheduleLeadMeeting = async (leadId, payload) => {
  const res = await authFetch(`${API_URL}/leads/${leadId}/schedule-meeting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const saveEmailReply = async (payload) => {
  const res = await authFetch(`${API_URL}/replies/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const saveSMSReply = async (payload) => {
  const res = await authFetch(`${API_URL}/replies/sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const saveWhatsAppReply = async (payload) => {
  const res = await authFetch(`${API_URL}/replies/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const saveStudentCRMReply = async (payload) => {
  const res = await authFetch(`${API_URL}/replies/student-crm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

export const createStudentLogin = async (leadId, password = null) => {
  const payload = password ? { password } : {};
  const res = await authFetch(`${API_URL}/leads/${leadId}/create-student-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const convertStudentToLead = async (userId, overrides = {}) => {
  const res = await authFetch(`${API_URL}/students/${userId}/convert-to-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrides),
  });
  return res.json();
};
