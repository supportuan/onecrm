
// // // 'use client';

// // // import { useEffect, useMemo, useState } from 'react';
// // // import {
// // //   AlertCircle,
// // //   BarChart3,
// // //   CalendarClock,
// // //   IndianRupee,
// // //   Loader2,
// // //   Megaphone,
// // //   Plus,
// // //   RefreshCcw,
// // //   Target,
// // //   Users,
// // // } from 'lucide-react';
// // // import { getCampaigns, getLeads } from '../../services/marketingApi';

// // // const formatNumber = (v) => new Intl.NumberFormat('en-IN').format(Number(v || 0));

// // // const formatCurrency = (v) =>
// // //   new Intl.NumberFormat('en-IN', {
// // //     style: 'currency',
// // //     currency: 'INR',
// // //     maximumFractionDigits: 0,
// // //   }).format(Number(v || 0));

// // // const isToday = (dateValue) => {
// // //   if (!dateValue) return false;
// // //   const d = new Date(dateValue);
// // //   const today = new Date();
// // //   return d.toDateString() === today.toDateString();
// // // };

// // // const isContacted = (lead) => lead.contactedAt || lead.status === 'CONTACTED';
// // // const isQualified = (lead) => lead.qualifiedAt || lead.status === 'QUALIFIED';
// // // const isProposed = (lead) => lead.proposedAt || lead.status === 'PROPOSED';
// // // const isConverted = (lead) => lead.convertedAt || lead.status === 'CONVERTED';

// // // const getSourceName = (lead) =>
// // //   lead.source?.name || lead.sourceName || lead.source || 'Unknown';

// // // export default function MarketingDashboard() {
// // //   const [leads, setLeads] = useState([]);
// // //   const [campaigns, setCampaigns] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState('');

// // //   const fetchDashboard = async () => {
// // //     setLoading(true);
// // //     setError('');

// // //     try {
// // //       const [leadRes, campaignRes] = await Promise.all([
// // //         getLeads({ page: 1, limit: 1000, sortBy: 'createdAt', sortOrder: 'desc' }),
// // //         getCampaigns({ page: 1, limit: 1000 }),
// // //       ]);

// // //       if (!leadRes?.success || !campaignRes?.success) {
// // //         setError('Failed to load marketing dashboard.');
// // //         return;
// // //       }

// // //       setLeads(leadRes.data?.items || []);
// // //       setCampaigns(campaignRes.data?.items || []);
// // //     } catch (err) {
// // //       console.error(err);
// // //       setError('Connection error while loading dashboard.');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     fetchDashboard();
// // //   }, []);

// // //   const dashboard = useMemo(() => {
// // //     const totalLeads = leads.length;
// // //     const newToday = leads.filter((l) => isToday(l.createdAt)).length;
// // //     const pendingFollowUps = leads.filter(
// // //       (l) => !isContacted(l) && l.status !== 'CONVERTED' && l.status !== 'LOST'
// // //     ).length;

// // //     const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
// // //     const totalBudget = campaigns
// // //       .filter((c) => c.type !== 'EMAIL')
// // //       .reduce((sum, c) => sum + Number(c.budget || 0), 0);

// // //     const totalSpent = campaigns
// // //       .filter((c) => c.type !== 'EMAIL')
// // //       .reduce((sum, c) => sum + Number(c.spent || 0), 0);

// // //     const contacted = leads.filter(isContacted).length;
// // //     const qualified = leads.filter(isQualified).length;
// // //     const proposed = leads.filter(isProposed).length;
// // //     const converted = leads.filter(isConverted).length;

// // //     const recentLeads = leads.slice(0, 8);
// // //     const recentCampaigns = campaigns.slice(0, 6);

// // //     const sourceMap = {};
// // //     leads.forEach((lead) => {
// // //       const source = getSourceName(lead);
// // //       sourceMap[source] = (sourceMap[source] || 0) + 1;
// // //     });

// // //     const sources = Object.entries(sourceMap)
// // //       .map(([source, count]) => ({ source, count }))
// // //       .sort((a, b) => b.count - a.count)
// // //       .slice(0, 6);

// // //     return {
// // //       totalLeads,
// // //       newToday,
// // //       pendingFollowUps,
// // //       activeCampaigns,
// // //       totalBudget,
// // //       totalSpent,
// // //       contacted,
// // //       qualified,
// // //       proposed,
// // //       converted,
// // //       recentLeads,
// // //       recentCampaigns,
// // //       sources,
// // //     };
// // //   }, [leads, campaigns]);

// // //   if (loading) {
// // //     return (
// // //       <div className="flex items-center justify-center py-32">
// // //         <Loader2 className="h-9 w-9 animate-spin text-slate-700" />
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="min-h-screen bg-[#f6f8fb] p-6 space-y-6">
// // //       {error && (
// // //         <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
// // //           <AlertCircle className="h-5 w-5" />
// // //           {error}
// // //         </div>
// // //       )}

