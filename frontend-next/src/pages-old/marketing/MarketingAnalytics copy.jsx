// 'use client';

// import { useEffect, useState } from 'react';
// import { getMarketingAnalyticsSummaryApi } from '../../services/marketingApi';
// import {
//   BarChart3,
//   TrendingUp,
//   Loader2,
//   AlertCircle,
//   ChevronDown,
//   Eye,
// } from 'lucide-react';

// // ─── Sparkline Mini Component ───
// const Sparkline = ({ trend, color = '#10b981' }) => {
//   // Generate a smooth 7-point sparkline based on trend direction
//   const trendVal = typeof trend === 'number' ? trend : parseFloat(trend) || 0;
//   const isPositive = trendVal >= 0;
//   const baseColor = isPositive ? color : '#ef4444';

//   // Create ascending or descending sparkline points
//   const points = isPositive
//     ? [18, 14, 16, 10, 12, 6, 4]
//     : [4, 6, 8, 12, 10, 14, 18];

//   const pathData = points
//     .map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 8} ${y}`)
//     .join(' ');

//   return (
//     <svg width="48" height="22" viewBox="0 0 48 22" fill="none">
//       <path
//         d={pathData}
//         stroke={baseColor}
//         strokeWidth="2"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         fill="none"
//       />
//     </svg>
//   );
// };

// // ─── Format number with commas ───
// const formatNumber = (val) => {
//   if (val === undefined || val === null) return '—';
//   if (typeof val === 'number') {
//     if (val >= 1000) return val.toLocaleString();
//     return val.toString();
//   }
//   return val;
// };

// // ─── Format metric display value ───
// const formatMetricValue = (key, value) => {
//   if (key === 'Email Open Rate' || key === 'Click-Through Rate (CTR)') {
//     return `${value}%`;
//   }
//   return formatNumber(value);
// };

// // ─── Format trend display value ───
// const formatTrend = (trend) => {
//   if (trend === undefined || trend === null) return '';
//   const val = typeof trend === 'number' ? trend : parseFloat(trend);
//   if (isNaN(val)) return '';
//   return `${val > 0 ? '+' : ''}${val}%`;
// };

// const MarketingAnalytics = () => {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [period, setPeriod] = useState('30days');
//   const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

//   const periods = [
//     { value: '7days', label: 'Last 7 days' },
//     { value: '30days', label: 'Last 30 days' },
//     { value: '60days', label: 'Last 60 days' },
//     { value: '90days', label: 'Last 90 days' },
//   ];

//   const fetchData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await getMarketingAnalyticsSummaryApi(period);
//       if (response.success && response.data) {
//         setData(response.data);
//       } else {
//         setError(response.message || 'Failed to load analytics data');
//       }
//     } catch (err) {
//       console.error(err);
//       setError('Unable to connect to the Marketing Analytics API.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [period]);

//   // ─── Chart color palette ───
//   const pieColors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
//   const pieLabels = ['Google Ads', 'Social Media', 'Referrals', 'Others'];

//   // ─── Render Area Chart SVG ───
//   const renderAreaChart = () => {
//     if (!data?.performanceOverview || data.performanceOverview.length === 0)
//       return null;

//     const perf = data.performanceOverview;
//     const maxVal = Math.max(
//       ...perf.map((p) => Math.max(p.opens, p.clicks, p.conversions))
//     );
//     const chartW = 580;
//     const chartH = 200;
//     const padL = 45;
//     const padR = 10;
//     const padT = 15;
//     const padB = 30;
//     const plotW = chartW - padL - padR;
//     const plotH = chartH - padT - padB;

//     const getX = (i) => padL + (i / (perf.length - 1)) * plotW;
//     const getY = (val) => padT + plotH - (val / maxVal) * plotH;

//     const makePath = (key) =>
//       perf
//         .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p[key]).toFixed(1)}`)
//         .join(' ');

//     const makeAreaPath = (key) => {
//       const line = makePath(key);
//       const lastX = getX(perf.length - 1).toFixed(1);
//       const firstX = getX(0).toFixed(1);
//       const bottom = (padT + plotH).toFixed(1);
//       return `${line} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
//     };

//     // Y-axis ticks
//     const yTicks = [0, 1000, 2000, 3000, 4000, 5000];
//     // X-axis labels
//     const xLabels = ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'];
//     const xLabelIndices = [0, 4, 9, 14, 19, 24, 29];

