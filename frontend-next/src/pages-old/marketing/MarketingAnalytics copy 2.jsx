// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import {
//   TrendingUp,
//   Users,
//   Clock,
//   IndianRupee,
//   Target,
//   Megaphone,
//   Loader2,
//   AlertCircle,
//   ArrowUpRight,
// } from 'lucide-react';
// import { getCampaigns, getLeads } from '../../services/marketingApi';

// const formatCurrency = (val) => {
//   if (!val) return '₹0';
//   return new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0,
//   }).format(Number(val));
// };

// const formatPercent = (val) => {
//   if (!Number.isFinite(val)) return '0.0%';
//   return `${val.toFixed(1)}%`;
// };

// const getDaysAgo = (date) => {
//   const d = new Date(date);
//   const now = new Date();
//   return Math.floor((now - d) / (1000 * 60 * 60 * 24));
// };

// const getSourceName = (lead) => {
//   return lead.source?.name || lead.source || 'Unknown';
// };

// const isProspectLead = (lead) => {
//   return (
//     lead.status === 'PROSPECT' ||
//     lead.leadStatus === 'PROSPECT' ||
//     lead.isProspect === true ||
//     lead.studentUserId ||
//     lead.isStudentLoginCreated === true
//   );
// };

// const MarketingAnalytics = () => {
//   const [campaigns, setCampaigns] = useState([]);
//   const [leads, setLeads] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const fetchAnalytics = async () => {
//     setLoading(true);
//     setError('');

//     try {
//       const [campaignRes, leadsRes] = await Promise.all([
//         getCampaigns({ page: 1, limit: 1000 }),
//         getLeads({ page: 1, limit: 1000 }),
//       ]);

//       if (!campaignRes.success || !leadsRes.success) {
//         setError('Failed to load marketing analytics data.');
//         return;
//       }

//       setCampaigns(campaignRes.data?.items || []);
//       setLeads(leadsRes.data?.items || []);
//     } catch (err) {
//       console.error(err);
//       setError('Connection error while loading marketing analytics.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAnalytics();
//   }, []);

//   const analytics = useMemo(() => {
//     const paidCampaigns = campaigns.filter((c) => c.type !== 'EMAIL');

//     const totalBudget = paidCampaigns.reduce(
//       (sum, c) => sum + Number(c.budget || 0),
//       0
//     );

//     const totalSpent = paidCampaigns.reduce(
//       (sum, c) => sum + Number(c.spent || 0),
//       0
//     );

//     const totalRevenue = campaigns.reduce(
//       (sum, c) => sum + Number(c.revenue || 0),
//       0
//     );

//     const roi =
//       totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

//     const totalLeads = leads.length;
//     const prospects = leads.filter(isProspectLead).length;

//     const conversionRate =
//       totalLeads > 0 ? (prospects / totalLeads) * 100 : 0;

//     const hotLeads = leads.filter((l) => l.rating === 'HOT').length;
//     const warmLeads = leads.filter((l) => l.rating === 'WARM').length;
//     const coldLeads = leads.filter((l) => l.rating === 'COLD').length;

//     const last30DaysLeads = leads.filter(
//       (l) => l.createdAt && getDaysAgo(l.createdAt) <= 30
//     ).length;

//     const sourceMap = {};
//     leads.forEach((lead) => {
//       const source = getSourceName(lead);
//       if (!sourceMap[source]) {
//         sourceMap[source] = {
//           source,
//           leads: 0,
//           prospects: 0,
//           hot: 0,
//         };
//       }

//       sourceMap[source].leads += 1;
//       if (isProspectLead(lead)) sourceMap[source].prospects += 1;
//       if (lead.rating === 'HOT') sourceMap[source].hot += 1;
//     });

//     const sourceRows = Object.values(sourceMap)
//       .map((item) => ({
//         ...item,
//         conversion:
//           item.leads > 0 ? (item.prospects / item.leads) * 100 : 0,
//       }))
//       .sort((a, b) => b.leads - a.leads);

//     const campaignRows = campaigns.map((c) => {
//       const spent = Number(c.spent || 0);
//       const revenue = Number(c.revenue || 0);
//       const campaignRoi =
//         spent > 0 ? ((revenue - spent) / spent) * 100 : 0;

//       return {
//         name: c.name,
//         type: c.type,
//         budget: Number(c.budget || 0),
//         spent,
//         revenue,
//         roi: campaignRoi,
//         leads: c.leadsCount || 0,
//       };
//     });

