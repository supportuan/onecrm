
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  ChevronDown,
  FileText,
  GraduationCap,
  Loader2,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Upload,
  Users,
} from 'lucide-react';

import { getCampaigns, getLeads } from '../../services/marketingApi';
import { useLeadBulkUpload } from '../../hooks/useLeadBulkUpload';

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Quarterly', value: 'quarter' },
  { label: 'Half Yearly', value: 'halfyear' },
  { label: 'Annually', value: 'year' },
  { label: 'All Time', value: 'all' },
];

const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value || 0));

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

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

const isToday = (dateValue) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const getSourceName = (lead) =>
  lead.source?.name || lead.sourceName || lead.source || 'Unknown';

const getCampaignLeads = (campaign) =>
  Number(
    campaign.leadsCount ||
    campaign.totalLeads ||
    campaign.leads?.length ||
    0
  );

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const MarketingDashboard = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [dateFilter, setDateFilter] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [leadRes, campaignRes] = await Promise.all([
        getLeads({
          page: 1,
          limit: 1000,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        getCampaigns({
          page: 1,
          limit: 1000,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ]);

      if (!leadRes?.success || !campaignRes?.success) {
        setError('Failed to load marketing dashboard.');
        return;
      }

      setLeads(leadRes.data?.items || []);
      setCampaigns(campaignRes.data?.items || []);
    } catch (err) {
      console.error(err);
      setError('Connection error while loading marketing dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const { uploadingLeads, handleBulkUpload } =
    useLeadBulkUpload(fetchDashboard);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const dashboard = useMemo(() => {
    const filteredLeads = leads.filter((lead) =>
      isWithinDateFilter(lead.createdAt, dateFilter)
    );

    const filteredCampaigns = campaigns.filter((campaign) =>
      isWithinDateFilter(campaign.createdAt || campaign.startDate, dateFilter)
    );

    const totalLeads = filteredLeads.length;

    const newLeadsToday = filteredLeads.filter((lead) =>
      isToday(lead.createdAt)
    ).length;

    const pendingFollowUps = filteredLeads.filter(
      (lead) =>
        ['NEW', 'NOT_CONTACTED', 'CALLBACK', 'FOLLOW_UP'].includes(lead.status)
    ).length;

    const activeCampaigns = filteredCampaigns.filter(
      (campaign) => campaign.status === 'ACTIVE'
    ).length;

    const contacted = filteredLeads.filter((lead) => lead.status === 'CONTACTED').length;
    const newLeads = filteredLeads.filter((lead) => lead.status === 'NEW').length;
    const notContacted = filteredLeads.filter((lead) => lead.status === 'NOT_CONTACTED').length;
    const callbacks = filteredLeads.filter((lead) => lead.status === 'CALLBACK').length;
    const followUps = filteredLeads.filter((lead) => lead.status === 'FOLLOW_UP').length;
    const paidCampaigns = filteredCampaigns.filter(
      (campaign) => campaign.type !== 'EMAIL'
    );

    const totalBudget = paidCampaigns.reduce(
      (sum, campaign) => sum + Number(campaign.budget || 0),
      0
    );

    const totalSpent = paidCampaigns.reduce(
      (sum, campaign) => sum + Number(campaign.spent || 0),
      0
    );

    const sourceMap = {};

    filteredLeads.forEach((lead) => {
      const source = getSourceName(lead);
      sourceMap[source] = (sourceMap[source] || 0) + 1;
    });

    const sources = Object.entries(sourceMap)
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const recentLeads = filteredLeads.slice(0, 8);

    const recentCampaigns = filteredCampaigns
      .slice()
      .sort((a, b) => getCampaignLeads(b) - getCampaignLeads(a))
      .slice(0, 6);

    return {
      totalLeads,
      newLeadsToday,
      pendingFollowUps,
      activeCampaigns,
      contacted,
      newLeads,
      notContacted,
      callbacks,
      followUps,
      totalBudget,
      totalSpent,
      sources,
      recentLeads,
      recentCampaigns,
    };
  }, [leads, campaigns, dateFilter]);

  if (loading) {
    return (
      <div className="p-4 space-y-8 animate-pulse ui-page">
        <div className="flex items-center justify-between">
          <div className="h-10 w-72 rounded-xl bg-slate-200" />
          <div className="h-10 w-28 rounded-xl bg-slate-200" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 rounded-[20px] border border-neutral-100 bg-slate-200"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="h-[420px] bg-slate-200 rounded-[20px]" />
          <div className="h-[420px] bg-slate-200 rounded-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="text-neutral-800 antialiased ">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleBulkUpload}
        className="hidden"
      />

      <div className="ui-container space-y-6">
        <div className="app-glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-11 appearance-none rounded-xl border border-neutral-200 bg-white pl-4 pr-10 text-sm font-bold text-neutral-700 outline-none hover:bg-neutral-50 cursor-pointer"
              >
                {DATE_FILTERS.map((item) => (
                  <option key={item.value} value={item.value}  >
                    {item.label}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <button
            onClick={fetchDashboard}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 cursor-pointer" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Leads"
            value={formatNumber(dashboard.totalLeads)}
            trend="Marketing leads in selected period"
            icon={<Users className="h-5 w-5" />}
            iconClass="bg-sky-50 text-sky-600"
          />

          <KpiCard
            title="New Leads Today"
            value={formatNumber(dashboard.newLeadsToday)}
            trend="Created today"
            icon={<Plus className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <KpiCard
            title="Pending Follow-ups"
            value={formatNumber(dashboard.pendingFollowUps)}
            trend="Not contacted yet"
            icon={<CalendarClock className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-600"
          />

          <KpiCard
            title="Active Campaigns"
            value={formatNumber(dashboard.activeCampaigns)}
            trend="Campaigns in selected period"
            icon={<Megaphone className="h-5 w-5" />}
            iconClass="bg-rose-50 text-rose-600"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <Panel
            title="Touchpoints"
            subtitle="Suggests measurable progress along the journey"
            height="h-[420px]"
          >
            <JourneyBar label="Total Leads" value={dashboard.totalLeads} total={dashboard.totalLeads} />
            <JourneyBar label="New" value={dashboard.newLeads} total={dashboard.totalLeads} />
            <JourneyBar label="Contacted" value={dashboard.contacted} total={dashboard.totalLeads} />
            <JourneyBar label="Not Contacted" value={dashboard.notContacted} total={dashboard.totalLeads} />
            <JourneyBar label="Callback" value={dashboard.callbacks} total={dashboard.totalLeads} />
            <JourneyBar label="Follow-up" value={dashboard.followUps} total={dashboard.totalLeads} />

            <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <InfoRow label="Budget Allocated" value={formatCurrency(dashboard.totalBudget)} />
              <div className="mt-3">
                <InfoRow label="Amount Spent" value={formatCurrency(dashboard.totalSpent)} />
              </div>
            </div>
          </Panel>

          <div className="app-glass-card flex h-[420px] flex-col justify-between rounded-2xl p-6">
            <div>
              <h2 className="text-[17px] font-extrabold text-brand">
                Quick Actions
              </h2>
              <p className="mt-1 text-[12px] font-medium text-neutral-500">
                Centralised shortcuts for immediate tasks
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                

                <QuickButton
                  title="Leads"
                  icon={<FileText className="mb-1.5 h-5 w-5" />}
                  className="border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text-secondary)] hover:border-brand/60 hover:bg-brand-soft hover:text-brand"
                  onClick={() => router.push('/marketing/lead-management')}
                />

                <QuickButton
                  title="Campaigns"
                  icon={<Send className="mb-1.5 h-5 w-5" />}
                  className="border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text-secondary)] hover:border-brand/60 hover:bg-brand-soft hover:text-brand"
                  onClick={() => router.push('/marketing/campaigns')}
                />


                <QuickButton
                  title={uploadingLeads ? 'Uploading...' : 'Upload'}
                  icon={
                    uploadingLeads ? (
                      <Loader2 className="mb-1.5 h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="mb-1.5 h-5 w-5" />
                    )
                  }
                  className="border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text-secondary)] hover:border-brand/60 hover:bg-brand-soft hover:text-brand"
                  disabled={uploadingLeads}
                  onClick={() => fileInputRef.current?.click()}
                />

                <QuickButton
                  title="Revenue Intelligence"
                  icon={<MessageSquare className="mb-1.5 h-5 w-5" />}
                  className="border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text-secondary)] hover:border-brand/60 hover:bg-brand-soft hover:text-brand"
                  onClick={() => router.push('/marketing/marketing-analytics')}
                />
              </div>
            </div>

            <div className="mt-5 border-t border-neutral-100 pt-4">
              <div className="rounded-xl bg-neutral-50 p-3 text-[11px] font-medium leading-relaxed text-neutral-500">
                <strong>Tip:</strong> Upload Excel or CSV files directly from here.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel
            title="Source Analytics Breakdown"
            subtitle="Highlighting the leads flow from different channels"
            height="h-[420px]"
          >
            {dashboard.sources.length === 0 ? (
              <EmptyText text="No lead source data available." />
            ) : (
              dashboard.sources.map((item) => (
                <JourneyBar
                  key={item.source}
                  label={item.source}
                  value={item.count}
                  total={dashboard.totalLeads}
                  helper={`${item.percentage.toFixed(1)}% of total leads`}
                />
              ))
            )}
          </Panel>

          <Panel
            title="Latest Records"
            subtitle="Suggesting recently added leads data"
            height="h-[420px]"
          >
            {dashboard.recentLeads.length === 0 ? (
              <EmptyText text="No recent leads found." />
            ) : (
              <div className="space-y-3">
                {dashboard.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="app-gradient-icon text-xs font-extrabold">
                        {getInitials(lead.fullName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-brand">
                          {lead.fullName}
                        </p>
                        <p className="truncate text-xs font-semibold text-neutral-500">
                          {lead.email || lead.phone || 'No contact'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-neutral-500">
                        {getSourceName(lead)}
                      </p>
                      <p className="mt-1 text-[11px] font-extrabold text-neutral-700">
                        {lead.status || 'NEW'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

function KpiCard({ title, value, trend, icon, iconClass = 'bg-brand-soft text-brand' }) {
  return (
    <div className="app-glass-card group relative overflow-hidden rounded-2xl p-6 transition-all duration-300">
      <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-neutral-50 opacity-80 transition-transform duration-300 group-hover:scale-110" />

      <div className="relative flex items-center justify-between">
        <span className="text-[13px] font-bold tracking-normal text-neutral-500">
          {title}
        </span>

        <div
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <div className="relative mt-4">
        <h3 className="text-[28px] font-extrabold tracking-tight text-brand">
          {value}
        </h3>

        <div className="mt-3 flex items-center gap-1 text-[13px] font-medium text-[var(--ui-text-muted)]">
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, height = 'h-auto' }) {
  return (
    <div
      className={`app-glass-card flex flex-col overflow-hidden rounded-2xl ${height}`}
    >
      <div className="flex-shrink-0 border-b border-neutral-100 p-6">
        <h2 className="text-[17px] font-extrabold text-brand">
          {title}
        </h2>
        <p className="mt-1 text-[12px] font-medium text-neutral-500">
          {subtitle}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}

function JourneyBar({ label, value, total, helper }) {
  const width =
    total > 0
      ? Math.max((Number(value || 0) / total) * 100, value > 0 ? 8 : 0)
      : 0;

  return (
    <div className="mb-5 space-y-1.5">
      <div className="flex justify-between text-xs font-bold text-neutral-500">
        <span>{label}</span>
        <span className="font-extrabold text-brand">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>

      {helper && (
        <p className="text-[11px] font-semibold text-neutral-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function QuickButton({ title, icon, className, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[92px] flex-col items-center justify-center rounded-[14px] p-4 text-xs font-semibold shadow-sm transition duration-200 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <span className="app-gradient-icon mb-2">{icon}</span>
      <span className="text-[10px] font-bold leading-tight sm:text-xs">
        {title}
      </span>
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-bold text-neutral-500">{label}</span>
      <span className="font-extrabold text-brand">{value}</span>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div className="flex h-full items-center justify-center text-sm font-bold text-neutral-400">
      {text}
    </div>
  );
}

export default MarketingDashboard;