//     return (
//       <svg
//         width="100%"
//         viewBox={`0 0 ${chartW} ${chartH}`}
//         preserveAspectRatio="xMidYMid meet"
//         className="block"
//       >
//         {/* Grid lines */}
//         {yTicks.map((tick) => (
//           <g key={tick}>
//             <line
//               x1={padL}
//               y1={getY(tick)}
//               x2={chartW - padR}
//               y2={getY(tick)}
//               stroke="#f1f5f9"
//               strokeWidth="1"
//             />
//             <text
//               x={padL - 6}
//               y={getY(tick) + 3}
//               textAnchor="end"
//               fill="#94a3b8"
//               fontSize="9"
//               fontWeight="600"
//             >
//               {tick >= 1000 ? `${(tick / 1000).toFixed(0)},000` : tick}
//             </text>
//           </g>
//         ))}

//         {/* Area fills */}
//         <defs>
//           <linearGradient id="opensGrad" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
//             <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.02" />
//           </linearGradient>
//           <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
//             <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
//           </linearGradient>
//           <linearGradient id="convsGrad" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
//             <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
//           </linearGradient>
//         </defs>

//         <path d={makeAreaPath('opens')} fill="url(#opensGrad)" />
//         <path d={makeAreaPath('clicks')} fill="url(#clicksGrad)" />
//         <path d={makeAreaPath('conversions')} fill="url(#convsGrad)" />

//         {/* Lines */}
//         <path d={makePath('opens')} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
//         <path d={makePath('clicks')} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
//         <path d={makePath('conversions')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

//         {/* X-axis labels */}
//         {xLabelIndices.map((idx) => {
//           if (idx >= perf.length) return null;
//           return (
//             <text
//               key={idx}
//               x={getX(idx)}
//               y={chartH - 5}
//               textAnchor="middle"
//               fill="#94a3b8"
//               fontSize="9"
//               fontWeight="600"
//             >
//               {xLabels[xLabelIndices.indexOf(idx)]}
//             </text>
//           );
//         })}
//       </svg>
//     );
//   };

//   // ─── Render Pie Chart SVG ───
//   const renderPieChart = () => {
//     if (!data?.channels || data.channels.length === 0) return null;
//     const channels = data.channels;
//     const cx = 90;
//     const cy = 90;
//     const r = 75;
//     let accumulated = 0;

//     const slices = channels.map((ch, i) => {
//       const pct = ch.percentage / 100;
//       const startAngle = accumulated * 2 * Math.PI - Math.PI / 2;
//       accumulated += pct;
//       const endAngle = accumulated * 2 * Math.PI - Math.PI / 2;
//       const largeArc = pct > 0.5 ? 1 : 0;

//       const x1 = cx + r * Math.cos(startAngle);
//       const y1 = cy + r * Math.sin(startAngle);
//       const x2 = cx + r * Math.cos(endAngle);
//       const y2 = cy + r * Math.sin(endAngle);

//       const midAngle = (startAngle + endAngle) / 2;
//       const labelR = r * 0.6;
//       const lx = cx + labelR * Math.cos(midAngle);
//       const ly = cy + labelR * Math.sin(midAngle);

//       const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

//       return (
//         <g key={i}>
//           <path d={pathD} fill={pieColors[i % pieColors.length]} stroke="#fff" strokeWidth="2" />
//           <text
//             x={lx}
//             y={ly}
//             textAnchor="middle"
//             dominantBaseline="central"
//             fill="#fff"
//             fontSize="11"
//             fontWeight="700"
//           >
//             {ch.percentage}%
//           </text>
//         </g>
//       );
//     });

//     return (
//       <svg width="180" height="180" viewBox="0 0 180 180">
//         {slices}
//       </svg>
//     );
//   };

//   // ─── Render Bar Chart SVG ───
//   const renderBarChart = () => {
//   if (!data?.agencyFunnels || data.agencyFunnels.length === 0) return null;

//   const funnels = data.agencyFunnels;
//   const maxVal = Math.max(...funnels.map((f) => f.funnelValue));

//   const chartW = 520;
//   const chartH = 190;

//   const padT = 18;
//   const padB = 55;
//   const padL = 32;

//   const barW = 72;
//   const gap = 45;

//   return (
//     <svg
//       width="100%"
//       height="100%"
//       viewBox={`0 0 ${chartW} ${chartH}`}
//       preserveAspectRatio="xMidYMid meet"
//     >
//       {/* Chart border/grid area */}
//       <rect
//         x="20"
//         y="10"
//         width="480"
//         height="120"
//         fill="none"
//         stroke="#e5e7eb"
//         strokeWidth="1"
//       />