//     return {
//       totalBudget,
//       totalSpent,
//       totalRevenue,
//       roi,
//       totalLeads,
//       prospects,
//       conversionRate,
//       hotLeads,
//       warmLeads,
//       coldLeads,
//       last30DaysLeads,
//       sourceRows,
//       campaignRows,
//       avgResponseTime: 'Pending',
//     };
//   }, [campaigns, leads]);

//   const chartData = analytics.sourceRows.slice(0, 6);
//   const maxChartValue = Math.max(...chartData.map((x) => x.leads), 1);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-32">
//         <Loader2 className="h-9 w-9 animate-spin text-[#1a2b4c]" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
//       <div>
//         <h1 className="text-3xl font-bold text-slate-900">
//           Marketing Analytics
//         </h1>
//         <p className="text-sm text-slate-500 font-semibold mt-1">
//           Campaign ROI, lead to prospect conversion rate, source performance,
//           and response analytics.
//         </p>
//       </div>

//       {error && (
//         <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
//           <AlertCircle className="h-5 w-5" />
//           {error}
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
//         <MetricCard
//           title="Campaign ROI"
//           value={formatPercent(analytics.roi)}
//           subtitle={`Spent ${formatCurrency(analytics.totalSpent)}`}
//           icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
//           bg="bg-emerald-50"
//         />

//         <MetricCard
//           title="Lead to Prospect Rate"
//           value={formatPercent(analytics.conversionRate)}
//           subtitle={`${analytics.prospects} prospects from ${analytics.totalLeads} leads`}
//           icon={<Users className="h-6 w-6 text-blue-600" />}
//           bg="bg-blue-50"
//         />

//         <MetricCard
//           title="Lead Response Time"
//           value={analytics.avgResponseTime}
//           subtitle="Needs first activity timestamp"
//           icon={<Clock className="h-6 w-6 text-orange-600" />}
//           bg="bg-orange-50"
//         />

//         <MetricCard
//           title="Total Ad Budget"
//           value={formatCurrency(analytics.totalBudget)}
//           subtitle={`Revenue ${formatCurrency(analytics.totalRevenue)}`}
//           icon={<IndianRupee className="h-6 w-6 text-purple-600" />}
//           bg="bg-purple-50"
//         />
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
//           <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
//             <div>
//               <h2 className="text-lg font-bold text-slate-900">
//                 Key Marketing Metrics
//               </h2>
//               <p className="text-xs text-slate-400 font-semibold">
//                 Last 30 days and current CRM data
//               </p>
//             </div>
//             <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50">
//               View All ›
//             </button>
//           </div>

//           <table className="w-full text-sm">
//             <thead className="bg-slate-50 text-slate-500">
//               <tr>
//                 <th className="text-left px-6 py-3">Metric</th>
//                 <th className="text-right px-6 py-3">Value</th>
//                 <th className="text-right px-6 py-3">Trend</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100 font-semibold">
//               <MetricRow label="Total Leads" value={analytics.totalLeads} trend="Live" />
//               <MetricRow label="Leads in Last 30 Days" value={analytics.last30DaysLeads} trend="+ Active" />
//               <MetricRow label="Hot Leads" value={analytics.hotLeads} trend="High" />
//               <MetricRow label="Warm Leads" value={analytics.warmLeads} trend="Medium" />
//               <MetricRow label="Cold Leads" value={analytics.coldLeads} trend="Low" />
//               <MetricRow label="Prospects Converted" value={analytics.prospects} trend={formatPercent(analytics.conversionRate)} />
//             </tbody>
//           </table>
//         </div>

//         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
//           <h2 className="text-lg font-bold text-slate-900">
//             Marketing Performance Overview
//           </h2>
//           <p className="text-xs text-slate-400 font-semibold mt-1">
//             Leads by source
//           </p>

//           <div className="mt-8 space-y-5">
//             {chartData.length === 0 ? (
//               <div className="text-center text-slate-400 font-semibold py-20">
//                 No source data available
//               </div>
//             ) : (
//               chartData.map((item) => (
//                 <div key={item.source}>
//                   <div className="flex justify-between text-sm font-semibold mb-1">
//                     <span className="text-slate-700">{item.source}</span>
//                     <span className="text-slate-500">{item.leads}</span>
//                   </div>
//                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-[#1a2b4c] rounded-full"
//                       style={{
//                         width: `${(item.leads / maxChartValue) * 100}%`,
//                       }}
//                     />
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
//           <h2 className="text-lg font-bold text-slate-900">
//             Agency Funnel
//           </h2>

