// // // 'use client';

// // // import { useEffect, useMemo, useState } from 'react';
// // // import {
// // //   TrendingUp,
// // //   Users,
// // //   Clock,
// // //   IndianRupee,
// // //   Target,
// // //   Megaphone,
// // //   Loader2,
// // //   AlertCircle,
// // //   ArrowUpRight,
// // // } from 'lucide-react';
// // // import { getCampaigns, getLeads } from '../../services/marketingApi';

// // // const formatCurrency = (val) => {
// // //   if (!val) return '₹0';
// // //   return new Intl.NumberFormat('en-IN', {
// // //     style: 'currency',
// // //     currency: 'INR',
// // //     maximumFractionDigits: 0,
// // //   }).format(Number(val));
// // // };

// // // const formatPercent = (val) => {
// // //   if (!Number.isFinite(val)) return '0.0%';
// // //   return `${val.toFixed(1)}%`;
// // // };

// // // const getDaysAgo = (date) => {
// // //   const d = new Date(date);
// // //   const now = new Date();
// // //   return Math.floor((now - d) / (1000 * 60 * 60 * 24));
// // // };

// // // const getSourceName = (lead) => {
// // //   return lead.source?.name || lead.source || 'Unknown';
// // // };

// // // const isProspectLead = (lead) => {
// // //   return (
// // //     lead.status === 'PROSPECT' ||
// // //     lead.leadStatus === 'PROSPECT' ||
// // //     lead.isProspect === true ||
// // //     lead.studentUserId ||
// // //     lead.isStudentLoginCreated === true
// // //   );
// // // };

// // // const MarketingAnalytics = () => {
// // //   const [campaigns, setCampaigns] = useState([]);
// // //   const [leads, setLeads] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState('');

// // //   const fetchAnalytics = async () => {
// // //     setLoading(true);
// // //     setError('');

// // //     try {
// // //       const [campaignRes, leadsRes] = await Promise.all([
// // //         getCampaigns({ page: 1, limit: 1000 }),
// // //         getLeads({ page: 1, limit: 1000 }),
// // //       ]);

// // //       if (!campaignRes.success || !leadsRes.success) {
// // //         setError('Failed to load marketing analytics data.');
// // //         return;
// // //       }

// // //       setCampaigns(campaignRes.data?.items || []);
// // //       setLeads(leadsRes.data?.items || []);
// // //     } catch (err) {
// // //       console.error(err);
// // //       setError('Connection error while loading marketing analytics.');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     fetchAnalytics();
// // //   }, []);

// // //   const analytics = useMemo(() => {
// // //     const paidCampaigns = campaigns.filter((c) => c.type !== 'EMAIL');

// // //     const totalBudget = paidCampaigns.reduce(
// // //       (sum, c) => sum + Number(c.budget || 0),
// // //       0
// // //     );

// // //     const totalSpent = paidCampaigns.reduce(
// // //       (sum, c) => sum + Number(c.spent || 0),
// // //       0
// // //     );

// // //     const totalRevenue = campaigns.reduce(
// // //       (sum, c) => sum + Number(c.revenue || 0),
// // //       0
// // //     );

// // //     const roi =
// // //       totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

// // //     const totalLeads = leads.length;
// // //     const prospects = leads.filter(isProspectLead).length;

// // //     const conversionRate =
// // //       totalLeads > 0 ? (prospects / totalLeads) * 100 : 0;

// // //     const hotLeads = leads.filter((l) => l.rating === 'HOT').length;
// // //     const warmLeads = leads.filter((l) => l.rating === 'WARM').length;
// // //     const coldLeads = leads.filter((l) => l.rating === 'COLD').length;

// // //     const last30DaysLeads = leads.filter(
// // //       (l) => l.createdAt && getDaysAgo(l.createdAt) <= 30
// // //     ).length;

// // //     const sourceMap = {};
// // //     leads.forEach((lead) => {
// // //       const source = getSourceName(lead);
// // //       if (!sourceMap[source]) {
// // //         sourceMap[source] = {
// // //           source,
// // //           leads: 0,
// // //           prospects: 0,
// // //           hot: 0,
// // //         };
// // //       }

// // //       sourceMap[source].leads += 1;
// // //       if (isProspectLead(lead)) sourceMap[source].prospects += 1;
// // //       if (lead.rating === 'HOT') sourceMap[source].hot += 1;
// // //     });

// // //     const sourceRows = Object.values(sourceMap)
// // //       .map((item) => ({
// // //         ...item,
// // //         conversion:
// // //           item.leads > 0 ? (item.prospects / item.leads) * 100 : 0,
// // //       }))
// // //       .sort((a, b) => b.leads - a.leads);

// // //     const campaignRows = campaigns.map((c) => {
// // //       const spent = Number(c.spent || 0);
// // //       const revenue = Number(c.revenue || 0);
// // //       const campaignRoi =
// // //         spent > 0 ? ((revenue - spent) / spent) * 100 : 0;

// // //       return {
// // //         name: c.name,
// // //         type: c.type,
// // //         budget: Number(c.budget || 0),
// // //         spent,
// // //         revenue,
// // //         roi: campaignRoi,
// // //         leads: c.leadsCount || 0,
// // //       };
// // //     });

// // //     return {
// // //       totalBudget,
// // //       totalSpent,
// // //       totalRevenue,
// // //       roi,
// // //       totalLeads,
// // //       prospects,
// // //       conversionRate,
// // //       hotLeads,
// // //       warmLeads,
// // //       coldLeads,
// // //       last30DaysLeads,
// // //       sourceRows,
// // //       campaignRows,
// // //       avgResponseTime: 'Pending',
// // //     };
// // //   }, [campaigns, leads]);

// // //   const chartData = analytics.sourceRows.slice(0, 10);
// // //   const maxChartValue = Math.max(...chartData.map((x) => x.leads), 1);

// // //   if (loading) {
// // //     return (
// // //       <div className="flex items-center justify-center py-32">
// // //         <Loader2 className="h-9 w-9 animate-spin text-[#1a2b4c]" />
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
// // //       <div>
// // //         <h1 className="text-3xl font-bold text-slate-900">
// // //           Marketing Analytics
// // //         </h1>
// // //         <p className="text-sm text-slate-500 font-semibold mt-1">
// // //           Campaign ROI, lead to prospect conversion rate, source performance,
// // //           and response analytics.
// // //         </p>
// // //       </div>

// // //       {error && (
// // //         <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
// // //           <AlertCircle className="h-5 w-5" />
// // //           {error}
// // //         </div>
// // //       )}

// // //       <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
// // //         <MetricCard
// // //           title="Campaign ROI"
// // //           value={formatPercent(analytics.roi)}
// // //           subtitle={`Spent ${formatCurrency(analytics.totalSpent)}`}
// // //           icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
// // //           bg="bg-emerald-50"
// // //         />

// // //         <MetricCard
// // //           title="Lead to Prospect Rate"
// // //           value={formatPercent(analytics.conversionRate)}
// // //           subtitle={`${analytics.prospects} prospects from ${analytics.totalLeads} leads`}
// // //           icon={<Users className="h-6 w-6 text-blue-600" />}
// // //           bg="bg-blue-50"
// // //         />

// // //         <MetricCard
// // //           title="Lead Response Time"
// // //           value={analytics.avgResponseTime}
// // //           subtitle="Needs first activity timestamp"
// // //           icon={<Clock className="h-6 w-6 text-orange-600" />}
// // //           bg="bg-orange-50"
// // //         />

// // //         <MetricCard
// // //           title="Total Ad Budget"
// // //           value={formatCurrency(analytics.totalBudget)}
// // //           subtitle={`Revenue ${formatCurrency(analytics.totalRevenue)}`}
// // //           icon={<IndianRupee className="h-6 w-6 text-purple-600" />}
// // //           bg="bg-purple-50"
// // //         />
// // //       </div>