//       {funnels.map((f, i) => {
//         const barH = (f.funnelValue / maxVal) * 95;
//         const x = padL + i * (barW + gap);
//         const y = 130 - barH;

//         const words = f.funnelName.split(' ');
//         const line1 = words.slice(0, 2).join(' ');
//         const line2 = words.slice(2).join(' ');

//         return (
//           <g key={i}>
//             {/* Percentage label */}
//             <text
//               x={x + barW / 2}
//               y={y - 8}
//               textAnchor="middle"
//               fill="#334155"
//               fontSize="11"
//               fontWeight="700"
//             >
//               {f.funnelValue}%
//             </text>

//             {/* Bar */}
//             <rect
//               x={x}
//               y={y}
//               width={barW}
//               height={barH}
//               fill="#9b8cf4"
//             />

//             {/* Label line 1 */}
//             <text
//               x={x + barW / 2}
//               y="150"
//               textAnchor="middle"
//               fill="#64748b"
//               fontSize="9"
//               fontWeight="600"
//             >
//               {line1}
//             </text>

//             {/* Label line 2 */}
//             {line2 && (
//               <text
//                 x={x + barW / 2}
//                 y="164"
//                 textAnchor="middle"
//                 fill="#64748b"
//                 fontSize="9"
//                 fontWeight="600"
//               >
//                 {line2}
//               </text>
//             )}
//           </g>
//         );
//       })}
//     </svg>
//   );
// };

//   return (
//   <div className="w-full bg-white px-6 py-5">
//     {error && (
//       <div className="mb-4 flex items-center gap-2 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800">
//         <AlertCircle className="h-4 w-4" />
//         {error}
//       </div>
//     )}

//     {loading ? (
//       <div className="flex h-[420px] items-center justify-center rounded border bg-white">
//         <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
//       </div>
//     ) : !data ? (
//       <div className="flex h-[420px] items-center justify-center rounded border bg-white text-sm font-semibold text-gray-400">
//         No analytics data available.
//       </div>
//     ) : (
//       <div className="grid grid-cols-2 gap-7">
//         {/* Key Marketing Metrics */}
//         <div className="h-[305px] overflow-hidden rounded-[12px] border border-gray-400 bg-white">
//           <div className="flex h-[54px] items-center justify-between border-b border-gray-400 px-6">
//             <div className="flex items-center gap-3">
//               <h3 className="text-[16px] font-bold text-black">
//                 Key Marketing Metrics
//               </h3>
//               <span className="text-[10px] font-semibold text-gray-400">
//                 (Last 30 Days)
//               </span>
//             </div>

//             <button className="flex h-[34px] w-[104px] items-center justify-between rounded-[10px] border border-gray-400 px-4 text-[12px] font-semibold text-black">
//               View All
//               <span className="text-lg">›</span>
//             </button>
//           </div>


//           <table className="w-full border-collapse text-[12px]">
//             {/* Header */}
//               <thead>
//                 <tr className="h-[40px] border-b border-gray-300 bg-[#f8f8f8]">
//                   <th className="pl-8 text-left text-[12px] font-bold text-black">
//                     Metric
//                   </th>

//                   <th className="w-[100px] text-center text-[12px] font-bold text-black">
//                     Value
//                   </th>

//                   <th className="w-[80px] text-center text-[12px] font-bold text-black">
//                     Trend
//                   </th>

//                   <th className="w-[20px]" />
//                 </tr>
//               </thead>

//               {/* Body */}
//               <tbody>
//                 {data.metrics?.map((m, idx) => (
//                   <tr
//                     key={idx}
//                     className="h-[50px] border-b border-gray-200"
//                   >
//                     {/* Metric Name */}
//                     <td className="pl-8 pr-4 align-middle text-[12px] font-semibold text-neutral-800">
//                       {m.metricKey}
//                     </td>

//                     {/* Value */}
//                     <td className="px-3 text-center align-middle text-[12px] font-semibold text-black">
//                       {formatMetricValue(m.metricKey, m.metricValue)}
//                     </td>

//                     {/* Trend */}
//                     <td className="px-2 text-center align-middle text-[12px] font-semibold text-black">
//                       {Math.abs(parseFloat(m.trend || 0))}%
//                     </td>

//                     {/* Sparkline */}
//                     <td className="pr-6 align-middle">
//                       <div className="flex items-center justify-center">
//                         <div className="h-[28px] w-[90px]">
//                           <Sparkline
//                             trend={m.trend}
//                             color="#a78bfa"
//                           />
//                         </div>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//         </div>