// // //       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
// // //         <KpiCard title="Total Leads" value={formatNumber(dashboard.totalLeads)} subtitle="All marketing leads" icon={<Users className="h-6 w-6 text-blue-600" />} bg="bg-blue-50" />
// // //         <KpiCard title="New Leads Today" value={formatNumber(dashboard.newToday)} subtitle="Created today" icon={<Plus className="h-6 w-6 text-emerald-600" />} bg="bg-emerald-50" />
// // //         <KpiCard title="Pending Follow-ups" value={formatNumber(dashboard.pendingFollowUps)} subtitle="Not contacted yet" icon={<CalendarClock className="h-6 w-6 text-orange-600" />} bg="bg-orange-50" />
// // //         <KpiCard title="Active Campaigns" value={formatNumber(dashboard.activeCampaigns)} subtitle="Currently active" icon={<Megaphone className="h-6 w-6 text-purple-600" />} bg="bg-purple-50" />
// // //       </div>

// // //       <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
// // //         <Panel title="Lead Journey Snapshot" subtitle="Current lead movement status" height="h-[420px]">
// // //           <FunnelItem label="Total Leads" value={dashboard.totalLeads} total={dashboard.totalLeads} />
// // //           <FunnelItem label="Contacted" value={dashboard.contacted} total={dashboard.totalLeads} />
// // //           <FunnelItem label="Qualified" value={dashboard.qualified} total={dashboard.totalLeads} />
// // //           <FunnelItem label="Proposed" value={dashboard.proposed} total={dashboard.totalLeads} />
// // //           <FunnelItem label="Converted" value={dashboard.converted} total={dashboard.totalLeads} />
// // //         </Panel>

// // //         <Panel title="Lead Source Snapshot" subtitle="Top lead sources" height="h-[420px]">
// // //           {dashboard.sources.length === 0 ? (
// // //             <EmptyText text="No source data available." />
// // //           ) : (
// // //             dashboard.sources.map((item) => (
// // //               <FunnelItem
// // //                 key={item.source}
// // //                 label={item.source}
// // //                 value={item.count}
// // //                 total={dashboard.totalLeads}
// // //               />
// // //             ))
// // //           )}
// // //         </Panel>

// // //         <Panel title="Quick Actions" subtitle="Common marketing actions" height="h-[420px]">
// // //           <div className="grid grid-cols-2 gap-4">
// // //             <QuickAction title="View Leads" href="/marketing/lead-management" />
// // //             <QuickAction title="Campaigns" href="/marketing/campaigns" />
// // //             <QuickAction title="Analytics" href="/marketing/marketing-analytics" />
// // //           </div>

// // //           <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
// // //             <p className="text-sm font-black text-slate-700">Budget Overview</p>
// // //             <div className="mt-4 space-y-3">
// // //               <InfoRow label="Budget Allocated" value={formatCurrency(dashboard.totalBudget)} />
// // //               <InfoRow label="Amount Spent" value={formatCurrency(dashboard.totalSpent)} />
// // //             </div>
// // //           </div>
// // //         </Panel>
// // //       </div>

// // //       <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
// // //         <Panel title="Recent Leads" subtitle="Latest leads added to the system" height="h-[520px]">
// // //           <div className="overflow-x-auto">
// // //             <table className="w-full text-sm text-left">
// // //               <thead className="bg-slate-50 text-slate-500">
// // //                 <tr>
// // //                   <th className="px-4 py-3 font-black">Lead</th>
// // //                   <th className="px-4 py-3 font-black">Source</th>
// // //                   <th className="px-4 py-3 font-black">Status</th>
// // //                   <th className="px-4 py-3 font-black">Counsellor</th>
// // //                 </tr>
// // //               </thead>
// // //               <tbody className="divide-y divide-slate-100">
// // //                 {dashboard.recentLeads.map((lead) => (
// // //                   <tr key={lead.id}>
// // //                     <td className="px-4 py-3 font-bold text-slate-900">
// // //                       {lead.fullName}
// // //                       <div className="text-xs text-slate-400">{lead.email}</div>
// // //                     </td>
// // //                     <td className="px-4 py-3 font-semibold text-slate-600">
// // //                       {getSourceName(lead)}
// // //                     </td>
// // //                     <td className="px-4 py-3 font-semibold text-slate-600">
// // //                       {lead.status || 'NEW'}
// // //                     </td>
// // //                     <td className="px-4 py-3 font-semibold text-slate-600">
// // //                       {lead.assignedCounsellor?.name || 'Unassigned'}
// // //                     </td>
// // //                   </tr>
// // //                 ))}
// // //               </tbody>
// // //             </table>
// // //           </div>
// // //         </Panel>