// // //       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
// // //         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
// // //           <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
// // //             <div>
// // //               <h2 className="text-lg font-bold text-slate-900">
// // //                 Key Marketing Metrics
// // //               </h2>
// // //               <p className="text-xs text-slate-400 font-semibold">
// // //                 Last 30 days and current CRM data
// // //               </p>
// // //             </div>
// // //             <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50">
// // //               View All ›
// // //             </button>
// // //           </div>

// // //           <table className="w-full text-sm">
// // //             <thead className="bg-slate-50 text-slate-500">
// // //               <tr>
// // //                 <th className="text-left px-6 py-3">Metric</th>
// // //                 <th className="text-right px-6 py-3">Value</th>
// // //                 <th className="text-right px-6 py-3">Trend</th>
// // //               </tr>
// // //             </thead>
// // //             <tbody className="divide-y divide-slate-100 font-semibold">
// // //               <MetricRow label="Total Leads" value={analytics.totalLeads} trend="Live" />
// // //               <MetricRow label="Leads in Last 30 Days" value={analytics.last30DaysLeads} trend="+ Active" />
// // //               <MetricRow label="Hot Leads" value={analytics.hotLeads} trend="High" />
// // //               <MetricRow label="Warm Leads" value={analytics.warmLeads} trend="Medium" />
// // //               <MetricRow label="Cold Leads" value={analytics.coldLeads} trend="Low" />
// // //               <MetricRow label="Prospects Converted" value={analytics.prospects} trend={formatPercent(analytics.conversionRate)} />
// // //             </tbody>
// // //           </table>
// // //         </div>

// // //         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
// // //           <h2 className="text-lg font-bold text-slate-900">
// // //             Marketing Performance Overview
// // //           </h2>
// // //           <p className="text-xs text-slate-400 font-semibold mt-1">
// // //             Leads by source
// // //           </p>

// // //           <div className="mt-8 space-y-5">
// // //             {chartData.length === 0 ? (
// // //               <div className="text-center text-slate-400 font-semibold py-20">
// // //                 No source data available
// // //               </div>
// // //             ) : (
// // //               chartData.map((item) => (
// // //                 <div key={item.source}>
// // //                   <div className="flex justify-between text-sm font-semibold mb-1">
// // //                     <span className="text-slate-700">{item.source}</span>
// // //                     <span className="text-slate-500">{item.leads}</span>
// // //                   </div>
// // //                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
// // //                     <div
// // //                       className="h-full bg-[#1a2b4c] rounded-full"
// // //                       style={{
// // //                         width: `${(item.leads / maxChartValue) * 100}%`,
// // //                       }}
// // //                     />
// // //                   </div>
// // //                 </div>
// // //               ))
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>

// // //       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
// // //         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
// // //           <h2 className="text-lg font-bold text-slate-900">
// // //             Agency Funnel
// // //           </h2>

// // //           <div className="mt-6 space-y-4">
// // //             <FunnelBar label="Total Leads" value={analytics.totalLeads} width="100%" color="bg-blue-600" />
// // //             <FunnelBar label="Hot Leads" value={analytics.hotLeads} width={`${analytics.totalLeads ? (analytics.hotLeads / analytics.totalLeads) * 100 : 0}%`} color="bg-rose-500" />
// // //             <FunnelBar label="Prospects" value={analytics.prospects} width={`${analytics.totalLeads ? (analytics.prospects / analytics.totalLeads) * 100 : 0}%`} color="bg-emerald-600" />
// // //           </div>
// // //         </div>

// // //         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
// // //           <div className="px-6 py-4 border-b border-slate-100">
// // //             <h2 className="text-lg font-bold text-slate-900">
// // //               Source Performance
// // //             </h2>
// // //           </div>

// // //           <table className="w-full text-sm">
// // //             <thead className="bg-slate-50 text-slate-500">
// // //               <tr>
// // //                 <th className="text-left px-5 py-3">Source</th>
// // //                 <th className="text-right px-5 py-3">Leads</th>
// // //                 <th className="text-right px-5 py-3">Prospects</th>
// // //                 <th className="text-right px-5 py-3">Conv.</th>
// // //               </tr>
// // //             </thead>
// // //             <tbody className="divide-y divide-slate-100 font-semibold">
// // //               {analytics.sourceRows.slice(0, 7).map((row) => (
// // //                 <tr key={row.source}>
// // //                   <td className="px-5 py-3 text-slate-800">{row.source}</td>
// // //                   <td className="px-5 py-3 text-right">{row.leads}</td>
// // //                   <td className="px-5 py-3 text-right">{row.prospects}</td>
// // //                   <td className="px-5 py-3 text-right text-emerald-600">
// // //                     {formatPercent(row.conversion)}
// // //                   </td>
// // //                 </tr>
// // //               ))}
// // //             </tbody>
// // //           </table>
// // //         </div>
// // //       </div>

// // //       <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
// // //         <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
// // //           <Megaphone className="h-5 w-5 text-slate-600" />
// // //           <h2 className="text-lg font-bold text-slate-900">
// // //             Campaign ROI Breakdown
// // //           </h2>
// // //         </div>

// // //         <table className="w-full text-sm">
// // //           <thead className="bg-slate-50 text-slate-500">
// // //             <tr>
// // //               <th className="text-left px-5 py-3">Campaign</th>
// // //               <th className="text-left px-5 py-3">Type</th>
// // //               <th className="text-right px-5 py-3">Budget</th>
// // //               <th className="text-right px-5 py-3">Spent</th>
// // //               <th className="text-right px-5 py-3">Revenue</th>
// // //               <th className="text-right px-5 py-3">ROI</th>
// // //             </tr>
// // //           </thead>
// // //           <tbody className="divide-y divide-slate-100 font-semibold">
// // //             {analytics.campaignRows.length === 0 ? (
// // //               <tr>
// // //                 <td colSpan="6" className="text-center py-10 text-slate-400">
// // //                   No campaigns found
// // //                 </td>
// // //               </tr>
// // //             ) : (
// // //               analytics.campaignRows.map((c, index) => (
// // //                 <tr key={`${c.name}-${index}`}>
// // //                   <td className="px-5 py-3 text-slate-800">{c.name}</td>
// // //                   <td className="px-5 py-3 text-slate-500">{c.type}</td>
// // //                   <td className="px-5 py-3 text-right">{c.type === 'EMAIL' ? 'N/A' : formatCurrency(c.budget)}</td>
// // //                   <td className="px-5 py-3 text-right">{c.type === 'EMAIL' ? 'N/A' : formatCurrency(c.spent)}</td>
// // //                   <td className="px-5 py-3 text-right">{formatCurrency(c.revenue)}</td>
// // //                   <td className={`px-5 py-3 text-right ${c.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
// // //                     {c.type === 'EMAIL' ? 'N/A' : formatPercent(c.roi)}
// // //                   </td>
// // //                 </tr>
// // //               ))
// // //             )}
// // //           </tbody>
// // //         </table>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // const MetricCard = ({ title, value, subtitle, icon, bg }) => (
// // //   <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
// // //     <div className="flex items-center justify-between">
// // //       <div>
// // //         <p className="text-sm font-bold text-slate-500">{title}</p>
// // //         <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
// // //           {value}
// // //         </h2>
// // //       </div>
// // //       <div className={`h-14 w-14 rounded-2xl ${bg} flex items-center justify-center`}>
// // //         {icon}
// // //       </div>
// // //     </div>
// // //     <p className="text-sm text-slate-500 font-semibold mt-4">{subtitle}</p>
// // //   </div>
// // // );