//         {/* Area Chart */}
//         <div className="h-[305px] rounded-none border border-gray-400 bg-white">
//           <div className="flex h-[54px] items-center border-b border-gray-400 px-5">
//             <h3 className="text-[17px] font-bold text-black">
//               Marketing performance overview
//             </h3>
//           </div>

//           <div className="px-4 pt-5">
//             <div className="h-[205px] w-full">
//               {renderAreaChart()}
//             </div>

//             <div className="mt-1 flex justify-center gap-5 text-[10px] font-medium text-gray-500">
//               <span className="flex items-center gap-1">
//                 <span className="h-[2px] w-8 bg-blue-500" />
//                 Opens
//               </span>
//               <span className="flex items-center gap-1">
//                 <span className="h-[2px] w-8 bg-red-400" />
//                 Clicks
//               </span>
//               <span className="flex items-center gap-1">
//                 <span className="h-[2px] w-8 bg-teal-500" />
//                 Conversions
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Pie Chart */}
//         <div className="h-[260px] rounded-[10px] border border-gray-400 bg-white px-4 py-4 shadow-md">
//           <h3 className="mb-4 text-[17px] font-bold text-black">
//             Marketing Performance Overview
//           </h3>

//           <div className="flex items-center gap-8">
//             <div className="scale-[0.68] origin-left">
//               {renderPieChart()}
//             </div>

//             <div className="space-y-2 text-[12px] font-semibold text-black">
//               {data.channels?.map((ch, i) => (
//                 <div key={i} className="flex items-center gap-2">
//                   <span
//                     className="h-[7px] w-[7px] rounded-full"
//                     style={{ background: pieColors[i % pieColors.length] }}
//                   />
//                   {ch.channelName}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Funnel Chart */}
//        <div className="h-[260px] rounded-[10px] border border-gray-400 bg-white px-4 py-4 shadow-md">
//           <h3 className="mb-2 text-[17px] font-bold text-black">
//             Agency Funnel
//           </h3>