// // //         <Panel title="Active Campaign Overview" subtitle="Recent campaign performance" height="h-[520px]">
// // //           <div className="overflow-x-auto">
// // //             <table className="w-full text-sm text-left">
// // //               <thead className="bg-slate-50 text-slate-500">
// // //                 <tr>
// // //                   <th className="px-4 py-3 font-black">Campaign</th>
// // //                   <th className="px-4 py-3 font-black">Type</th>
// // //                   <th className="px-4 py-3 font-black text-right">Leads</th>
// // //                   <th className="px-4 py-3 font-black text-right">Spent</th>
// // //                 </tr>
// // //               </thead>
// // //               <tbody className="divide-y divide-slate-100">
// // //                 {dashboard.recentCampaigns.map((campaign) => (
// // //                   <tr key={campaign.id}>
// // //                     <td className="px-4 py-3 font-bold text-slate-900">{campaign.name}</td>
// // //                     <td className="px-4 py-3 font-semibold text-slate-600">{campaign.type}</td>
// // //                     <td className="px-4 py-3 text-right font-semibold">
// // //                       {formatNumber(campaign.leadsCount || 0)}
// // //                     </td>
// // //                     <td className="px-4 py-3 text-right font-semibold">
// // //                       {campaign.type === 'EMAIL' ? 'N/A' : formatCurrency(campaign.spent)}
// // //                     </td>
// // //                   </tr>
// // //                 ))}
// // //               </tbody>
// // //             </table>
// // //           </div>
// // //         </Panel>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // function KpiCard({ title, value, subtitle, icon, bg }) {
// // //   return (
// // //     <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
// // //       <div className="flex items-start justify-between gap-4">
// // //         <div>
// // //           <p className="text-sm font-black text-slate-500">{title}</p>
// // //           <h2 className="text-3xl font-black text-slate-900 mt-2">{value}</h2>
// // //           <p className="text-xs font-bold text-slate-400 mt-2">{subtitle}</p>
// // //         </div>
// // //         <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
// // //           {icon}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // function Panel({ title, subtitle, children, height = 'h-auto' }) {
// // //   return (
// // //     <div className={`bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col ${height}`}>
// // //       <div className="px-5 py-4 border-b border-slate-100 flex-shrink-0">
// // //         <h2 className="text-lg font-black text-slate-900">{title}</h2>
// // //         <p className="text-xs font-bold text-slate-400 mt-0.5">{subtitle}</p>
// // //       </div>
// // //       <div className="flex-1 overflow-y-auto p-5">{children}</div>
// // //     </div>
// // //   );
// // // }

// // // function FunnelItem({ label, value, total }) {
// // //   const width = total > 0 ? Math.max((value / total) * 100, value > 0 ? 8 : 0) : 0;

// // //   return (
// // //     <div className="mb-4">
// // //       <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
// // //         <span>{label}</span>
// // //         <span>{formatNumber(value)}</span>
// // //       </div>
// // //       <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
// // //         <div className="h-full bg-blue-600 rounded-full" style={{ width: `${width}%` }} />
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // function QuickAction({ title, href }) {
// // //   return (
// // //     <a
// // //       href={href}
// // //       className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-5 text-center text-sm font-black text-slate-700 transition"
// // //     >
// // //       {title}
// // //     </a>
// // //   );
// // // }

// // // function InfoRow({ label, value }) {
// // //   return (
// // //     <div className="flex items-center justify-between text-sm">
// // //       <span className="font-bold text-slate-500">{label}</span>
// // //       <span className="font-black text-slate-900">{value}</span>
// // //     </div>
// // //   );
// // // }

// // // function EmptyText({ text }) {
// // //   return <div className="py-10 text-center text-sm font-bold text-slate-400">{text}</div>;
// // // }


// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   AlertCircle,
//   Calendar,
//   CalendarClock,
//   FileText,
//   GraduationCap,
//   Loader2,
//   Megaphone,
//   MessageSquare,
//   Plus,
//   RefreshCw,
//   Send,
//   Upload,
//   Users,
// } from 'lucide-react';

// import { getCampaigns, getLeads } from '../../services/marketingApi';


// const DATE_FILTERS = [
//   { label: 'Today', value: 'today' },
//   { label: 'Week', value: 'week' },
//   { label: 'Month', value: 'month' },
//   { label: 'Quarterly', value: 'quarter' },
//   { label: 'Half Yearly', value: 'halfyear' },
//   { label: 'Annually', value: 'year' },
//   { label: 'All', value: 'all' },
// ];

// const formatNumber = (value) =>
//   new Intl.NumberFormat('en-IN').format(Number(value || 0));

// const formatCurrency = (value) =>
//   new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0,
//   }).format(Number(value || 0));

// const getStartDateByFilter = (filter) => {
//   const now = new Date();
//   const start = new Date(now);

//   if (filter === 'today') {
//     start.setHours(0, 0, 0, 0);
//     return start;
//   }

//   if (filter === 'week') {
//     start.setDate(now.getDate() - 7);
//     return start;
//   }

//   if (filter === 'month') {
//     start.setMonth(now.getMonth() - 1);
//     return start;
//   }

//   if (filter === 'quarter') {
//     start.setMonth(now.getMonth() - 3);
//     return start;
//   }