// // // const MetricRow = ({ label, value, trend }) => (
// // //   <tr>
// // //     <td className="px-6 py-3 text-slate-700">{label}</td>
// // //     <td className="px-6 py-3 text-right text-slate-900">{value}</td>
// // //     <td className="px-6 py-3 text-right text-emerald-600">{trend}</td>
// // //   </tr>
// // // );

// // // const FunnelBar = ({ label, value, width, color }) => (
// // //   <div>
// // //     <div className="flex justify-between text-sm font-semibold mb-1">
// // //       <span className="text-slate-700">{label}</span>
// // //       <span className="text-slate-500">{value}</span>
// // //     </div>
// // //     <div className="h-10 bg-slate-100 rounded-xl overflow-hidden">
// // //       <div
// // //         className={`h-full ${color} rounded-xl flex items-center justify-end pr-4 text-white text-sm font-bold`}
// // //         style={{ width }}
// // //       >
// // //         {value}
// // //       </div>
// // //     </div>
// // //   </div>
// // // );

// // // export default MarketingAnalytics;


// // 'use client';

// // import { useEffect, useMemo, useState } from 'react';
// // import {
// //   Activity,
// //   AlertCircle,
// //   BarChart3,
// //   Clock,
// //   IndianRupee,
// //   Loader2,
// //   RefreshCcw,
// //   Target,
// //   TrendingUp,
// //   Users,
// //   Zap,
// // } from 'lucide-react';
// // import { getCampaigns, getLeads } from '../../services/marketingApi';

// // const formatCurrency = (value) =>
// //   new Intl.NumberFormat('en-IN', {
// //     style: 'currency',
// //     currency: 'INR',
// //     maximumFractionDigits: 0,
// //   }).format(Number(value || 0));

// // const formatNumber = (value) =>
// //   new Intl.NumberFormat('en-IN').format(Number(value || 0));

// // const formatPercent = (value) =>
// //   Number.isFinite(value) ? `${value.toFixed(1)}%` : '0%';

// // const num = (value) => Number(value || 0);

// // const parseJson = (value) => {
// //   if (!value) return {};
// //   if (typeof value === 'string') {
// //     try {
// //       return JSON.parse(value);
// //     } catch {
// //       return {};
// //     }
// //   }
// //   return value;
// // };

// // const getCampaignLeads = (campaign) =>
// //   num(campaign.leadsCount || campaign.totalLeads || campaign.leads?.length);

// // const getCampaignConversions = (campaign) =>
// //   num(campaign.conversionsCount || campaign.convertedLeads || campaign.studentsCount);

// // const getSourceName = (lead) =>
// //   lead.source?.name ||
// //   lead.sourceName ||
// //   lead.source ||
// //   lead.campaignSource ||
// //   'Unknown';

// // const isQualifiedLead = (lead) =>
// //   ['HOT', 'WARM'].includes(String(lead.rating || '').toUpperCase());

// // const isProspectLead = (lead) =>
// //   lead.status === 'PROSPECT' ||
// //   lead.leadStatus === 'PROSPECT' ||
// //   lead.isProspect === true ||
// //   lead.studentUserId ||
// //   lead.isStudentLoginCreated;

// // const getMonthLabel = (dateValue) => {
// //   const date = new Date(dateValue);
// //   if (Number.isNaN(date.getTime())) return 'Unknown';
// //   return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
// // };

// // export default function MarketingAnalytics() {
// //   const [campaigns, setCampaigns] = useState([]);
// //   const [leads, setLeads] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');

// //   const fetchAnalytics = async () => {
// //     setLoading(true);
// //     setError('');

// //     try {
// //       const [campaignRes, leadsRes] = await Promise.all([
// //         getCampaigns({ page: 1, limit: 1000 }),
// //         getLeads({ page: 1, limit: 1000 }),
// //       ]);

// //       if (!campaignRes?.success || !leadsRes?.success) {
// //         setError('Failed to load marketing analytics data.');
// //         return;
// //       }

// //       setCampaigns(campaignRes.data?.items || []);
// //       setLeads(leadsRes.data?.items || []);
// //     } catch (err) {
// //       console.error(err);
// //       setError('Connection error while loading marketing analytics.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchAnalytics();
// //   }, []);

// //   const analytics = useMemo(() => {
// //     const paidCampaigns = campaigns.filter((c) => c.type !== 'EMAIL');

// //     const totalCampaigns = campaigns.length;
// //     const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;

// //     const totalBudget = paidCampaigns.reduce((sum, c) => sum + num(c.budget), 0);
// //     const totalSpent = paidCampaigns.reduce((sum, c) => sum + num(c.spent), 0);

// //     const totalLeads =
// //       leads.length || campaigns.reduce((sum, c) => sum + getCampaignLeads(c), 0);

// //     const qualifiedLeads = leads.filter(isQualifiedLead).length;
// //     const prospects = leads.filter(isProspectLead).length;

// //     const costPerLead =
// //       totalSpent > 0 && totalLeads > 0 ? totalSpent / totalLeads : 0;

// //     const conversionRate =
// //       totalLeads > 0 ? (prospects / totalLeads) * 100 : 0;

// //     const budgetUsage =
// //       totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

// //     const leadsPerThousand =
// //       totalSpent > 0 ? (totalLeads / totalSpent) * 1000 : 0;

// //     const sourceMap = {};
// //     leads.forEach((lead) => {
// //       const source = getSourceName(lead);

// //       if (!sourceMap[source]) {
// //         sourceMap[source] = {
// //           source,
// //           leads: 0,
// //           qualified: 0,
// //           prospects: 0,
// //         };
// //       }

// //       sourceMap[source].leads += 1;
// //       if (isQualifiedLead(lead)) sourceMap[source].qualified += 1;
// //       if (isProspectLead(lead)) sourceMap[source].prospects += 1;
// //     });

// //     const sourcePerformance = Object.values(sourceMap)
// //       .map((item) => ({
// //         ...item,
// //         percentage: totalLeads > 0 ? (item.leads / totalLeads) * 100 : 0,
// //         conversionRate: item.leads > 0 ? (item.prospects / item.leads) * 100 : 0,
// //       }))
// //       .sort((a, b) => b.leads - a.leads);

// //     const campaignPerformance = campaigns
// //       .map((campaign) => {
// //         const details = parseJson(campaign.launchDetails);
// //         const leadsCount = getCampaignLeads(campaign);
// //         const spent = num(campaign.spent);
// //         const budget = num(campaign.budget);
// //         const conversions = getCampaignConversions(campaign);

// //         return {
// //           id: campaign.id,
// //           name: campaign.name,
// //           type: campaign.type,
// //           status: campaign.status,
// //           budget,
// //           spent,
// //           dailyBudget: num(details.dailyBudget),
// //           leads: leadsCount,
// //           conversions,
// //           costPerLead: spent > 0 && leadsCount > 0 ? spent / leadsCount : 0,
// //           conversionRate: leadsCount > 0 ? (conversions / leadsCount) * 100 : 0,
// //         };
// //       })
// //       .sort((a, b) => b.leads - a.leads);

// //     const monthMap = {};
// //     leads.forEach((lead) => {
// //       const month = getMonthLabel(lead.createdAt);
// //       monthMap[month] = (monthMap[month] || 0) + 1;
// //     });

// //     const monthlyTrend = Object.entries(monthMap).map(([month, count]) => ({
// //       month,
// //       count,
// //     }));

// //     const counsellorMap = {};
// //     leads.forEach((lead) => {
// //       const name =
// //         lead.assignedCounsellor?.fullName ||
// //         lead.assignedCounsellor?.name ||
// //         'Unassigned';

