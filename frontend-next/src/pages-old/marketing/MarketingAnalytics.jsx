'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  IndianRupee,
  Loader2,
  RefreshCcw,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { getCampaigns, getLeads } from '../../services/marketingApi';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value || 0));

const formatPercent = (value) =>
  Number.isFinite(value) ? `${value.toFixed(1)}%` : '0%';

const num = (value) => Number(value || 0);

const parseJson = (value) => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value;
};

const getCampaignLeads = (campaign) =>
  num(campaign.leadsCount || campaign.totalLeads || campaign.leads?.length);

const getCampaignConversions = (campaign) =>
  num(campaign.conversionsCount || campaign.convertedLeads || campaign.studentsCount);

const getSourceName = (lead) =>
  lead.source?.name ||
  lead.sourceName ||
  lead.source ||
  lead.campaignSource ||
  'Unknown';

const isContactedLead = (lead) =>
  Boolean(lead.contactedAt) || lead.status === 'CONTACTED';

const isQualifiedLead = (lead) =>
  Boolean(lead.qualifiedAt) || lead.status === 'QUALIFIED';

const isProposedLead = (lead) =>
  Boolean(lead.proposedAt) || lead.status === 'PROPOSED';

const isConvertedLead = (lead) =>
  Boolean(lead.convertedAt || lead.status === 'CONVERTED');

const isLostLead = (lead) =>
  Boolean(lead.lostAt) || lead.status === 'LOST';

const getMonthLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const calculateAverageResponseTime = (leads) => {
  const responseTimes = leads
    .filter((lead) => lead.createdAt && lead.contactedAt)
    .map((lead) => {
      const created = new Date(lead.createdAt).getTime();
      const contacted = new Date(lead.contactedAt).getTime();
      return contacted - created;
    })
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (responseTimes.length === 0) return 'N/A';

  const avgMs =
    responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length;

  const totalMinutes = Math.round(avgMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function MarketingAnalytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const [campaignRes, leadsRes] = await Promise.all([
        getCampaigns({ page: 1, limit: 1000 }),
        getLeads({ page: 1, limit: 1000 }),
      ]);

      if (!campaignRes?.success || !leadsRes?.success) {
        setError('Failed to load marketing analytics data.');
        return;
      }

      setCampaigns(campaignRes.data?.items || []);
      setLeads(leadsRes.data?.items || []);
    } catch (err) {
      console.error(err);
      setError('Connection error while loading marketing analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const analytics = useMemo(() => {
    const paidCampaigns = campaigns.filter((campaign) => campaign.type !== 'EMAIL');

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(
      (campaign) => campaign.status === 'ACTIVE'
    ).length;

    const totalBudget = paidCampaigns.reduce(
      (sum, campaign) => sum + num(campaign.budget),
      0
    );

    const totalSpent = paidCampaigns.reduce(
      (sum, campaign) => sum + num(campaign.spent),
      0
    );
    const totalRevenue = campaigns.reduce(
      (sum, campaign) => sum + num(campaign.revenueGenerated),
      0
    );
    const marketingRoi =
      totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

    const totalLeads =
      leads.length ||
      campaigns.reduce((sum, campaign) => sum + getCampaignLeads(campaign), 0);

    const contactedLeads = leads.filter(isContactedLead).length;
    const qualifiedLeads = leads.filter(isQualifiedLead).length;
    const proposedLeads = leads.filter(isProposedLead).length;
    const convertedLeads = leads.filter(isConvertedLead).length;
    const lostLeads = leads.filter(isLostLead).length;

    const costPerLead =
      totalSpent > 0 && totalLeads > 0 ? totalSpent / totalLeads : 0;

    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const budgetUsage =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const leadsPerThousand =
      totalSpent > 0 ? (totalLeads / totalSpent) * 1000 : 0;

    const avgResponseTime = calculateAverageResponseTime(leads);

    const sourceMap = {};
    leads.forEach((lead) => {
      const source = getSourceName(lead);

      if (!sourceMap[source]) {
        sourceMap[source] = {
          source,
          leads: 0,
          contacted: 0,
          qualified: 0,
          proposed: 0,
          converted: 0,
          lost: 0,
        };
      }

      sourceMap[source].leads += 1;
      if (isContactedLead(lead)) sourceMap[source].contacted += 1;
      if (isQualifiedLead(lead)) sourceMap[source].qualified += 1;
      if (isProposedLead(lead)) sourceMap[source].proposed += 1;
      if (isConvertedLead(lead)) sourceMap[source].converted += 1;
      if (isLostLead(lead)) sourceMap[source].lost += 1;
    });

    const sourcePerformance = Object.values(sourceMap)
      .map((item) => ({
        ...item,
        percentage: totalLeads > 0 ? (item.leads / totalLeads) * 100 : 0,
        conversionRate: item.leads > 0 ? (item.converted / item.leads) * 100 : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    const campaignPerformance = campaigns
      .map((campaign) => {
        const details = parseJson(campaign.launchDetails);
        const leadsCount = getCampaignLeads(campaign);
        const spent = num(campaign.spent);
        const budget = num(campaign.budget);
        const conversions = getCampaignConversions(campaign);

        return {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          budget,
          spent,
          dailyBudget: num(details.dailyBudget),
          leads: leadsCount,
          conversions,
          revenueGenerated: num(campaign.revenueGenerated),
          costPerLead: spent > 0 && leadsCount > 0 ? spent / leadsCount : 0,
          roi: spent > 0 ? ((num(campaign.revenueGenerated) - spent) / spent) * 100 : 0,
          conversionRate: leadsCount > 0 ? (conversions / leadsCount) * 100 : 0,
        };
      })
      .sort((a, b) => b.leads - a.leads);

    const monthMap = {};
    leads.forEach((lead) => {
      const month = getMonthLabel(lead.createdAt);
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const monthlyTrend = Object.entries(monthMap).map(([month, count]) => ({
      month,
      count,
    }));

    const counsellorMap = {};
    leads.forEach((lead) => {
      const name =
        lead.assignedCounsellor?.fullName ||
        lead.assignedCounsellor?.name ||
        'Unassigned';

      if (!counsellorMap[name]) {
        counsellorMap[name] = {
          name,
          assigned: 0,
          contacted: 0,
          qualified: 0,
          proposed: 0,
          converted: 0,
          lost: 0,
        };
      }

      counsellorMap[name].assigned += 1;

      if (isContactedLead(lead)) counsellorMap[name].contacted += 1;
      if (isQualifiedLead(lead)) counsellorMap[name].qualified += 1;
      if (isProposedLead(lead)) counsellorMap[name].proposed += 1;
      if (isConvertedLead(lead)) counsellorMap[name].converted += 1;
      if (isLostLead(lead)) counsellorMap[name].lost += 1;
    });

    const counsellorPerformance = Object.values(counsellorMap).sort(
      (a, b) => b.assigned - a.assigned
    );

    return {
      totalCampaigns,
      activeCampaigns,
      totalBudget,
      totalSpent,
      totalRevenue,
      marketingRoi,
      totalLeads,
      contactedLeads,
      qualifiedLeads,
      proposedLeads,
      convertedLeads,
      lostLeads,
      costPerLead,
      conversionRate,
      budgetUsage,
      leadsPerThousand,
      avgResponseTime,
      sourcePerformance,
      campaignPerformance,
      monthlyTrend,
      counsellorPerformance,
      funnel: [
        { label: 'Total Leads', value: totalLeads },
        { label: 'Contacted', value: contactedLeads },
        { label: 'Qualified', value: qualifiedLeads },
        { label: 'Proposed / Prospects', value: proposedLeads },
        { label: 'Converted Students', value: convertedLeads },
        { label: 'Lost', value: lostLeads },
      ],
    };
  }, [campaigns, leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-9 w-9 animate-spin text-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[13px] [&_th]:text-xs [&_th]:font-medium [&_td]:text-xs [&_td]:font-normal">
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Revenue Intelligence</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connect marketing investment, campaign efficiency, and attributable revenue.
        </p>
      </section>
      {/* <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div> */}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard title="Total Campaigns" value={formatNumber(analytics.totalCampaigns)} subtitle={`${analytics.activeCampaigns} active campaigns`} icon={<BarChart3 className="h-5 w-5" />} />
        <KpiCard title="Budget Allocated" value={formatCurrency(analytics.totalBudget)} subtitle="Total paid campaign budget" icon={<IndianRupee className="h-5 w-5" />} />
        <KpiCard title="Amount Spent" value={formatCurrency(analytics.totalSpent)} subtitle={`${formatPercent(analytics.budgetUsage)} budget used`} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="Revenue Generated" value={formatCurrency(analytics.totalRevenue)} subtitle="Confirmed campaign-attributed revenue" icon={<IndianRupee className="h-5 w-5" />} />
        <KpiCard title="Marketing ROI" value={formatPercent(analytics.marketingRoi)} subtitle="(Revenue - spend) / spend" icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="Total Leads" value={formatNumber(analytics.totalLeads)} subtitle={`${analytics.contactedLeads} contacted leads`} icon={<Users className="h-5 w-5" />} />
        <KpiCard title="Cost Per Lead" value={formatCurrency(analytics.costPerLead)} subtitle="Spent amount / leads" icon={<Target className="h-5 w-5" />} />
        <KpiCard title="Lead Conversion" value={formatPercent(analytics.conversionRate)} subtitle={`${analytics.convertedLeads} converted students`} icon={<Zap className="h-5 w-5" />} />
        <KpiCard title="Campaign Efficiency" value={analytics.leadsPerThousand.toFixed(1)} subtitle="Leads per ₹1000 spent" icon={<Activity className="h-5 w-5" />} />
        <KpiCard title="Lead Response Time" value={analytics.avgResponseTime} subtitle="Average contactedAt - createdAt" icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel title="Agency Funnel" subtitle="Lead journey through your agency">
          <div className="space-y-4">
            {analytics.funnel.map((item, index) => {
              const max = analytics.funnel[0]?.value || 1;
              const width = max > 0 ? (item.value / max) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{index + 1}. {item.label}</span>
                    <span>{formatNumber(item.value)}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${Math.max(width, item.value > 0 ? 8 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Lead Source Performance" subtitle="Leads coming from various sources" height="h-[430px]">
          <div className="space-y-4">
            {analytics.sourcePerformance.length === 0 ? <EmptyText text="No source data available." /> : analytics.sourcePerformance.slice(0, 8).map((item) => (
              <div key={item.source}>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>{item.source}</span>
                  <span>{formatNumber(item.leads)} leads</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 font-normal mt-1">
                  {formatPercent(item.percentage)} of total leads · {formatPercent(item.conversionRate)} converted
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Monthly Lead Trend" subtitle="Leads generated month wise" height="h-[430px]">
          <div className="space-y-4">
            {analytics.monthlyTrend.length === 0 ? <EmptyText text="No monthly trend data available." /> : analytics.monthlyTrend.map((item) => {
              const max = Math.max(...analytics.monthlyTrend.map((month) => month.count), 1);
              const width = (item.count / max) * 100;
              return (
                <div key={item.month}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{item.month}</span>
                    <span>{formatNumber(item.count)}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>



      <Panel title="Campaign Financial Performance" subtitle="Spend, attributable revenue, ROI, and efficiency by campaign">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-black">Campaign</th>
                <th className="px-5 py-3 font-black text-right">Spend</th>
                <th className="px-5 py-3 font-black text-right">Revenue</th>
                <th className="px-5 py-3 font-black text-right">ROI</th>
                <th className="px-5 py-3 font-black text-right">Leads</th>
                <th className="px-5 py-3 font-black text-right">Cost / Lead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.campaignPerformance.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-400 font-bold">No campaign financial data found.</td></tr>
              ) : analytics.campaignPerformance.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-black text-slate-900">{campaign.name}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatCurrency(campaign.spent)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatCurrency(campaign.revenueGenerated)}</td>
                  <td className="px-5 py-4 text-right font-black text-brand">{formatPercent(campaign.roi)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatNumber(campaign.leads)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatCurrency(campaign.costPerLead)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Lead Source Details" subtitle="Detailed source-wise lead breakdown" height="h-[430px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-black">Source</th>
                <th className="px-5 py-3 font-black text-right">Total Leads</th>
                <th className="px-5 py-3 font-black text-right">Contacted</th>
                <th className="px-5 py-3 font-black text-right">Qualified</th>
                <th className="px-5 py-3 font-black text-right">Proposed</th>
                <th className="px-5 py-3 font-black text-right">Converted</th>
                <th className="px-5 py-3 font-black text-right">Lost</th>
                <th className="px-5 py-3 font-black text-right">Share</th>
                <th className="px-5 py-3 font-black text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.sourcePerformance.length === 0 ? (
                <tr><td colSpan="9" className="px-5 py-10 text-center text-slate-400 font-bold">No lead source data found.</td></tr>
              ) : analytics.sourcePerformance.map((source) => (
                <tr key={source.source} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-black text-slate-900">{source.source}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatNumber(source.leads)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatNumber(source.contacted)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatNumber(source.qualified)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatNumber(source.proposed)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatNumber(source.converted)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatNumber(source.lost)}</td>
                  <td className="px-5 py-4 text-right font-bold">{formatPercent(source.percentage)}</td>
                  <td className="px-5 py-4 text-right font-black text-brand">{formatPercent(source.conversionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Counsellor Performance" subtitle="Assigned, contacted, qualified, proposed, converted and lost progress">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-black">Counsellor</th>
                <th className="px-5 py-3 font-black text-right">Assigned</th>
                <th className="px-5 py-3 font-black text-right">Contacted</th>
                <th className="px-5 py-3 font-black text-right">Qualified</th>
                <th className="px-5 py-3 font-black text-right">Proposed</th>
                <th className="px-5 py-3 font-black text-right">Converted</th>
                <th className="px-5 py-3 font-black text-right">Lost</th>
                <th className="px-5 py-3 font-black text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.counsellorPerformance.length === 0 ? (
                <tr><td colSpan="8" className="px-5 py-10 text-center text-slate-400 font-bold">No counsellor data found.</td></tr>
              ) : analytics.counsellorPerformance.map((counsellor) => {
                const conversion = counsellor.assigned > 0 ? (counsellor.converted / counsellor.assigned) * 100 : 0;
                return (
                  <tr key={counsellor.name} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-black text-slate-900">{counsellor.name}</td>
                    <td className="px-5 py-4 text-right font-bold">{formatNumber(counsellor.assigned)}</td>
                    <td className="px-5 py-4 text-right font-bold">{formatNumber(counsellor.contacted)}</td>
                    <td className="px-5 py-4 text-right font-bold">{formatNumber(counsellor.qualified)}</td>
                    <td className="px-5 py-4 text-right font-bold">{formatNumber(counsellor.proposed)}</td>
                    <td className="px-5 py-4 text-right font-bold">{formatNumber(counsellor.converted)}</td>
                    <td className="px-5 py-4 text-right font-bold">{formatNumber(counsellor.lost)}</td>
                    <td className="px-5 py-4 text-right font-black text-brand">{formatPercent(conversion)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon }) {
  return (
    <div className="app-glass-card rounded-2xl p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <h2 className="text-2xl font-semibold text-slate-900 mt-2">{value}</h2>
          <p className="text-[11px] font-normal text-slate-400 mt-2">{subtitle}</p>
        </div>
        <div className="app-gradient-icon">
          {icon}
        </div>
      </div>
    </div>
  );
}

// function Panel({ title, subtitle, children }) {
//   return (
//     <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
//       <div className="px-5 py-4 border-b border-slate-100">
//         <h2 className="text-lg font-black text-slate-900">{title}</h2>
//         <p className="text-xs font-bold text-slate-400 mt-0.5">{subtitle}</p>
//       </div>
//       <div className="p-5">{children}</div>
//     </div>
//   );
// }

function Panel({
  title,
  subtitle,
  children,
  height = "h-[430px]",
}) {
  return (
    <div
      className={`app-glass-card rounded-2xl overflow-hidden flex flex-col ${height}`}
    >
      <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-[11px] font-normal text-slate-400 mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {children}
      </div>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div className="py-10 text-center text-xs font-normal text-slate-400">
      {text}
    </div>
  );
}