//   if (filter === 'halfyear') {
//     start.setMonth(now.getMonth() - 6);
//     return start;
//   }

//   if (filter === 'year') {
//     start.setFullYear(now.getFullYear() - 1);
//     return start;
//   }

//   return null;
// };

// const isWithinDateFilter = (dateValue, filter) => {
//   if (filter === 'all') return true;
//   if (!dateValue) return false;

//   const startDate = getStartDateByFilter(filter);
//   const date = new Date(dateValue);

//   return date >= startDate;
// };

// const isToday = (dateValue) => {
//   if (!dateValue) return false;
//   const date = new Date(dateValue);
//   const today = new Date();
//   return date.toDateString() === today.toDateString();
// };

// const isContacted = (lead) =>
//   Boolean(lead.contactedAt) || lead.status === 'CONTACTED';

// const isQualified = (lead) =>
//   Boolean(lead.qualifiedAt) || lead.status === 'QUALIFIED';

// const isProposed = (lead) =>
//   Boolean(lead.proposedAt) || lead.status === 'PROPOSED';

// const isConverted = (lead) =>
//   Boolean(lead.convertedAt) || lead.status === 'CONVERTED';

// const getSourceName = (lead) =>
//   lead.source?.name || lead.sourceName || lead.source || 'Unknown';

// const getCampaignLeads = (campaign) =>
//   Number(campaign.leadsCount || campaign.totalLeads || campaign.leads?.length || 0);

// const getInitials = (name = '') =>
//   name
//     .split(' ')
//     .map((part) => part[0])
//     .join('')
//     .slice(0, 2)
//     .toUpperCase();

// const MarketingDashboard = () => {
//   const router = useRouter();

//   const [leads, setLeads] = useState([]);
//   const [campaigns, setCampaigns] = useState([]);
//   const [dateFilter, setDateFilter] = useState('month');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const fetchDashboard = async () => {
//     setLoading(true);
//     setError('');

//     try {
//       const [leadRes, campaignRes] = await Promise.all([
//         getLeads({
//           page: 1,
//           limit: 1000,
//           sortBy: 'createdAt',
//           sortOrder: 'desc',
//         }),
//         getCampaigns({
//           page: 1,
//           limit: 1000,
//           sortBy: 'createdAt',
//           sortOrder: 'desc',
//         }),
//       ]);

//       if (!leadRes?.success || !campaignRes?.success) {
//         setError('Failed to load marketing dashboard.');
//         return;
//       }

//       setLeads(leadRes.data?.items || []);
//       setCampaigns(campaignRes.data?.items || []);
//     } catch (err) {
//       console.error(err);
//       setError('Connection error while loading marketing dashboard.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboard();
//   }, []);

//   const dashboard = useMemo(() => {
//     const filteredLeads = leads.filter((lead) =>
//       isWithinDateFilter(lead.createdAt, dateFilter)
//     );

//     const filteredCampaigns = campaigns.filter((campaign) =>
//       isWithinDateFilter(campaign.createdAt || campaign.startDate, dateFilter)
//     );

//     const totalLeads = filteredLeads.length;

//     const newLeadsToday = filteredLeads.filter((lead) =>
//       isToday(lead.createdAt)
//     ).length;

//     const pendingFollowUps = filteredLeads.filter(
//       (lead) =>
//         !isContacted(lead) &&
//         lead.status !== 'CONVERTED' &&
//         lead.status !== 'LOST'
//     ).length;

//     const activeCampaigns = filteredCampaigns.filter(
//       (campaign) => campaign.status === 'ACTIVE'
//     ).length;

//     const contacted = filteredLeads.filter(isContacted).length;
//     const qualified = filteredLeads.filter(isQualified).length;
//     const proposed = filteredLeads.filter(isProposed).length;
//     const converted = filteredLeads.filter(isConverted).length;

//     const paidCampaigns = filteredCampaigns.filter(
//       (campaign) => campaign.type !== 'EMAIL'
//     );

//     const totalBudget = paidCampaigns.reduce(
//       (sum, campaign) => sum + Number(campaign.budget || 0),
//       0
//     );

//     const totalSpent = paidCampaigns.reduce(
//       (sum, campaign) => sum + Number(campaign.spent || 0),
//       0
//     );

//     const sourceMap = {};

//     filteredLeads.forEach((lead) => {
//       const source = getSourceName(lead);
//       sourceMap[source] = (sourceMap[source] || 0) + 1;
//     });

//     const sources = Object.entries(sourceMap)
//       .map(([source, count]) => ({
//         source,
//         count,
//         percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
//       }))
//       .sort((a, b) => b.count - a.count)
//       .slice(0, 6);

//     const recentLeads = filteredLeads.slice(0, 8);

//     const recentCampaigns = filteredCampaigns
//       .slice()
//       .sort((a, b) => getCampaignLeads(b) - getCampaignLeads(a))
//       .slice(0, 6);