// //       if (!counsellorMap[name]) {
// //         counsellorMap[name] = {
// //           name,
// //           assigned: 0,
// //           qualified: 0,
// //           prospects: 0,
// //         };
// //       }

// //       counsellorMap[name].assigned += 1;
// //       if (isQualifiedLead(lead)) counsellorMap[name].qualified += 1;
// //       if (isProspectLead(lead)) counsellorMap[name].prospects += 1;
// //     });

// //     const counsellorPerformance = Object.values(counsellorMap).sort(
// //       (a, b) => b.assigned - a.assigned
// //     );

// //     return {
// //       totalCampaigns,
// //       activeCampaigns,
// //       totalBudget,
// //       totalSpent,
// //       totalLeads,
// //       qualifiedLeads,
// //       prospects,
// //       costPerLead,
// //       conversionRate,
// //       budgetUsage,
// //       leadsPerThousand,
// //       sourcePerformance,
// //       campaignPerformance,
// //       monthlyTrend,
// //       counsellorPerformance,
// //       funnel: [
// //         { label: 'Total Leads', value: totalLeads },
// //         { label: 'Qualified HOT/WARM', value: qualifiedLeads },
// //         { label: 'Prospects', value: prospects },
// //         { label: 'Applications', value: 0 },
// //         { label: 'Enrolled', value: 0 },
// //       ],
// //     };
// //   }, [campaigns, leads]);