//           <div className="mx-auto mt-2 h-[200px] w-[98%]">
//             {renderBarChart()}
//           </div>
//         </div>
//       </div>
//     )}
//   </div>
// );

  // return (
  //   <div className="space-y-6 p-1">
  //     {/* ─── Page Header ─── */}
  //     <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

  //       {/* Period filter */}
  //       <div className="relative">
  //         <button
  //           onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
  //           className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors"
  //           style={{
  //             borderColor: '#e2e8f0',
  //             color: '#475569',
  //             background: '#fff',
  //           }}
  //         >
  //           {periods.find((p) => p.value === period)?.label || 'Last 30 days'}
  //           <ChevronDown className="h-4 w-4" />
  //         </button>
  //         {showPeriodDropdown && (
  //           <div
  //             className="absolute right-0 mt-2 w-44 rounded-xl border shadow-lg z-20"
  //             style={{ background: '#fff', borderColor: '#e2e8f0' }}
  //           >
  //             {periods.map((p) => (
  //               <button
  //                 key={p.value}
  //                 onClick={() => {
  //                   setPeriod(p.value);
  //                   setShowPeriodDropdown(false);
  //                 }}
  //                 className="block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-50"
  //                 style={{
  //                   color: period === p.value ? '#7c3aed' : '#475569',
  //                   fontWeight: period === p.value ? 700 : 500,
  //                 }}
  //               >
  //                 {p.label}
  //               </button>
  //             ))}
  //           </div>
  //         )}
  //       </div>
  //     </div>

  //     {/* Error banner */}
  //     {error && (
  //       <div
  //         className="flex items-center gap-3 px-5 py-4 rounded-lg text-sm font-semibold"
  //         style={{
  //           background: '#fef3c7',
  //           border: '1px solid #fde68a',
  //           color: '#92400e',
  //         }}
  //       >
  //         <AlertCircle className="h-5 w-5 flex-shrink-0" />
  //         {error}
  //       </div>
  //     )}

  //     {/* Loading state */}
  //     {loading ? (
  //       <div
  //         className="text-center py-24 rounded-lg"
  //         style={{ background: '#fff', border: '1px solid #e2e8f0' }}
  //       >
  //         <Loader2
  //           className="h-9 w-9 animate-spin mx-auto"
  //           style={{ color: '#7c3aed' }}
  //         />
  //         <span
  //           className="text-xs mt-3 block font-bold"
  //           style={{ color: '#94a3b8' }}
  //         >
  //           Loading analytics data...
  //         </span>
  //       </div>
  //     ) : !data ? (
  //       <div
  //         className="text-center py-24 rounded-lg"
  //         style={{ background: '#fff', border: '1px solid #e2e8f0' }}
  //       >
  //         <AlertCircle
  //           className="h-9 w-9 mx-auto"
  //           style={{ color: '#94a3b8' }}
  //         />
  //         <span
  //           className="text-sm mt-3 block font-bold"
  //           style={{ color: '#94a3b8' }}
  //         >
  //           No analytics data available.
  //         </span>
  //       </div>
  //     ) : (
  //       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  //         {/* ─── TOP LEFT: Key Marketing Metrics Table ─── */}
  //         <div
  //           className="rounded-lg p-5"
  //           style={{
  //             background: '#fff',
  //             border: '1px solid #e2e8f0',
  //           }}
  //         >
  //           {/* Card header */}
  //           <div className="flex items-center justify-between mb-4">
  //             <div className="flex items-center gap-2">
  //               <h3
  //                 className="text-base font-bold"
  //                 style={{ color: '#0f172a' }}
  //               >
  //                 Key Marketing Metrics
  //               </h3>
  //               <span
  //                 className="text-xs px-2 py-0.5 rounded-md font-semibold"
  //                 style={{
  //                   background: '#f1f5f9',
  //                   color: '#64748b',
  //                 }}
  //               >
  //                 Last 30 Days
  //               </span>
  //             </div>
  //             <button
  //               className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-neutral-50"
  //               style={{ color: '#3b82f6' }}
  //             >
  //               <Eye className="h-3.5 w-3.5" />
  //               View All
  //             </button>
  //           </div>

  //           {/* Table */}
  //           <div className="overflow-x-auto">
  //             <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
  //               <thead>
  //                 <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
  //                   <th
  //                     className="text-left py-3 px-3 text-xs font-semibold"
  //                     style={{ color: '#94a3b8' }}
  //                   >
  //                     Metric
  //                   </th>
  //                   <th
  //                     className="text-right py-3 px-3 text-xs font-semibold"
  //                     style={{ color: '#94a3b8' }}
  //                   >
  //                     Value
  //                   </th>
  //                   <th
  //                     className="text-right py-3 px-3 text-xs font-semibold"
  //                     style={{ color: '#94a3b8' }}
  //                   >
  //                     Trend
  //                   </th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {data.metrics && data.metrics.length > 0 ? (
  //                   data.metrics.map((m, idx) => (
  //                     <tr
  //                       key={idx}
  //                       style={{
  //                         borderBottom:
  //                           idx < data.metrics.length - 1
  //                             ? '1px solid #f8fafc'
  //                             : 'none',
  //                       }}
  //                       className="hover:bg-neutral-50/50 transition-colors"
  //                     >
  //                       <td
  //                         className="py-3 px-3 font-medium"
  //                         style={{ color: '#334155' }}
  //                       >
  //                         {m.metricKey}
  //                       </td>
  //                       <td
  //                         className="py-3 px-3 text-right font-bold"
  //                         style={{ color: '#0f172a' }}
  //                       >
  //                         {formatMetricValue(m.metricKey, m.metricValue)}
  //                       </td>
  //                       <td className="py-3 px-3 text-right">
  //                         <div className="flex items-center justify-end gap-2">
  //                           <Sparkline trend={m.trend} />
  //                           <span
  //                             className="text-xs font-bold"
  //                             style={{
  //                               color:
  //                                 m.trend >= 0 ? '#10b981' : '#ef4444',
  //                             }}
  //                           >
  //                             {formatTrend(m.trend)}
  //                           </span>
  //                         </div>
  //                       </td>
  //                     </tr>
  //                   ))
  //                 ) : (
  //                   <tr>
  //                     <td
  //                       colSpan="3"
  //                       className="text-center py-8 font-semibold"
  //                       style={{ color: '#94a3b8' }}
  //                     >
  //                       No metrics data available.
  //                     </td>
  //                   </tr>
  //                 )}
  //               </tbody>
  //             </table>
  //           </div>
  //         </div>

  //         {/* ─── TOP RIGHT: Marketing Performance Overview Area Chart ─── */}
  //         <div
  //           className="rounded-lg p-5"
  //           style={{
  //             background: '#fff',
  //             border: '1px solid #e2e8f0',
  //           }}
  //         >
  //           <div className="flex items-center justify-between mb-3">
  //             <h3
  //               className="text-base font-bold"
  //               style={{ color: '#0f172a' }}
  //             >
  //               Marketing performance overview
  //             </h3>
  //           </div>

  //           {data.performanceOverview &&
  //           data.performanceOverview.length > 0 ? (
  //             <>
  //               {renderAreaChart()}
  //               {/* Legend */}
  //               <div className="flex items-center justify-center gap-5 mt-3">
  //                 <div className="flex items-center gap-1.5">
  //                   <span
  //                     className="block h-2.5 w-2.5 rounded-full"
  //                     style={{ background: '#f59e0b' }}
  //                   />
  //                   <span
  //                     className="text-xs font-semibold"
  //                     style={{ color: '#64748b' }}
  //                   >
  //                     Opens
  //                   </span>
  //                 </div>
  //                 <div className="flex items-center gap-1.5">
  //                   <span
  //                     className="block h-2.5 w-2.5 rounded-full"
  //                     style={{ background: '#3b82f6' }}
  //                   />
  //                   <span
  //                     className="text-xs font-semibold"
  //                     style={{ color: '#64748b' }}
  //                   >
  //                     Clicks
  //                   </span>
  //                 </div>
  //                 <div className="flex items-center gap-1.5">
  //                   <span
  //                     className="block h-2.5 w-2.5 rounded-full"
  //                     style={{ background: '#10b981' }}
  //                   />
  //                   <span
  //                     className="text-xs font-semibold"
  //                     style={{ color: '#64748b' }}
  //                   >
  //                     Conversions
  //                   </span>
  //                 </div>
  //               </div>
  //             </>
  //           ) : (
  //             <div
  //               className="text-center py-16 font-semibold"
  //               style={{ color: '#94a3b8' }}
  //             >
  //               No performance data available.
  //             </div>
  //           )}
  //         </div>

  //         {/* ─── BOTTOM LEFT: Marketing Performance Overview Pie Chart ─── */}
  //         <div
  //           className="rounded-lg p-5"
  //           style={{
  //             background: '#fff',
  //             border: '1px solid #e2e8f0',
  //           }}
  //         >
  //           <h3
  //             className="text-base font-bold mb-4"
  //             style={{ color: '#0f172a' }}
  //           >
  //             Marketing Performance Overview
  //           </h3>

  //           {data.channels && data.channels.length > 0 ? (
  //             <div className="flex items-center justify-center gap-8">
  //               {/* Pie Chart */}
  //               <div className="flex-shrink-0">{renderPieChart()}</div>

  //               {/* Legend */}
  //               <div className="space-y-3">
  //                 {data.channels.map((ch, i) => (
  //                   <div key={i} className="flex items-center gap-2.5">
  //                     <span
  //                       className="block h-3 w-3 rounded-full flex-shrink-0"
  //                       style={{
  //                         background: pieColors[i % pieColors.length],
  //                       }}
  //                     />
  //                     <span
  //                       className="text-sm font-medium"
  //                       style={{ color: '#334155' }}
  //                     >
  //                       {ch.channelName}
  //                     </span>
  //                   </div>
  //                 ))}
  //               </div>
  //             </div>
  //           ) : (
  //             <div
  //               className="text-center py-16 font-semibold"
  //               style={{ color: '#94a3b8' }}
  //             >
  //               No channel data available.
  //             </div>
  //           )}
  //         </div>

  //         {/* ─── BOTTOM RIGHT: Agency Funnel Bar Chart ─── */}
  //         <div
  //           className="rounded-lg p-5"
  //           style={{
  //             background: '#fff',
  //             border: '1px solid #e2e8f0',
  //           }}
  //         >
  //           <h3
  //             className="text-base font-bold mb-4"
  //             style={{ color: '#0f172a' }}
  //           >
  //             Agency Funnel
  //           </h3>

  //           {data.agencyFunnels && data.agencyFunnels.length > 0 ? (
  //             <div>{renderBarChart()}</div>
  //           ) : (
  //             <div
  //               className="text-center py-16 font-semibold"
  //               style={{ color: '#94a3b8' }}
  //             >
  //               No funnel data available.
  //             </div>
  //           )}
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
};