//     return {
//       totalLeads,
//       newLeadsToday,
//       pendingFollowUps,
//       activeCampaigns,
//       contacted,
//       qualified,
//       proposed,
//       converted,
//       totalBudget,
//       totalSpent,
//       sources,
//       recentLeads,
//       recentCampaigns,
//     };
//   }, [leads, campaigns, dateFilter]);

//   if (loading) {
//     return (
//       <div className="p-8 space-y-8 animate-pulse ui-page">
//         <div className="flex items-center justify-between">
//           <div className="h-10 w-96 rounded-xl bg-slate-200" />
//           <div className="h-10 w-28 rounded-xl bg-slate-200" />
//         </div>

//         <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
//           {[1, 2, 3, 4].map((item) => (
//             <div
//               key={item}
//               className="h-32 rounded-[20px] border border-neutral-100 bg-slate-200"
//             />
//           ))}
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
//           <div className="h-[420px] bg-slate-200 rounded-[20px]" />
//           <div className="h-[420px] bg-slate-200 rounded-[20px]" />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="ui-page text-neutral-800 antialiased font-sans">
//       <div className="ui-container space-y-6">
//         <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

//           <div className="flex flex-wrap gap-3">

//             <select
//               value={dateFilter}
//               onChange={(e) => setDateFilter(e.target.value)}
//               className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold"
//             >
//               <option value="today">Today</option>
//               <option value="week">This Week</option>
//               <option value="month">This Month</option>
//               <option value="quarter">Quarterly</option>
//               <option value="halfyear">Half Yearly</option>
//               <option value="year">Yearly</option>
//               <option value="all">All Time</option>
//             </select>
//           </div>

//           <div className="flex gap-3">

//             <button className="rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50">
//               Export
//             </button>

//             <button
//               onClick={fetchDashboard}
//               className="rounded-xl bg-[#1a365d] text-white px-4 py-2 flex items-center gap-2"
//             >
//               <RefreshCw size={16} />
//               Refresh
//             </button>

//           </div>

//         </div>

//         {error && (
//           <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
//             <AlertCircle className="h-5 w-5" />
//             {error}
//           </div>
//         )}

//         <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
//           <KpiCard
//             title="Total Leads"
//             value={formatNumber(dashboard.totalLeads)}
//             trend="Marketing leads in selected period"
//             icon={<Users className="h-5 w-5" />}
//           />

//           <KpiCard
//             title="New Leads Today"
//             value={formatNumber(dashboard.newLeadsToday)}
//             trend="Created today"
//             icon={<Plus className="h-5 w-5" />}
//           />

//           <KpiCard
//             title="Pending Follow-ups"
//             value={formatNumber(dashboard.pendingFollowUps)}
//             trend="Not contacted yet"
//             icon={<CalendarClock className="h-5 w-5" />}
//           />

//           <KpiCard
//             title="Active Campaigns"
//             value={formatNumber(dashboard.activeCampaigns)}
//             trend="Campaigns in selected period"
//             icon={<Megaphone className="h-5 w-5" />}
//           />
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
//           <Panel
//             title="Lead Journey Snapshot"
//             subtitle="Current movement of marketing leads"
//             height="h-[420px]"
//           >
//             <JourneyBar
//               label="Total Leads"
//               value={dashboard.totalLeads}
//               total={dashboard.totalLeads}
//               color="bg-[#1e3a8a]"
//             />
//             <JourneyBar
//               label="Contacted"
//               value={dashboard.contacted}
//               total={dashboard.totalLeads}
//               color="bg-[#0ea5e9]"
//             />
//             <JourneyBar
//               label="Qualified"
//               value={dashboard.qualified}
//               total={dashboard.totalLeads}
//               color="bg-[#22c55e]"
//             />
//             <JourneyBar
//               label="Proposed"
//               value={dashboard.proposed}
//               total={dashboard.totalLeads}
//               color="bg-[#8b5cf6]"
//             />
//             <JourneyBar
//               label="Converted"
//               value={dashboard.converted}
//               total={dashboard.totalLeads}
//               color="bg-[#f97316]"
//             />

//             <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
//               <InfoRow
//                 label="Budget Allocated"
//                 value={formatCurrency(dashboard.totalBudget)}
//               />
//               <div className="mt-3">
//                 <InfoRow
//                   label="Amount Spent"
//                   value={formatCurrency(dashboard.totalSpent)}
//                 />
//               </div>
//             </div>
//           </Panel>

//           <div className="rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm flex flex-col justify-between h-[420px]">
//             <div>
//               <h2 className="text-[17px] font-extrabold text-neutral-900">
//                 Quick Actions
//               </h2>
//               <p className="text-[12px] text-neutral-500 mt-1 font-medium">
//                 Fast access to common marketing tasks
//               </p>

//               <div className="mt-6 grid grid-cols-3 gap-3">


//                 <QuickButton
//                   title="Leads"
//                   icon={<FileText className="h-5 w-5 mb-1.5" />}
//                   className="bg-[#ff8c00] text-white"
//                   onClick={() => router.push('/marketing/lead-management')}
//                 />