//           <div className="mt-6 space-y-4">
//             <FunnelBar label="Total Leads" value={analytics.totalLeads} width="100%" color="bg-blue-600" />
//             <FunnelBar label="Hot Leads" value={analytics.hotLeads} width={`${analytics.totalLeads ? (analytics.hotLeads / analytics.totalLeads) * 100 : 0}%`} color="bg-rose-500" />
//             <FunnelBar label="Prospects" value={analytics.prospects} width={`${analytics.totalLeads ? (analytics.prospects / analytics.totalLeads) * 100 : 0}%`} color="bg-emerald-600" />
//           </div>
//         </div>

//         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
//           <div className="px-6 py-4 border-b border-slate-100">
//             <h2 className="text-lg font-bold text-slate-900">
//               Source Performance
//             </h2>
//           </div>

//           <table className="w-full text-sm">
//             <thead className="bg-slate-50 text-slate-500">
//               <tr>
//                 <th className="text-left px-5 py-3">Source</th>
//                 <th className="text-right px-5 py-3">Leads</th>
//                 <th className="text-right px-5 py-3">Prospects</th>
//                 <th className="text-right px-5 py-3">Conv.</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100 font-semibold">
//               {analytics.sourceRows.slice(0, 7).map((row) => (
//                 <tr key={row.source}>
//                   <td className="px-5 py-3 text-slate-800">{row.source}</td>
//                   <td className="px-5 py-3 text-right">{row.leads}</td>
//                   <td className="px-5 py-3 text-right">{row.prospects}</td>
//                   <td className="px-5 py-3 text-right text-emerald-600">
//                     {formatPercent(row.conversion)}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
//         <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
//           <Megaphone className="h-5 w-5 text-slate-600" />
//           <h2 className="text-lg font-bold text-slate-900">
//             Campaign ROI Breakdown
//           </h2>
//         </div>

//         <table className="w-full text-sm">
//           <thead className="bg-slate-50 text-slate-500">
//             <tr>
//               <th className="text-left px-5 py-3">Campaign</th>
//               <th className="text-left px-5 py-3">Type</th>
//               <th className="text-right px-5 py-3">Budget</th>
//               <th className="text-right px-5 py-3">Spent</th>
//               <th className="text-right px-5 py-3">Revenue</th>
//               <th className="text-right px-5 py-3">ROI</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100 font-semibold">
//             {analytics.campaignRows.length === 0 ? (
//               <tr>
//                 <td colSpan="6" className="text-center py-10 text-slate-400">
//                   No campaigns found
//                 </td>
//               </tr>
//             ) : (
//               analytics.campaignRows.map((c, index) => (
//                 <tr key={`${c.name}-${index}`}>
//                   <td className="px-5 py-3 text-slate-800">{c.name}</td>
//                   <td className="px-5 py-3 text-slate-500">{c.type}</td>
//                   <td className="px-5 py-3 text-right">{c.type === 'EMAIL' ? 'N/A' : formatCurrency(c.budget)}</td>
//                   <td className="px-5 py-3 text-right">{c.type === 'EMAIL' ? 'N/A' : formatCurrency(c.spent)}</td>
//                   <td className="px-5 py-3 text-right">{formatCurrency(c.revenue)}</td>
//                   <td className={`px-5 py-3 text-right ${c.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
//                     {c.type === 'EMAIL' ? 'N/A' : formatPercent(c.roi)}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// const MetricCard = ({ title, value, subtitle, icon, bg }) => (
//   <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
//     <div className="flex items-center justify-between">
//       <div>
//         <p className="text-sm font-bold text-slate-500">{title}</p>
//         <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
//           {value}
//         </h2>
//       </div>
//       <div className={`h-14 w-14 rounded-2xl ${bg} flex items-center justify-center`}>
//         {icon}
//       </div>
//     </div>
//     <p className="text-sm text-slate-500 font-semibold mt-4">{subtitle}</p>
//   </div>
// );

// const MetricRow = ({ label, value, trend }) => (
//   <tr>
//     <td className="px-6 py-3 text-slate-700">{label}</td>
//     <td className="px-6 py-3 text-right text-slate-900">{value}</td>
//     <td className="px-6 py-3 text-right text-emerald-600">{trend}</td>
//   </tr>
// );

// const FunnelBar = ({ label, value, width, color }) => (
//   <div>
//     <div className="flex justify-between text-sm font-semibold mb-1">
//       <span className="text-slate-700">{label}</span>
//       <span className="text-slate-500">{value}</span>
//     </div>
//     <div className="h-10 bg-slate-100 rounded-xl overflow-hidden">
//       <div
//         className={`h-full ${color} rounded-xl flex items-center justify-end pr-4 text-white text-sm font-bold`}
//         style={{ width }}
//       >
//         {value}
//       </div>
//     </div>
//   </div>
// );