// export default MarketingAnalytics;


'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  IndianRupee,
  Target,
  Megaphone,
  Loader2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { getCampaigns, getLeads } from '../../services/marketingApi';

const formatCurrency = (val) => {
  if (!val) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val));
};

const formatPercent = (val) => {
  if (!Number.isFinite(val)) return '0.0%';
  return `${val.toFixed(1)}%`;
};

const getDaysAgo = (date) => {
  const d = new Date(date);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
};

const getSourceName = (lead) => {
  return lead.source?.name || lead.source || 'Unknown';
};

const isProspectLead = (lead) => {
  return (
    lead.status === 'PROSPECT' ||
    lead.leadStatus === 'PROSPECT' ||
    lead.isProspect === true ||
    lead.studentUserId ||
    lead.isStudentLoginCreated === true
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
    const paidCampaigns = campaigns.filter((c) => c.type !== 'EMAIL');

    const totalBudget = paidCampaigns.reduce(
      (sum, c) => sum + Number(c.budget || 0),
      0
    );

    const totalSpent = paidCampaigns.reduce(
      (sum, c) => sum + Number(c.spent || 0),
      0
    );

    const totalRevenue = campaigns.reduce(
      (sum, c) => sum + Number(c.revenue || 0),
      0
    );

    const roi =
      totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

    const totalLeads = leads.length;
    const prospects = leads.filter(isProspectLead).length;

    const conversionRate =
      totalLeads > 0 ? (prospects / totalLeads) * 100 : 0;

    const hotLeads = leads.filter((l) => l.rating === 'HOT').length;
    const warmLeads = leads.filter((l) => l.rating === 'WARM').length;
    const coldLeads = leads.filter((l) => l.rating === 'COLD').length;

    const last30DaysLeads = leads.filter(
      (l) => l.createdAt && getDaysAgo(l.createdAt) <= 30
    ).length;

    const sourceMap = {};
    leads.forEach((lead) => {
      const source = getSourceName(lead);
      if (!sourceMap[source]) {
        sourceMap[source] = {
          source,
          leads: 0,
          prospects: 0,
          hot: 0,
        };
      }

      sourceMap[source].leads += 1;
      if (isProspectLead(lead)) sourceMap[source].prospects += 1;
      if (lead.rating === 'HOT') sourceMap[source].hot += 1;
    });

    const sourceRows = Object.values(sourceMap)
      .map((item) => ({
        ...item,
        conversion:
          item.leads > 0 ? (item.prospects / item.leads) * 100 : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    const campaignRows = campaigns.map((c) => {
      const spent = Number(c.spent || 0);
      const revenue = Number(c.revenue || 0);
      const campaignRoi =
        spent > 0 ? ((revenue - spent) / spent) * 100 : 0;

      return {
        name: c.name,
        type: c.type,
        budget: Number(c.budget || 0),
        spent,
        revenue,
        roi: campaignRoi,
        leads: c.leadsCount || 0,
      };
    });

    return {
      totalBudget,
      totalSpent,
      totalRevenue,
      roi,
      totalLeads,
      prospects,
      conversionRate,
      hotLeads,
      warmLeads,
      coldLeads,
      last30DaysLeads,
      sourceRows,
      campaignRows,
      avgResponseTime: 'Pending',
    };
  }, [campaigns, leads]);

  const chartData = analytics.sourceRows.slice(0, 6);
  const maxChartValue = Math.max(...chartData.map((x) => x.leads), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-9 w-9 animate-spin text-[#1a2b4c]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Marketing Analytics
        </h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">
          Campaign ROI, lead to prospect conversion rate, source performance,
          and response analytics.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <MetricCard
          title="1.6.1 Campaign ROI"
          value={formatPercent(analytics.roi)}
          subtitle={`Spent ${formatCurrency(analytics.totalSpent)}`}
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
          bg="bg-emerald-50"
        />

        <MetricCard
          title="1.6.2 Lead to Prospect Rate"
          value={formatPercent(analytics.conversionRate)}
          subtitle={`${analytics.prospects} prospects from ${analytics.totalLeads} leads`}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          bg="bg-blue-50"
        />

        <MetricCard
          title="1.6.3 Lead Response Time"
          value={analytics.avgResponseTime}
          subtitle="Needs first activity timestamp"
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          bg="bg-orange-50"
        />

        <MetricCard
          title="Total Ad Budget"
          value={formatCurrency(analytics.totalBudget)}
          subtitle={`Revenue ${formatCurrency(analytics.totalRevenue)}`}
          icon={<IndianRupee className="h-6 w-6 text-purple-600" />}
          bg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Key Marketing Metrics
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                Last 30 days and current CRM data
              </p>
            </div>
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50">
              View All ›
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-6 py-3">Metric</th>
                <th className="text-right px-6 py-3">Value</th>
                <th className="text-right px-6 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              <MetricRow label="Total Leads" value={analytics.totalLeads} trend="Live" />
              <MetricRow label="Leads in Last 30 Days" value={analytics.last30DaysLeads} trend="+ Active" />
              <MetricRow label="Hot Leads" value={analytics.hotLeads} trend="High" />
              <MetricRow label="Warm Leads" value={analytics.warmLeads} trend="Medium" />
              <MetricRow label="Cold Leads" value={analytics.coldLeads} trend="Low" />
              <MetricRow label="Prospects Converted" value={analytics.prospects} trend={formatPercent(analytics.conversionRate)} />
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Marketing Performance Overview
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Leads by source
          </p>

          <div className="mt-8 space-y-5">
            {chartData.length === 0 ? (
              <div className="text-center text-slate-400 font-semibold py-20">
                No source data available
              </div>
            ) : (
              chartData.map((item) => (
                <div key={item.source}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-700">{item.source}</span>
                    <span className="text-slate-500">{item.leads}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1a2b4c] rounded-full"
                      style={{
                        width: `${(item.leads / maxChartValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Agency Funnel
          </h2>

          <div className="mt-6 space-y-4">
            <FunnelBar label="Total Leads" value={analytics.totalLeads} width="100%" color="bg-blue-600" />
            <FunnelBar label="Hot Leads" value={analytics.hotLeads} width={`${analytics.totalLeads ? (analytics.hotLeads / analytics.totalLeads) * 100 : 0}%`} color="bg-rose-500" />
            <FunnelBar label="Prospects" value={analytics.prospects} width={`${analytics.totalLeads ? (analytics.prospects / analytics.totalLeads) * 100 : 0}%`} color="bg-emerald-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Source Performance
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-5 py-3">Source</th>
                <th className="text-right px-5 py-3">Leads</th>
                <th className="text-right px-5 py-3">Prospects</th>
                <th className="text-right px-5 py-3">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {analytics.sourceRows.slice(0, 7).map((row) => (
                <tr key={row.source}>
                  <td className="px-5 py-3 text-slate-800">{row.source}</td>
                  <td className="px-5 py-3 text-right">{row.leads}</td>
                  <td className="px-5 py-3 text-right">{row.prospects}</td>
                  <td className="px-5 py-3 text-right text-emerald-600">
                    {formatPercent(row.conversion)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Campaign ROI Breakdown
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-5 py-3">Campaign</th>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-right px-5 py-3">Budget</th>
              <th className="text-right px-5 py-3">Spent</th>
              <th className="text-right px-5 py-3">Revenue</th>
              <th className="text-right px-5 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {analytics.campaignRows.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">
                  No campaigns found
                </td>
              </tr>
            ) : (
              analytics.campaignRows.map((c, index) => (
                <tr key={`${c.name}-${index}`}>
                  <td className="px-5 py-3 text-slate-800">{c.name}</td>
                  <td className="px-5 py-3 text-slate-500">{c.type}</td>
                  <td className="px-5 py-3 text-right">{c.type === 'EMAIL' ? 'N/A' : formatCurrency(c.budget)}</td>
                  <td className="px-5 py-3 text-right">{c.type === 'EMAIL' ? 'N/A' : formatCurrency(c.spent)}</td>
                  <td className="px-5 py-3 text-right">{formatCurrency(c.revenue)}</td>
                  <td className={`px-5 py-3 text-right ${c.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {c.type === 'EMAIL' ? 'N/A' : formatPercent(c.roi)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon, bg }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
          {value}
        </h2>
      </div>
      <div className={`h-14 w-14 rounded-2xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <p className="text-sm text-slate-500 font-semibold mt-4">{subtitle}</p>
  </div>
);

const MetricRow = ({ label, value, trend }) => (
  <tr>
    <td className="px-6 py-3 text-slate-700">{label}</td>
    <td className="px-6 py-3 text-right text-slate-900">{value}</td>
    <td className="px-6 py-3 text-right text-emerald-600">{trend}</td>
  </tr>
);

const FunnelBar = ({ label, value, width, color }) => (
  <div>
    <div className="flex justify-between text-sm font-semibold mb-1">
      <span className="text-slate-700">{label}</span>
      <span className="text-slate-500">{value}</span>
    </div>
    <div className="h-10 bg-slate-100 rounded-xl overflow-hidden">
      <div
        className={`h-full ${color} rounded-xl flex items-center justify-end pr-4 text-white text-sm font-bold`}
        style={{ width }}
      >
        {value}
      </div>
    </div>
  </div>
);

export default MarketingAnalytics;