//                 <QuickButton
//                   title="Campaigns"
//                   icon={<Send className="h-5 w-5 mb-1.5" />}
//                   className="bg-[#0ea5e9] text-white"
//                   onClick={() => router.push('/marketing/campaigns')}
//                 />


//                 <QuickButton
//                   title="Upload"
//                   icon={<Upload className="h-5 w-5 mb-1.5" />}
//                   className="bg-slate-100 hover:bg-slate-200 text-neutral-800 border border-neutral-200/50"
//                   onClick={() => router.push('/marketing/leads')}
//                 />

//                 <QuickButton
//                   title="Analytics"
//                   icon={<MessageSquare className="h-5 w-5 mb-1.5" />}
//                   className="bg-slate-200 hover:bg-slate-300 text-neutral-800 border border-slate-300/50"
//                   onClick={() => router.push('/marketing/marketing-analytics')}
//                 />
//               </div>
//             </div>

//             <div className="mt-5 pt-4 border-t border-neutral-100">
//               <div className="rounded-xl bg-neutral-50 p-3 text-neutral-500 text-[11px] leading-relaxed font-medium">
//                 <strong>Tip:</strong> Start with pending follow-ups. These are
//                 leads that have not been contacted yet.
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid gap-6 xl:grid-cols-2">
//           <Panel
//             title="Lead Source Snapshot"
//             subtitle="Top sources bringing leads"
//             height="h-[420px]"
//           >
//             {dashboard.sources.length === 0 ? (
//               <EmptyText text="No lead source data available." />
//             ) : (
//               dashboard.sources.map((item) => (
//                 <JourneyBar
//                   key={item.source}
//                   label={item.source}
//                   value={item.count}
//                   total={dashboard.totalLeads}
//                   color="bg-[#0ea5e9]"
//                   helper={`${item.percentage.toFixed(1)}% of total leads`}
//                 />
//               ))
//             )}
//           </Panel>

//           <Panel
//             title="Recent Leads"
//             subtitle="Latest marketing leads in selected period"
//             height="h-[420px]"
//           >
//             {dashboard.recentLeads.length === 0 ? (
//               <EmptyText text="No recent leads found." />
//             ) : (
//               <div className="space-y-3">
//                 {dashboard.recentLeads.map((lead) => (
//                   <div
//                     key={lead.id}
//                     className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
//                   >
//                     <div className="flex items-center gap-3 min-w-0">
//                       <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-neutral-200 text-xs font-extrabold text-neutral-700">
//                         {getInitials(lead.fullName)}
//                       </div>

//                       <div className="min-w-0">
//                         <p className="truncate text-sm font-extrabold text-neutral-900">
//                           {lead.fullName}
//                         </p>
//                         <p className="truncate text-xs font-semibold text-neutral-500">
//                           {lead.email || lead.phone || 'No contact'}
//                         </p>
//                       </div>
//                     </div>

//                     <div className="text-right shrink-0">
//                       <p className="text-xs font-bold text-neutral-500">
//                         {getSourceName(lead)}
//                       </p>
//                       <p className="mt-1 text-[11px] font-extrabold text-neutral-700">
//                         {lead.status || 'NEW'}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Panel>
//         </div>

//         <Panel
//           title="Active Campaign Overview"
//           subtitle="Campaigns ranked by leads generated"
//           height="h-[430px]"
//         >
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm text-left">
//               <thead className="bg-neutral-50 text-neutral-500">
//                 <tr>
//                   <th className="px-5 py-3 font-extrabold">Campaign</th>
//                   <th className="px-5 py-3 font-extrabold">Type</th>
//                   <th className="px-5 py-3 font-extrabold text-right">Leads</th>
//                   <th className="px-5 py-3 font-extrabold text-right">Budget</th>
//                   <th className="px-5 py-3 font-extrabold text-right">Spent</th>
//                   <th className="px-5 py-3 font-extrabold text-center">Status</th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-neutral-100">
//                 {dashboard.recentCampaigns.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan="6"
//                       className="px-5 py-10 text-center text-sm font-bold text-neutral-400"
//                     >
//                       No campaigns found.
//                     </td>
//                   </tr>
//                 ) : (
//                   dashboard.recentCampaigns.map((campaign) => (
//                     <tr key={campaign.id} className="hover:bg-neutral-50">
//                       <td className="px-5 py-4 font-extrabold text-neutral-900">
//                         {campaign.name}
//                       </td>
//                       <td className="px-5 py-4 font-bold text-neutral-600">
//                         {campaign.type}
//                       </td>
//                       <td className="px-5 py-4 text-right font-bold">
//                         {formatNumber(getCampaignLeads(campaign))}
//                       </td>
//                       <td className="px-5 py-4 text-right font-bold">
//                         {campaign.type === 'EMAIL'
//                           ? 'N/A'
//                           : formatCurrency(campaign.budget)}
//                       </td>
//                       <td className="px-5 py-4 text-right font-bold">
//                         {campaign.type === 'EMAIL'
//                           ? 'N/A'
//                           : formatCurrency(campaign.spent)}
//                       </td>
//                       <td className="px-5 py-4 text-center">
//                         <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
//                           {campaign.status || 'DRAFT'}
//                         </span>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </Panel>
//       </div>
//     </div>
//   );
// };