// //   if (loading) {
// //     return (
// //       <div className="flex items-center justify-center py-32">
// //         <Loader2 className="h-9 w-9 animate-spin text-slate-700" />
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-[#f6f8fb] p-6 space-y-6">
// //       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
// //         <div>
// //           <h1 className="text-3xl font-black text-slate-900">
// //             Marketing Analytics
// //           </h1>
// //           <p className="text-sm font-semibold text-slate-500 mt-1">
// //             Campaign budget, spend, leads, cost per lead, sources and agency funnel.
// //           </p>
// //         </div>

// //         <button
// //           onClick={fetchAnalytics}
// //           className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
// //         >
// //           <RefreshCcw className="h-4 w-4" />
// //           Refresh
// //         </button>
// //       </div>

// //       {error && (
// //         <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
// //           <AlertCircle className="h-5 w-5" />
// //           {error}
// //         </div>
// //       )}

// //       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
// //         <KpiCard
// //           title="Total Campaigns"
// //           value={formatNumber(analytics.totalCampaigns)}
// //           subtitle={`${analytics.activeCampaigns} active campaigns`}
// //           icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
// //           bg="bg-blue-50"
// //         />

// //         <KpiCard
// //           title="Budget Allocated"
// //           value={formatCurrency(analytics.totalBudget)}
// //           subtitle="Total paid campaign budget"
// //           icon={<IndianRupee className="h-6 w-6 text-emerald-600" />}
// //           bg="bg-emerald-50"
// //         />

// //         <KpiCard
// //           title="Amount Spent"
// //           value={formatCurrency(analytics.totalSpent)}
// //           subtitle={`${formatPercent(analytics.budgetUsage)} budget used`}
// //           icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
// //           bg="bg-orange-50"
// //         />

// //         <KpiCard
// //           title="Total Leads"
// //           value={formatNumber(analytics.totalLeads)}
// //           subtitle={`${analytics.qualifiedLeads} qualified leads`}
// //           icon={<Users className="h-6 w-6 text-purple-600" />}
// //           bg="bg-purple-50"
// //         />

// //         <KpiCard
// //           title="Cost Per Lead"
// //           value={formatCurrency(analytics.costPerLead)}
// //           subtitle="Spent amount / leads"
// //           icon={<Target className="h-6 w-6 text-rose-600" />}
// //           bg="bg-rose-50"
// //         />

// //         <KpiCard
// //           title="Lead Conversion"
// //           value={formatPercent(analytics.conversionRate)}
// //           subtitle={`${analytics.prospects} prospects created`}
// //           icon={<Zap className="h-6 w-6 text-yellow-600" />}
// //           bg="bg-yellow-50"
// //         />

// //         <KpiCard
// //           title="Campaign Efficiency"
// //           value={analytics.leadsPerThousand.toFixed(1)}
// //           subtitle="Leads per ₹1000 spent"
// //           icon={<Activity className="h-6 w-6 text-cyan-600" />}
// //           bg="bg-cyan-50"
// //         />

// //         <KpiCard
// //           title="Lead Response Time"
// //           value="Need Activity API"
// //           subtitle="First response - lead created time"
// //           icon={<Clock className="h-6 w-6 text-slate-600" />}
// //           bg="bg-slate-100"
// //         />
// //       </div>

// //       <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
// //         <Panel title="Agency Funnel" subtitle="Lead journey through your agency">
// //           <div className="space-y-4">
// //             {analytics.funnel.map((item, index) => {
// //               const max = analytics.funnel[0]?.value || 1;
// //               const width = max > 0 ? (item.value / max) * 100 : 0;

// //               return (
// //                 <div key={item.label}>
// //                   <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
// //                     <span>{index + 1}. {item.label}</span>
// //                     <span>{formatNumber(item.value)}</span>
// //                   </div>
// //                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
// //                     <div
// //                       className="h-full bg-blue-600 rounded-full"
// //                       style={{ width: `${Math.max(width, item.value > 0 ? 8 : 0)}%` }}
// //                     />
// //                   </div>
// //                 </div>
// //               );
// //             })}
// //           </div>
// //         </Panel>

// //         <Panel title="Lead Source Performance" subtitle="Leads coming from various sources">
// //           <div className="space-y-4">
// //             {analytics.sourcePerformance.length === 0 ? (
// //               <EmptyText text="No source data available." />
// //             ) : (
// //               analytics.sourcePerformance.slice(0, 8).map((item) => (
// //                 <div key={item.source}>
// //                   <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
// //                     <span>{item.source}</span>
// //                     <span>{formatNumber(item.leads)} leads</span>
// //                   </div>
// //                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
// //                     <div
// //                       className="h-full bg-emerald-500 rounded-full"
// //                       style={{ width: `${Math.min(item.percentage, 100)}%` }}
// //                     />
// //                   </div>
// //                   <p className="text-[11px] text-slate-400 font-bold mt-1">
// //                     {formatPercent(item.percentage)} of total leads ·{' '}
// //                     {formatPercent(item.conversionRate)} prospect conversion
// //                   </p>
// //                 </div>
// //               ))
// //             )}
// //           </div>
// //         </Panel>

// //         <Panel title="Monthly Lead Trend" subtitle="Leads generated month wise">
// //           <div className="space-y-4">
// //             {analytics.monthlyTrend.length === 0 ? (
// //               <EmptyText text="No monthly trend data available." />
// //             ) : (
// //               analytics.monthlyTrend.map((item) => {
// //                 const max = Math.max(...analytics.monthlyTrend.map((m) => m.count), 1);
// //                 const width = (item.count / max) * 100;

// //                 return (
// //                   <div key={item.month}>
// //                     <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
// //                       <span>{item.month}</span>
// //                       <span>{formatNumber(item.count)}</span>
// //                     </div>
// //                     <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
// //                       <div
// //                         className="h-full bg-purple-500 rounded-full"
// //                         style={{ width: `${width}%` }}
// //                       />
// //                     </div>
// //                   </div>
// //                 );
// //               })
// //             )}
// //           </div>
// //         </Panel>
// //       </div>

// //       <Panel title="Campaign Lead Performance" subtitle="Budget allocated, spent and leads generated by campaign">
// //         <div className="overflow-x-auto">
// //           <table className="w-full text-sm text-left">
// //             <thead className="bg-slate-50 text-slate-500">
// //               <tr>
// //                 <th className="px-5 py-3 font-black">Campaign</th>
// //                 <th className="px-5 py-3 font-black">Channel</th>
// //                 <th className="px-5 py-3 font-black text-right">Budget Allocated</th>
// //                 <th className="px-5 py-3 font-black text-right">Amount Spent</th>
// //                 <th className="px-5 py-3 font-black text-right">Daily Budget</th>
// //                 <th className="px-5 py-3 font-black text-right">Leads</th>
// //                 <th className="px-5 py-3 font-black text-right">Cost / Lead</th>
// //                 <th className="px-5 py-3 font-black text-center">Status</th>
// //               </tr>
// //             </thead>

// //             <tbody className="divide-y divide-slate-100">
// //               {analytics.campaignPerformance.length === 0 ? (
// //                 <tr>
// //                   <td colSpan="8" className="px-5 py-10 text-center text-slate-400 font-bold">
// //                     No campaigns found.
// //                   </td>
// //                 </tr>
// //               ) : (
// //                 analytics.campaignPerformance.map((campaign) => (
// //                   <tr key={campaign.id} className="hover:bg-slate-50/80">
// //                     <td className="px-5 py-4 font-black text-slate-900">
// //                       {campaign.name}
// //                     </td>
// //                     <td className="px-5 py-4 font-bold text-slate-600">
// //                       {campaign.type}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {campaign.type === 'EMAIL' ? 'N/A' : formatCurrency(campaign.budget)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {campaign.type === 'EMAIL' ? 'N/A' : formatCurrency(campaign.spent)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {campaign.dailyBudget > 0 ? formatCurrency(campaign.dailyBudget) : 'N/A'}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {formatNumber(campaign.leads)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-black text-blue-600">
// //                       {campaign.type === 'EMAIL' ? 'N/A' : formatCurrency(campaign.costPerLead)}
// //                     </td>
// //                     <td className="px-5 py-4 text-center">
// //                       <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black">
// //                         {campaign.status || 'DRAFT'}
// //                       </span>
// //                     </td>
// //                   </tr>
// //                 ))
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </Panel>

// //       <Panel title="Lead Source Details" subtitle="Detailed source-wise lead breakdown">
// //         <div className="overflow-x-auto">
// //           <table className="w-full text-sm text-left">
// //             <thead className="bg-slate-50 text-slate-500">
// //               <tr>
// //                 <th className="px-5 py-3 font-black">Source</th>
// //                 <th className="px-5 py-3 font-black text-right">Total Leads</th>
// //                 <th className="px-5 py-3 font-black text-right">Qualified</th>
// //                 <th className="px-5 py-3 font-black text-right">Prospects</th>
// //                 <th className="px-5 py-3 font-black text-right">Share</th>
// //                 <th className="px-5 py-3 font-black text-right">Conversion</th>
// //               </tr>
// //             </thead>

// //             <tbody className="divide-y divide-slate-100">
// //               {analytics.sourcePerformance.length === 0 ? (
// //                 <tr>
// //                   <td colSpan="6" className="px-5 py-10 text-center text-slate-400 font-bold">
// //                     No lead source data found.
// //                   </td>
// //                 </tr>
// //               ) : (
// //                 analytics.sourcePerformance.map((source) => (
// //                   <tr key={source.source} className="hover:bg-slate-50">
// //                     <td className="px-5 py-4 font-black text-slate-900">
// //                       {source.source}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {formatNumber(source.leads)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {formatNumber(source.qualified)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {formatNumber(source.prospects)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {formatPercent(source.percentage)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-black text-emerald-600">
// //                       {formatPercent(source.conversionRate)}
// //                     </td>
// //                   </tr>
// //                 ))
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </Panel>

// //       <Panel title="Counsellor Performance" subtitle="Assigned leads and converted prospects by counsellor">
// //         <div className="overflow-x-auto">
// //           <table className="w-full text-sm text-left">
// //             <thead className="bg-slate-50 text-slate-500">
// //               <tr>
// //                 <th className="px-5 py-3 font-black">Counsellor</th>
// //                 <th className="px-5 py-3 font-black text-right">Assigned Leads</th>
// //                 <th className="px-5 py-3 font-black text-right">Qualified</th>
// //                 <th className="px-5 py-3 font-black text-right">Prospects</th>
// //                 <th className="px-5 py-3 font-black text-right">Conversion</th>
// //               </tr>
// //             </thead>

// //             <tbody className="divide-y divide-slate-100">
// //               {analytics.counsellorPerformance.length === 0 ? (
// //                 <tr>
// //                   <td colSpan="5" className="px-5 py-10 text-center text-slate-400 font-bold">
// //                     No counsellor data found.
// //                   </td>
// //                 </tr>
// //               ) : (
// //                 analytics.counsellorPerformance.map((c) => (
// //                   <tr key={c.name} className="hover:bg-slate-50">
// //                     <td className="px-5 py-4 font-black text-slate-900">
// //                       {c.name}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {formatNumber(c.assigned)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {formatNumber(c.qualified)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-bold">
// //                       {formatNumber(c.prospects)}
// //                     </td>
// //                     <td className="px-5 py-4 text-right font-black text-blue-600">
// //                       {formatPercent(c.assigned > 0 ? (c.prospects / c.assigned) * 100 : 0)}
// //                     </td>
// //                   </tr>
// //                 ))
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </Panel>
// //     </div>
// //   );
// // }

// // function KpiCard({ title, value, subtitle, icon, bg }) {
// //   return (
// //     <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
// //       <div className="flex items-start justify-between gap-4">
// //         <div>
// //           <p className="text-sm font-black text-slate-500">{title}</p>
// //           <h2 className="text-3xl font-black text-slate-900 mt-2">{value}</h2>
// //           <p className="text-xs font-bold text-slate-400 mt-2">{subtitle}</p>
// //         </div>

// //         <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
// //           {icon}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // function Panel({ title, subtitle, children }) {
// //   return (
// //     <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
// //       <div className="px-5 py-4 border-b border-slate-100">
// //         <h2 className="text-lg font-black text-slate-900">{title}</h2>
// //         <p className="text-xs font-bold text-slate-400 mt-0.5">{subtitle}</p>
// //       </div>
// //       <div className="p-5">{children}</div>
// //     </div>
// //   );
// // }

// // function EmptyText({ text }) {
// //   return (
// //     <div className="py-10 text-center text-sm font-bold text-slate-400">
// //       {text}
// //     </div>
// //   );
// // }


// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import {
//   Activity,
//   AlertCircle,
//   BarChart3,
//   Clock,
//   IndianRupee,
//   Loader2,
//   RefreshCcw,
//   Target,
//   TrendingUp,
//   Users,
//   Zap,
// } from 'lucide-react';
// import { getCampaigns, getLeads } from '../../services/marketingApi';

// const formatCurrency = (value) =>
//   new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0,
//   }).format(Number(value || 0));

// const formatNumber = (value) =>
//   new Intl.NumberFormat('en-IN').format(Number(value || 0));

// const formatPercent = (value) =>
//   Number.isFinite(value) ? `${value.toFixed(1)}%` : '0%';

// const num = (value) => Number(value || 0);

// const parseJson = (value) => {
//   if (!value) return {};
//   if (typeof value === 'string') {
//     try {
//       return JSON.parse(value);
//     } catch {
//       return {};
//     }
//   }
//   return value;
// };

// const getCampaignLeads = (campaign) =>
//   num(campaign.leadsCount || campaign.totalLeads || campaign.leads?.length);

// const getCampaignConversions = (campaign) =>
//   num(campaign.conversionsCount || campaign.convertedLeads || campaign.studentsCount);

// const getSourceName = (lead) =>
//   lead.source?.name ||
//   lead.sourceName ||
//   lead.source ||
//   lead.campaignSource ||
//   'Unknown';

// const isContactedLead = (lead) =>
//   lead.lastContactedAt ||
//   lead.lastActivityAt ||
//   lead.activities?.length > 0 ||
//   lead.emailSent === true ||
//   lead.smsSent === true ||
//   lead.whatsappSent === true;

// const isQualifiedLead = (lead) =>
//   ['HOT', 'WARM'].includes(String(lead.rating || '').toUpperCase());

// const isProspectLead = (lead) =>
//   isQualifiedLead(lead) &&
//   (
//     lead.status === 'PROSPECT' ||
//     lead.leadStatus === 'PROSPECT' ||
//     lead.isProspect === true
//   );

// const isApplicationLead = (lead) =>
//   isProspectLead(lead) &&
//   (
//     lead.applicationId ||
//     lead.applicationStatus ||
//     lead.hasApplication === true
//   );

// const isAdmissionLead = (lead) =>
//   isApplicationLead(lead) &&
//   (
//     lead.admissionId ||
//     lead.enrollmentStatus === 'ENROLLED' ||
//     lead.isEnrolled === true
//   );

// const getMonthLabel = (dateValue) => {
//   const date = new Date(dateValue);
//   if (Number.isNaN(date.getTime())) return 'Unknown';
//   return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
// };

// export default function MarketingAnalytics() {
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

//       if (!campaignRes?.success || !leadsRes?.success) {
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

//     const totalCampaigns = campaigns.length;
//     const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;

//     const totalBudget = paidCampaigns.reduce((sum, c) => sum + num(c.budget), 0);
//     const totalSpent = paidCampaigns.reduce((sum, c) => sum + num(c.spent), 0);

//     const totalLeads =
//       leads.length || campaigns.reduce((sum, c) => sum + getCampaignLeads(c), 0);

//     const contactedLeads = leads.filter(isContactedLead).length;
//     const qualifiedLeads = leads.filter(isQualifiedLead).length;
//     const prospects = leads.filter(isProspectLead).length;
//     const applications = leads.filter(isApplicationLead).length;
//     const admissions = leads.filter(isAdmissionLead).length;

//     const costPerLead =
//       totalSpent > 0 && totalLeads > 0 ? totalSpent / totalLeads : 0;

//     const conversionRate =
//       totalLeads > 0 ? (prospects / totalLeads) * 100 : 0;

//     const budgetUsage =
//       totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

//     const leadsPerThousand =
//       totalSpent > 0 ? (totalLeads / totalSpent) * 1000 : 0;

//     const sourceMap = {};
//     leads.forEach((lead) => {
//       const source = getSourceName(lead);

//       if (!sourceMap[source]) {
//         sourceMap[source] = {
//           source,
//           leads: 0,
//           contacted: 0,
//           qualified: 0,
//           prospects: 0,
//           applications: 0,
//           admissions: 0,
//         };
//       }

//       sourceMap[source].leads += 1;
//       if (isContactedLead(lead)) sourceMap[source].contacted += 1;
//       if (isQualifiedLead(lead)) sourceMap[source].qualified += 1;
//       if (isProspectLead(lead)) sourceMap[source].prospects += 1;
//       if (isApplicationLead(lead)) sourceMap[source].applications += 1;
//       if (isAdmissionLead(lead)) sourceMap[source].admissions += 1;
//     });

//     const sourcePerformance = Object.values(sourceMap)
//       .map((item) => ({
//         ...item,
//         percentage: totalLeads > 0 ? (item.leads / totalLeads) * 100 : 0,
//         conversionRate: item.leads > 0 ? (item.prospects / item.leads) * 100 : 0,
//       }))
//       .sort((a, b) => b.leads - a.leads);

//     const campaignPerformance = campaigns
//       .map((campaign) => {
//         const details = parseJson(campaign.launchDetails);
//         const leadsCount = getCampaignLeads(campaign);
//         const spent = num(campaign.spent);
//         const budget = num(campaign.budget);
//         const conversions = getCampaignConversions(campaign);

//         return {
//           id: campaign.id,
//           name: campaign.name,
//           type: campaign.type,
//           status: campaign.status,
//           budget,
//           spent,
//           dailyBudget: num(details.dailyBudget),
//           leads: leadsCount,
//           conversions,
//           costPerLead: spent > 0 && leadsCount > 0 ? spent / leadsCount : 0,
//           conversionRate: leadsCount > 0 ? (conversions / leadsCount) * 100 : 0,
//         };
//       })
//       .sort((a, b) => b.leads - a.leads);

//     const monthMap = {};
//     leads.forEach((lead) => {
//       const month = getMonthLabel(lead.createdAt);
//       monthMap[month] = (monthMap[month] || 0) + 1;
//     });

//     const monthlyTrend = Object.entries(monthMap).map(([month, count]) => ({
//       month,
//       count,
//     }));

//     const counsellorMap = {};
//     leads.forEach((lead) => {
//       const name =
//         lead.assignedCounsellor?.fullName ||
//         lead.assignedCounsellor?.name ||
//         'Unassigned';

//       if (!counsellorMap[name]) {
//         counsellorMap[name] = {
//           name,
//           assigned: 0,
//           contacted: 0,
//           qualified: 0,
//           prospects: 0,
//           applications: 0,
//           admissions: 0,
//         };
//       }

//       counsellorMap[name].assigned += 1;

//       if (isContactedLead(lead)) counsellorMap[name].contacted += 1;
//       if (isQualifiedLead(lead)) counsellorMap[name].qualified += 1;
//       if (isProspectLead(lead)) counsellorMap[name].prospects += 1;
//       if (isApplicationLead(lead)) counsellorMap[name].applications += 1;
//       if (isAdmissionLead(lead)) counsellorMap[name].admissions += 1;
//     });

//     const counsellorPerformance = Object.values(counsellorMap).sort(
//       (a, b) => b.assigned - a.assigned
//     );

//     return {
//       totalCampaigns,
//       activeCampaigns,
//       totalBudget,
//       totalSpent,
//       totalLeads,
//       contactedLeads,
//       qualifiedLeads,
//       prospects,
//       applications,
//       admissions,
//       costPerLead,
//       conversionRate,
//       budgetUsage,
//       leadsPerThousand,
//       sourcePerformance,
//       campaignPerformance,
//       monthlyTrend,
//       counsellorPerformance,
//       funnel: [
//         { label: 'Total Leads', value: totalLeads },
//         { label: 'Contacted', value: contactedLeads },
//         { label: 'Qualified HOT/WARM', value: qualifiedLeads },
//         { label: 'Prospects', value: prospects },
//         { label: 'Applications', value: applications },
//         { label: 'Admissions', value: admissions },
//       ],
//     };
//   }, [campaigns, leads]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-32">
//         <Loader2 className="h-9 w-9 animate-spin text-slate-700" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#f6f8fb] p-6 space-y-6">
//       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-black text-slate-900">
//             Marketing Analytics
//           </h1>
//           <p className="text-sm font-semibold text-slate-500 mt-1">
//             Campaign budget, spend, leads, cost per lead, sources and agency funnel.
//           </p>
//         </div>

//         <button
//           onClick={fetchAnalytics}
//           className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
//         >
//           <RefreshCcw className="h-4 w-4" />
//           Refresh
//         </button>
//       </div>

//       {error && (
//         <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
//           <AlertCircle className="h-5 w-5" />
//           {error}
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
//         <KpiCard title="Total Campaigns" value={formatNumber(analytics.totalCampaigns)} subtitle={`${analytics.activeCampaigns} active campaigns`} icon={<BarChart3 className="h-6 w-6 text-blue-600" />} bg="bg-blue-50" />
//         <KpiCard title="Budget Allocated" value={formatCurrency(analytics.totalBudget)} subtitle="Total paid campaign budget" icon={<IndianRupee className="h-6 w-6 text-emerald-600" />} bg="bg-emerald-50" />
//         <KpiCard title="Amount Spent" value={formatCurrency(analytics.totalSpent)} subtitle={`${formatPercent(analytics.budgetUsage)} budget used`} icon={<TrendingUp className="h-6 w-6 text-orange-600" />} bg="bg-orange-50" />
//         <KpiCard title="Total Leads" value={formatNumber(analytics.totalLeads)} subtitle={`${analytics.qualifiedLeads} qualified leads`} icon={<Users className="h-6 w-6 text-purple-600" />} bg="bg-purple-50" />
//         <KpiCard title="Cost Per Lead" value={formatCurrency(analytics.costPerLead)} subtitle="Spent amount / leads" icon={<Target className="h-6 w-6 text-rose-600" />} bg="bg-rose-50" />
//         <KpiCard title="Lead Conversion" value={formatPercent(analytics.conversionRate)} subtitle={`${analytics.prospects} prospects created`} icon={<Zap className="h-6 w-6 text-yellow-600" />} bg="bg-yellow-50" />
//         <KpiCard title="Campaign Efficiency" value={analytics.leadsPerThousand.toFixed(1)} subtitle="Leads per ₹1000 spent" icon={<Activity className="h-6 w-6 text-cyan-600" />} bg="bg-cyan-50" />
//         <KpiCard title="Lead Response Time" value="Need Activity API" subtitle="First response - lead created time" icon={<Clock className="h-6 w-6 text-slate-600" />} bg="bg-slate-100" />
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
//         <Panel title="Agency Funnel" subtitle="Lead journey through your agency">
//           <div className="space-y-4">
//             {analytics.funnel.map((item, index) => {
//               const max = analytics.funnel[0]?.value || 1;
//               const width = max > 0 ? (item.value / max) * 100 : 0;

//               return (
//                 <div key={item.label}>
//                   <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
//                     <span>{index + 1}. {item.label}</span>
//                     <span>{formatNumber(item.value)}</span>
//                   </div>
//                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-blue-600 rounded-full"
//                       style={{ width: `${Math.max(width, item.value > 0 ? 8 : 0)}%` }}
//                     />
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </Panel>

//         <Panel title="Lead Source Performance" subtitle="Leads coming from various sources">
//           <div className="space-y-4">
//             {analytics.sourcePerformance.length === 0 ? (
//               <EmptyText text="No source data available." />
//             ) : (
//               analytics.sourcePerformance.slice(0, 8).map((item) => (
//                 <div key={item.source}>
//                   <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
//                     <span>{item.source}</span>
//                     <span>{formatNumber(item.leads)} leads</span>
//                   </div>
//                   <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-emerald-500 rounded-full"
//                       style={{ width: `${Math.min(item.percentage, 100)}%` }}
//                     />
//                   </div>
//                   <p className="text-[11px] text-slate-400 font-bold mt-1">
//                     {formatPercent(item.percentage)} of total leads ·{' '}
//                     {formatPercent(item.conversionRate)} prospect conversion
//                   </p>
//                 </div>
//               ))
//             )}
//           </div>
//         </Panel>

//         <Panel title="Monthly Lead Trend" subtitle="Leads generated month wise">
//           <div className="space-y-4">
//             {analytics.monthlyTrend.length === 0 ? (
//               <EmptyText text="No monthly trend data available." />
//             ) : (
//               analytics.monthlyTrend.map((item) => {
//                 const max = Math.max(...analytics.monthlyTrend.map((m) => m.count), 1);
//                 const width = (item.count / max) * 100;

//                 return (
//                   <div key={item.month}>
//                     <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
//                       <span>{item.month}</span>
//                       <span>{formatNumber(item.count)}</span>
//                     </div>
//                     <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-purple-500 rounded-full"
//                         style={{ width: `${width}%` }}
//                       />
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </Panel>
//       </div>

//       <Panel title="Campaign Lead Performance" subtitle="Budget allocated, spent and leads generated by campaign">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-slate-50 text-slate-500">
//               <tr>
//                 <th className="px-5 py-3 font-black">Campaign</th>
//                 <th className="px-5 py-3 font-black">Channel</th>
//                 <th className="px-5 py-3 font-black text-right">Budget Allocated</th>
//                 <th className="px-5 py-3 font-black text-right">Amount Spent</th>
//                 <th className="px-5 py-3 font-black text-right">Daily Budget</th>
//                 <th className="px-5 py-3 font-black text-right">Leads</th>
//                 <th className="px-5 py-3 font-black text-right">Cost / Lead</th>
//                 <th className="px-5 py-3 font-black text-center">Status</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-100">
//               {analytics.campaignPerformance.length === 0 ? (
//                 <tr>
//                   <td colSpan="8" className="px-5 py-10 text-center text-slate-400 font-bold">
//                     No campaigns found.
//                   </td>
//                 </tr>
//               ) : (
//                 analytics.campaignPerformance.map((campaign) => (
//                   <tr key={campaign.id} className="hover:bg-slate-50/80">
//                     <td className="px-5 py-4 font-black text-slate-900">{campaign.name}</td>
//                     <td className="px-5 py-4 font-bold text-slate-600">{campaign.type}</td>
//                     <td className="px-5 py-4 text-right font-bold">{campaign.type === 'EMAIL' ? 'N/A' : formatCurrency(campaign.budget)}</td>
//                     <td className="px-5 py-4 text-right font-bold">{campaign.type === 'EMAIL' ? 'N/A' : formatCurrency(campaign.spent)}</td>
//                     <td className="px-5 py-4 text-right font-bold">{campaign.dailyBudget > 0 ? formatCurrency(campaign.dailyBudget) : 'N/A'}</td>
//                     <td className="px-5 py-4 text-right font-bold">{formatNumber(campaign.leads)}</td>
//                     <td className="px-5 py-4 text-right font-black text-blue-600">{campaign.type === 'EMAIL' ? 'N/A' : formatCurrency(campaign.costPerLead)}</td>
//                     <td className="px-5 py-4 text-center">
//                       <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black">
//                         {campaign.status || 'DRAFT'}
//                       </span>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </Panel>

//       <Panel title="Lead Source Details" subtitle="Detailed source-wise lead breakdown">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-slate-50 text-slate-500">
//               <tr>
//                 <th className="px-5 py-3 font-black">Source</th>
//                 <th className="px-5 py-3 font-black text-right">Total Leads</th>
//                 <th className="px-5 py-3 font-black text-right">Contacted</th>
//                 <th className="px-5 py-3 font-black text-right">Qualified</th>
//                 <th className="px-5 py-3 font-black text-right">Prospects</th>
//                 <th className="px-5 py-3 font-black text-right">Share</th>
//                 <th className="px-5 py-3 font-black text-right">Conversion</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-100">
//               {analytics.sourcePerformance.length === 0 ? (
//                 <tr>
//                   <td colSpan="7" className="px-5 py-10 text-center text-slate-400 font-bold">
//                     No lead source data found.
//                   </td>
//                 </tr>
//               ) : (
//                 analytics.sourcePerformance.map((source) => (
//                   <tr key={source.source} className="hover:bg-slate-50">
//                     <td className="px-5 py-4 font-black text-slate-900">{source.source}</td>
//                     <td className="px-5 py-4 text-right font-bold">{formatNumber(source.leads)}</td>
//                     <td className="px-5 py-4 text-right font-bold">{formatNumber(source.contacted)}</td>
//                     <td className="px-5 py-4 text-right font-bold">{formatNumber(source.qualified)}</td>
//                     <td className="px-5 py-4 text-right font-bold">{formatNumber(source.prospects)}</td>
//                     <td className="px-5 py-4 text-right font-bold">{formatPercent(source.percentage)}</td>
//                     <td className="px-5 py-4 text-right font-black text-emerald-600">{formatPercent(source.conversionRate)}</td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </Panel>

//       <Panel title="Counsellor Performance" subtitle="Assigned, contacted, qualified, prospect, application and admission progress">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-slate-50 text-slate-500">
//               <tr>
//                 <th className="px-5 py-3 font-black">Counsellor</th>
//                 <th className="px-5 py-3 font-black text-right">Assigned</th>
//                 <th className="px-5 py-3 font-black text-right">Contacted</th>
//                 <th className="px-5 py-3 font-black text-right">Qualified</th>
//                 <th className="px-5 py-3 font-black text-right">Prospects</th>
//                 <th className="px-5 py-3 font-black text-right">Applications</th>
//                 <th className="px-5 py-3 font-black text-right">Admissions</th>
//                 <th className="px-5 py-3 font-black text-right">Conversion</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-100">
//               {analytics.counsellorPerformance.length === 0 ? (
//                 <tr>
//                   <td colSpan="8" className="px-5 py-10 text-center text-slate-400 font-bold">
//                     No counsellor data found.
//                   </td>
//                 </tr>
//               ) : (
//                 analytics.counsellorPerformance.map((c) => {
//                   const conversion = c.assigned > 0 ? (c.prospects / c.assigned) * 100 : 0;

//                   return (
//                     <tr key={c.name} className="hover:bg-slate-50">
//                       <td className="px-5 py-4 font-black text-slate-900">{c.name}</td>
//                       <td className="px-5 py-4 text-right font-bold">{formatNumber(c.assigned)}</td>
//                       <td className="px-5 py-4 text-right font-bold">{formatNumber(c.contacted)}</td>
//                       <td className="px-5 py-4 text-right font-bold">{formatNumber(c.qualified)}</td>
//                       <td className="px-5 py-4 text-right font-bold">{formatNumber(c.prospects)}</td>
//                       <td className="px-5 py-4 text-right font-bold">{formatNumber(c.applications)}</td>
//                       <td className="px-5 py-4 text-right font-bold">{formatNumber(c.admissions)}</td>
//                       <td className="px-5 py-4 text-right font-black text-blue-600">
//                         {formatPercent(conversion)}
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </Panel>
//     </div>
//   );
// }

// function KpiCard({ title, value, subtitle, icon, bg }) {
//   return (
//     <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <p className="text-sm font-black text-slate-500">{title}</p>
//           <h2 className="text-3xl font-black text-slate-900 mt-2">{value}</h2>
//           <p className="text-xs font-bold text-slate-400 mt-2">{subtitle}</p>
//         </div>

//         <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
//           {icon}
//         </div>
//       </div>
//     </div>
//   );
// }

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

// function EmptyText({ text }) {
//   return (
//     <div className="py-10 text-center text-sm font-bold text-slate-400">
//       {text}
//     </div>
//   );
// }

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

// const isConvertedLead = (lead) =>
//   Boolean(lead.convertedAt) ||
//   lead.status === 'CONVERTED' ||
//   lead.isStudentLoginCreated === true ||
//   Boolean(lead.studentUserId);

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
          costPerLead: spent > 0 && leadsCount > 0 ? spent / leadsCount : 0,
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
    <div className="min-h-screen bg-[#f6f8fb] p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Marketing Analytics
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Campaign budget, spend, leads, cost per lead, source performance and lead journey.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard title="Total Campaigns" value={formatNumber(analytics.totalCampaigns)} subtitle={`${analytics.activeCampaigns} active campaigns`} icon={<BarChart3 className="h-6 w-6 text-blue-600" />} bg="bg-blue-50" />
        <KpiCard title="Budget Allocated" value={formatCurrency(analytics.totalBudget)} subtitle="Total paid campaign budget" icon={<IndianRupee className="h-6 w-6 text-emerald-600" />} bg="bg-emerald-50" />
        <KpiCard title="Amount Spent" value={formatCurrency(analytics.totalSpent)} subtitle={`${formatPercent(analytics.budgetUsage)} budget used`} icon={<TrendingUp className="h-6 w-6 text-orange-600" />} bg="bg-orange-50" />
        <KpiCard title="Total Leads" value={formatNumber(analytics.totalLeads)} subtitle={`${analytics.contactedLeads} contacted leads`} icon={<Users className="h-6 w-6 text-purple-600" />} bg="bg-purple-50" />
        <KpiCard title="Cost Per Lead" value={formatCurrency(analytics.costPerLead)} subtitle="Spent amount / leads" icon={<Target className="h-6 w-6 text-rose-600" />} bg="bg-rose-50" />
        <KpiCard title="Lead Conversion" value={formatPercent(analytics.conversionRate)} subtitle={`${analytics.convertedLeads} converted students`} icon={<Zap className="h-6 w-6 text-yellow-600" />} bg="bg-yellow-50" />
        <KpiCard title="Campaign Efficiency" value={analytics.leadsPerThousand.toFixed(1)} subtitle="Leads per ₹1000 spent" icon={<Activity className="h-6 w-6 text-cyan-600" />} bg="bg-cyan-50" />
        <KpiCard title="Lead Response Time" value={analytics.avgResponseTime} subtitle="Average contactedAt - createdAt" icon={<Clock className="h-6 w-6 text-slate-600" />} bg="bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel title="Agency Funnel" subtitle="Lead journey through your agency">
          <div className="space-y-4">
            {analytics.funnel.map((item, index) => {
              const max = analytics.funnel[0]?.value || 1;
              const width = max > 0 ? (item.value / max) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                    <span>{index + 1}. {item.label}</span>
                    <span>{formatNumber(item.value)}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.max(width, item.value > 0 ? 8 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Lead Source Performance" subtitle="Leads coming from various sources">
          <div className="space-y-4">
            {analytics.sourcePerformance.length === 0 ? <EmptyText text="No source data available." /> : analytics.sourcePerformance.slice(0, 8).map((item) => (
              <div key={item.source}>
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                  <span>{item.source}</span>
                  <span>{formatNumber(item.leads)} leads</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 font-bold mt-1">
                  {formatPercent(item.percentage)} of total leads · {formatPercent(item.conversionRate)} converted
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Monthly Lead Trend" subtitle="Leads generated month wise">
          <div className="space-y-4">
            {analytics.monthlyTrend.length === 0 ? <EmptyText text="No monthly trend data available." /> : analytics.monthlyTrend.map((item) => {
              const max = Math.max(...analytics.monthlyTrend.map((month) => month.count), 1);
              const width = (item.count / max) * 100;
              return (
                <div key={item.month}>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                    <span>{item.month}</span>
                    <span>{formatNumber(item.count)}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>



      <Panel title="Lead Source Details" subtitle="Detailed source-wise lead breakdown">
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
                  <td className="px-5 py-4 text-right font-black text-emerald-600">{formatPercent(source.conversionRate)}</td>
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
                    <td className="px-5 py-4 text-right font-black text-blue-600">{formatPercent(conversion)}</td>
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

function KpiCard({ title, value, subtitle, icon, bg }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h2 className="text-3xl font-black text-slate-900 mt-2">{value}</h2>
          <p className="text-xs font-bold text-slate-400 mt-2">{subtitle}</p>
        </div>
        <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="text-xs font-bold text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div className="py-10 text-center text-sm font-bold text-slate-400">
      {text}
    </div>
  );
}