// export default MarketingAnalytics;


'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  Loader2,
  AlertCircle,
  IndianRupee,
  Target,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { getCampaigns, getLeads } from '../../services/marketingApi';

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));
};

const formatNumber = (val) => {
  return new Intl.NumberFormat('en-IN').format(Number(val || 0));
};

const formatPercent = (val) => {
  if (!Number.isFinite(val)) return '0%';
  return `${val.toFixed(1)}%`;
};

const safeNumber = (value) => Number(value || 0);

const getCampaignLeads = (campaign) => {
  return Number(
    campaign.leadsCount ||
    campaign.totalLeads ||
    campaign.leads?.length ||
    0
  );
};

const getConvertedLeads = (campaign) => {
  return Number(
    campaign.conversionsCount ||
    campaign.convertedLeads ||
    campaign.studentsCount ||
    0
  );
};

const getSourceName = (lead) => {
  return lead.source?.name || lead.sourceName || lead.source || 'Unknown';
};

const getLeadConverted = (lead) => {
  return (
    lead.status === 'PROSPECT' ||
    lead.leadStatus === 'PROSPECT' ||
    lead.isProspect === true ||
    lead.studentUserId ||
    lead.isStudentLoginCreated
  );
};

const MarketingAnalytics = () => {
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

      if (!campaignRes.success || !leadsRes.success) {
        setError('Failed to load marketing analytics.');
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
    const paidCampaigns = campaigns.filter((c) => c.type !== 'EMAIL');

    const totalCampaigns = campaigns.length;

    const totalBudget = paidCampaigns.reduce(
      (sum, c) => sum + safeNumber(c.budget),
      0
    );

    const totalSpent = paidCampaigns.reduce(
      (sum, c) => sum + safeNumber(c.spent),
      0
    );

    const totalLeads =
      leads.length ||
      campaigns.reduce((sum, c) => sum + getCampaignLeads(c), 0);

    const convertedLeads = leads.filter(getLeadConverted).length;

    const costPerLead =
      totalLeads > 0 && totalSpent > 0 ? totalSpent / totalLeads : 0;

    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const budgetUsedPercent =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const leadsPerThousand =
      totalSpent > 0 ? (totalLeads / totalSpent) * 1000 : 0;

    const sourceMap = {};

    leads.forEach((lead) => {
      const source = getSourceName(lead);

      if (!sourceMap[source]) {
        sourceMap[source] = {
          source,
          leads: 0,
          converted: 0,
        };
      }

      sourceMap[source].leads += 1;

      if (getLeadConverted(lead)) {
        sourceMap[source].converted += 1;
      }
    });

    const sourcePerformance = Object.values(sourceMap)
      .map((item) => ({
        ...item,
        conversionRate:
          item.leads > 0 ? (item.converted / item.leads) * 100 : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    const campaignPerformance = campaigns.map((campaign) => {
      const leadsCount = getCampaignLeads(campaign);
      const spent = safeNumber(campaign.spent);
      const budget = safeNumber(campaign.budget);
      const conversions = getConvertedLeads(campaign);

      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        budget,
        spent,
        leads: leadsCount,
        conversions,
        costPerLead:
          leadsCount > 0 && spent > 0 ? spent / leadsCount : 0,
        conversionRate:
          leadsCount > 0 ? (conversions / leadsCount) * 100 : 0,
      };
    });

    return {
      totalCampaigns,
      totalBudget,
      totalSpent,
      totalLeads,
      convertedLeads,
      costPerLead,
      conversionRate,
      budgetUsedPercent,
      leadsPerThousand,
      sourcePerformance,
      campaignPerformance,
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
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Marketing Analytics
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Track campaigns, leads, cost per lead, conversion rate and source performance.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KpiCard
          title="Total Budget"
          value={formatCurrency(analytics.totalBudget)}
          subtitle="Paid campaign budget"
          icon={<IndianRupee className="h-6 w-6 text-emerald-600" />}
          bg="bg-emerald-50"
        />

        <KpiCard
          title="Total Spent"
          value={formatCurrency(analytics.totalSpent)}
          subtitle={`${formatPercent(analytics.budgetUsedPercent)} budget used`}
          icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
          bg="bg-blue-50"
        />

        <KpiCard
          title="Total Leads"
          value={formatNumber(analytics.totalLeads)}
          subtitle={`${analytics.totalCampaigns} campaigns`}
          icon={<Users className="h-6 w-6 text-purple-600" />}
          bg="bg-purple-50"
        />

        <KpiCard
          title="Cost Per Lead"
          value={formatCurrency(analytics.costPerLead)}
          subtitle={`${analytics.leadsPerThousand.toFixed(1)} leads / ₹1000`}
          icon={<Target className="h-6 w-6 text-orange-600" />}
          bg="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KpiCard
          title="Lead to Prospect Conversion"
          value={formatPercent(analytics.conversionRate)}
          subtitle={`${analytics.convertedLeads} converted from ${analytics.totalLeads} leads`}
          icon={<BarChart3 className="h-6 w-6 text-sky-600" />}
          bg="bg-sky-50"
        />

        <KpiCard
          title="Campaign Efficiency"
          value={`${analytics.leadsPerThousand.toFixed(1)}`}
          subtitle="Leads generated per ₹1000 spent"
          icon={<Activity className="h-6 w-6 text-green-600" />}
          bg="bg-green-50"
        />

        
       
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Key Marketing Metrics
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                Based on current CRM data
              </p>
            </div>
            <PieChart className="h-5 w-5 text-slate-400" />
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Metric</th>
                <th className="text-right px-5 py-3 font-bold">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <MetricRow label="Total Campaigns" value={analytics.totalCampaigns} />
              <MetricRow label="Total Budget" value={formatCurrency(analytics.totalBudget)} />
              <MetricRow label="Total Spent" value={formatCurrency(analytics.totalSpent)} />
              <MetricRow label="Total Leads" value={formatNumber(analytics.totalLeads)} />
              <MetricRow label="Converted Prospects" value={formatNumber(analytics.convertedLeads)} />
              <MetricRow label="Lead Conversion Rate" value={formatPercent(analytics.conversionRate)} />
              <MetricRow label="Cost Per Lead" value={formatCurrency(analytics.costPerLead)} />
              <MetricRow label="Leads Per ₹1000" value={analytics.leadsPerThousand.toFixed(1)} />
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Lead Source Performance
            </h2>
            <p className="text-xs text-slate-400 font-semibold">
              Which source is generating more leads
            </p>
          </div>

          <div className="p-5 space-y-4">
            {analytics.sourcePerformance.length === 0 ? (
              <p className="text-sm text-slate-400 font-semibold">
                No source data available.
              </p>
            ) : (
              analytics.sourcePerformance.slice(0, 8).map((item) => {
                const percent =
                  analytics.totalLeads > 0
                    ? (item.leads / analytics.totalLeads) * 100
                    : 0;

                return (
                  <div key={item.source}>
                    <div className="flex justify-between text-sm font-semibold text-slate-700 mb-1">
                      <span>{item.source}</span>
                      <span>{item.leads} leads</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-1">
                      {formatPercent(item.conversionRate)} conversion
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Campaign Performance
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Budget, spent, leads and cost per lead
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">Campaign</th>
                <th className="px-5 py-3 font-bold">Channel</th>
                <th className="px-5 py-3 font-bold text-right">Budget</th>
                <th className="px-5 py-3 font-bold text-right">Spent</th>
                <th className="px-5 py-3 font-bold text-right">Leads</th>
                <th className="px-5 py-3 font-bold text-right">Cost / Lead</th>
                <th className="px-5 py-3 font-bold text-right">Conversion</th>
                <th className="px-5 py-3 font-bold text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {analytics.campaignPerformance.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-400 font-semibold">
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                analytics.campaignPerformance.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {campaign.name}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {campaign.type}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {campaign.type === 'EMAIL'
                        ? 'N/A'
                        : formatCurrency(campaign.budget)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {campaign.type === 'EMAIL'
                        ? 'N/A'
                        : formatCurrency(campaign.spent)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {formatNumber(campaign.leads)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-blue-600">
                      {campaign.type === 'EMAIL'
                        ? 'N/A'
                        : formatCurrency(campaign.costPerLead)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {formatPercent(campaign.conversionRate)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
                        {campaign.status || 'DRAFT'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, subtitle, icon, bg }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            {value}
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-2">
            {subtitle}
          </p>
        </div>

        <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value }) => {
  return (
    <tr>
      <td className="px-5 py-3 font-semibold text-slate-600">{label}</td>
      <td className="px-5 py-3 font-bold text-slate-900 text-right">{value}</td>
    </tr>
  );
};

export default MarketingAnalytics;