// function KpiCard({ title, value, trend, icon }) {
//   return (
//     <div className="group relative overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
//       <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-neutral-50 opacity-80 group-hover:scale-110 transition-transform duration-300" />

//       <div className="relative flex items-center justify-between">
//         <span className="text-[13px] font-bold tracking-normal text-neutral-500">
//           {title}
//         </span>

//         <div className="text-neutral-700 bg-neutral-50 p-2 rounded-xl border border-neutral-100 group-hover:scale-110 transition-transform duration-200">
//           {icon}
//         </div>
//       </div>

//       <div className="relative mt-4">
//         <h3 className="text-[28px] font-extrabold text-neutral-900 tracking-tight">
//           {value}
//         </h3>

//         <div className="mt-3 flex items-center gap-1 text-[13px] text-emerald-500 font-extrabold">
//           <span>{trend}</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Panel({ title, subtitle, children, height = 'h-auto' }) {
//   return (
//     <div
//       className={`rounded-[20px] border border-neutral-200 bg-white shadow-sm flex flex-col overflow-hidden ${height}`}
//     >
//       <div className="flex-shrink-0 p-6 border-b border-neutral-100">
//         <h2 className="text-[17px] font-extrabold text-neutral-900">
//           {title}
//         </h2>
//         <p className="text-[12px] text-neutral-500 mt-1 font-medium">
//           {subtitle}
//         </p>
//       </div>

//       <div className="flex-1 overflow-y-auto p-6">{children}</div>
//     </div>
//   );
// }

// function JourneyBar({ label, value, total, color, helper }) {
//   const width =
//     total > 0
//       ? Math.max((Number(value || 0) / total) * 100, value > 0 ? 8 : 0)
//       : 0;

//   return (
//     <div className="space-y-1.5 mb-5">
//       <div className="flex justify-between text-xs font-bold text-neutral-500">
//         <span>{label}</span>
//         <span className="text-neutral-900 font-extrabold">
//           {formatNumber(value)}
//         </span>
//       </div>

//       <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
//         <div
//           className={`h-full ${color} rounded-full transition-all duration-500`}
//           style={{ width: `${width}%` }}
//         />
//       </div>

//       {helper && (
//         <p className="text-[11px] font-semibold text-neutral-400">{helper}</p>
//       )}
//     </div>
//   );
// }

// function QuickButton({ title, icon, className, onClick }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`flex flex-col items-center justify-center rounded-[14px] p-4 font-semibold text-xs transition duration-200 hover:opacity-90 active:scale-95 shadow-sm min-h-[92px] ${className}`}
//     >
//       {icon}
//       <span className="text-[10px] sm:text-xs font-bold leading-tight">
//         {title}
//       </span>
//     </button>
//   );
// }

// function InfoRow({ label, value }) {
//   return (
//     <div className="flex items-center justify-between text-sm">
//       <span className="font-bold text-neutral-500">{label}</span>
//       <span className="font-extrabold text-neutral-900">{value}</span>
//     </div>
//   );
// }

// function EmptyText({ text }) {
//   return (
//     <div className="flex h-full items-center justify-center text-sm font-bold text-neutral-400">
//       {text}
//     </div>
//   );
// }

// export default MarketingDashboard;


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

const isContacted = (lead) =>
  Boolean(lead.contactedAt) || lead.status === 'CONTACTED';

const isQualified = (lead) =>
  Boolean(lead.qualifiedAt) || lead.status === 'QUALIFIED';

const isProposed = (lead) =>
  Boolean(lead.proposedAt) || lead.status === 'PROPOSED';

const isConverted = (lead) =>
  Boolean(lead.convertedAt) || lead.status === 'CONVERTED';

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
        !isContacted(lead) &&
        lead.status !== 'CONVERTED' &&
        lead.status !== 'LOST'
    ).length;

    const activeCampaigns = filteredCampaigns.filter(
      (campaign) => campaign.status === 'ACTIVE'
    ).length;

    const contacted = filteredLeads.filter(isContacted).length;
    const qualified = filteredLeads.filter(isQualified).length;
    const proposed = filteredLeads.filter(isProposed).length;
    const converted = filteredLeads.filter(isConverted).length;

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
      qualified,
      proposed,
      converted,
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
    <div className="ui-page text-neutral-800 antialiased font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleBulkUpload}
        className="hidden"
      />

      <div className="ui-container space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
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
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1a365d] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#223f6b] active:scale-95 cursor-pointer"
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
          />

          <KpiCard
            title="New Leads Today"
            value={formatNumber(dashboard.newLeadsToday)}
            trend="Created today"
            icon={<Plus className="h-5 w-5" />}
          />

          <KpiCard
            title="Pending Follow-ups"
            value={formatNumber(dashboard.pendingFollowUps)}
            trend="Not contacted yet"
            icon={<CalendarClock className="h-5 w-5" />}
          />

          <KpiCard
            title="Active Campaigns"
            value={formatNumber(dashboard.activeCampaigns)}
            trend="Campaigns in selected period"
            icon={<Megaphone className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <Panel
            title="Lead Journey Snapshot"
            subtitle="Current movement of marketing leads"
            height="h-[420px]"
          >
            <JourneyBar label="Total Leads" value={dashboard.totalLeads} total={dashboard.totalLeads} color="bg-[#1e3a8a]" />
            <JourneyBar label="Contacted" value={dashboard.contacted} total={dashboard.totalLeads} color="bg-[#0ea5e9]" />
            <JourneyBar label="Qualified" value={dashboard.qualified} total={dashboard.totalLeads} color="bg-[#22c55e]" />
            <JourneyBar label="Proposed" value={dashboard.proposed} total={dashboard.totalLeads} color="bg-[#8b5cf6]" />
            <JourneyBar label="Converted" value={dashboard.converted} total={dashboard.totalLeads} color="bg-[#f97316]" />

            <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <InfoRow label="Budget Allocated" value={formatCurrency(dashboard.totalBudget)} />
              <div className="mt-3">
                <InfoRow label="Amount Spent" value={formatCurrency(dashboard.totalSpent)} />
              </div>
            </div>
          </Panel>

          <div className="flex h-[420px] flex-col justify-between rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-[17px] font-extrabold text-neutral-900">
                Quick Actions
              </h2>
              <p className="mt-1 text-[12px] font-medium text-neutral-500">
                Fast access to common marketing tasks
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                

                <QuickButton
                  title="Leads"
                  icon={<FileText className="mb-1.5 h-5 w-5" />}
                  className="border border-slate-300/50 bg-slate-200 text-neutral-800 hover:bg-slate-300"
                  onClick={() => router.push('/marketing/lead-management')}
                />

                <QuickButton
                  title="Campaigns"
                  icon={<Send className="mb-1.5 h-5 w-5" />}
                  className="border border-slate-300/50 bg-slate-200 text-neutral-800 hover:bg-slate-300"
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
                  className="border border-neutral-200/50 bg-slate-100 text-neutral-800 hover:bg-slate-200"
                  disabled={uploadingLeads}
                  onClick={() => fileInputRef.current?.click()}
                />

                <QuickButton
                  title="Analytics"
                  icon={<MessageSquare className="mb-1.5 h-5 w-5" />}
                  className="border border-slate-300/50 bg-slate-200 text-neutral-800 hover:bg-slate-300"
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
          <Panel title="Lead Source Snapshot" subtitle="Top sources bringing leads" height="h-[420px]">
            {dashboard.sources.length === 0 ? (
              <EmptyText text="No lead source data available." />
            ) : (
              dashboard.sources.map((item) => (
                <JourneyBar
                  key={item.source}
                  label={item.source}
                  value={item.count}
                  total={dashboard.totalLeads}
                  color="bg-[#0ea5e9]"
                  helper={`${item.percentage.toFixed(1)}% of total leads`}
                />
              ))
            )}
          </Panel>

          <Panel title="Recent Leads" subtitle="Latest marketing leads in selected period" height="h-[420px]">
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
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-extrabold text-neutral-700">
                        {getInitials(lead.fullName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-neutral-900">
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

function KpiCard({ title, value, trend, icon }) {
  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-neutral-50 opacity-80 transition-transform duration-300 group-hover:scale-110" />

      <div className="relative flex items-center justify-between">
        <span className="text-[13px] font-bold tracking-normal text-neutral-500">
          {title}
        </span>

        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-2 text-neutral-700 transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
      </div>

      <div className="relative mt-4">
        <h3 className="text-[28px] font-extrabold tracking-tight text-neutral-900">
          {value}
        </h3>

        <div className="mt-3 flex items-center gap-1 text-[13px] font-extrabold text-emerald-500">
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, height = 'h-auto' }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[20px] border border-neutral-200 bg-white shadow-sm ${height}`}
    >
      <div className="flex-shrink-0 border-b border-neutral-100 p-6">
        <h2 className="text-[17px] font-extrabold text-neutral-900">
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

function JourneyBar({ label, value, total, color, helper }) {
  const width =
    total > 0
      ? Math.max((Number(value || 0) / total) * 100, value > 0 ? 8 : 0)
      : 0;

  return (
    <div className="mb-5 space-y-1.5">
      <div className="flex justify-between text-xs font-bold text-neutral-500">
        <span>{label}</span>
        <span className="font-extrabold text-neutral-900">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
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
      {icon}
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
      <span className="font-extrabold text-neutral-900">{value}</span>
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