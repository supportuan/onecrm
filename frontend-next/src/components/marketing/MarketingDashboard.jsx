'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getMarketingDashboard, 
  getIntakeTrends, 
  getMarketingFunnels 
} from '../../services/marketingApi';
import { 
  Users, 
  Target, 
  Megaphone, 
  Zap, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  Plus, 
  Sparkles,
  BarChart3,
  RefreshCw,
  Layers,
  Award,
  GraduationCap,
  Send,
  Calendar,
  Upload,
  MessageSquare,
  Clock,
  Bell,
  Settings,
  Search
} from 'lucide-react';

const MarketingDashboard = () => {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [funnels, setFunnels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, trendsRes, funnelsRes] = await Promise.all([
        getMarketingDashboard(),
        getIntakeTrends(),
        getMarketingFunnels()
      ]);

      if (dashRes.success) setData(dashRes.data);
      if (trendsRes.success) setTrends(trendsRes.data || []);
      if (funnelsRes.success) setFunnels(funnelsRes.data);
      
      if (!dashRes.success || !trendsRes.success || !funnelsRes.success) {
        setError('Failed to fetch high-fidelity dashboard metrics.');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Connection to backend server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format numbers with commas (e.g. 12,847)
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Format currency dynamically to match screenshot ($1.2M)
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0M';
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse ui-page">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded-lg" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
        </div>

        {/* Shimmer Metrics Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-200 rounded-[24px] border border-neutral-100" />
          ))}
        </div>

        {/* Shimmer Charts */}
        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="h-[420px] bg-slate-200 rounded-[24px]" />
          <div className="h-[420px] bg-slate-200 rounded-[24px]" />
        </div>
      </div>
    );
  }

  // Calculate dynamic dimensions for SVG multi-line chart
  const svgWidth = 600;
  const svgHeight = 240;
  const svgPadding = 45;
  const chartWidth = svgWidth - svgPadding * 2;
  const chartHeight = svgHeight - svgPadding * 2;

  // Maximum value for scaling the Y axis (default to 800 based on screenshot Y scale)
  const maxVal = 800;

  const getX = (index) => svgPadding + (index / (trends.length - 1 || 1)) * chartWidth;
  const getY = (value) => svgPadding + chartHeight - (value / maxVal) * chartHeight;

  // Helper to generate bezier curves
  const getCurvePath = (points) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${p1.x},${p1.y}`;
    }
    return path;
  };

  // Construct points for the 3 curves
  const appPoints = trends.map((t, idx) => ({ x: getX(idx), y: getY(t.applications) }));
  const enrollPoints = trends.map((t, idx) => ({ x: getX(idx), y: getY(t.enrollments) }));
  const revPoints = trends.map((t, idx) => ({ x: getX(idx), y: getY(t.revenue * 2) })); // scale revenue for visual height parity

  const appPath = getCurvePath(appPoints);
  const enrollPath = getCurvePath(enrollPoints);
  const revPath = getCurvePath(revPoints);

  return (
    <div className="ui-page text-neutral-800 antialiased font-sans">
      <div className="ui-container">
      {/* Top Navigation Row matching screenshot */}
      

      {/* KPI Cards Ribbon matching screenshot values */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Students */}
        <div className="group relative overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-neutral-50 opacity-80 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold tracking-normal text-neutral-500">Total Students</span>
            <div className="text-neutral-700 bg-neutral-50 p-2 rounded-xl border border-neutral-100 group-hover:scale-110 transition-transform duration-200">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-[28px] font-extrabold text-neutral-900 tracking-tight">
              {formatNumber(data?.kpis?.totalStudents?.value)}
            </h3>
            <div className="mt-3 flex items-center gap-1 text-[13px] text-emerald-500 font-extrabold">
              <span>{data?.kpis?.totalStudents?.trend || '12.5% vs last month'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Applications */}
        <div className="group relative overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-neutral-50 opacity-80 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold tracking-normal text-neutral-500">Active Applications</span>
            <div className="text-neutral-700 bg-neutral-50 p-2 rounded-xl border border-neutral-100 group-hover:scale-110 transition-transform duration-200">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-[28px] font-extrabold text-neutral-900 tracking-tight">
              {formatNumber(data?.kpis?.activeApplications?.value)}
            </h3>
            <div className="mt-3 flex items-center gap-1 text-[13px] text-emerald-500 font-extrabold">
              <span>{data?.kpis?.activeApplications?.trend || '8.2% vs last month'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Partner Agencies */}
        <div className="group relative overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-neutral-50 opacity-80 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold tracking-normal text-neutral-500">Partner Agencies</span>
            <div className="text-neutral-700 bg-neutral-50 p-2 rounded-xl border border-neutral-100 group-hover:scale-110 transition-transform duration-200">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-[28px] font-extrabold text-neutral-900 tracking-tight">
              {formatNumber(data?.kpis?.partnerAgencies?.value)}
            </h3>
            <div className="mt-3 flex items-center gap-1 text-[13px] text-emerald-500 font-extrabold">
              <span>{data?.kpis?.partnerAgencies?.trend || '5.1% vs last month'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Revenue (MTD) */}
        <div className="group relative overflow-hidden rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-neutral-50 opacity-80 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold tracking-normal text-neutral-500">Revenue (MTD)</span>
            <div className="text-neutral-700 bg-neutral-50 p-2 rounded-xl border border-neutral-100 group-hover:scale-110 transition-transform duration-200">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-[28px] font-extrabold text-neutral-900 tracking-tight">
              {formatCurrency(data?.kpis?.revenueMtd?.value)}
            </h3>
            <div className="mt-3 flex items-center gap-1 text-[13px] text-emerald-500 font-extrabold">
              <span>{data?.kpis?.revenueMtd?.trend || '18.7% vs last month'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Layout */}
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        {/* Intake Trends SVG Multi-line Chart */}
        <div className="rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-extrabold text-neutral-900">
                Intake Trends
              </h2>
              <p className="text-[12px] text-neutral-500 mt-1 font-medium">Applications and enrollments over time</p>
            </div>
            {/* Color-coded Legend */}
            <div className="flex items-center gap-4 text-xs font-bold text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1e3a8a]" />
                <span>Applications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                <span>Enrollments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                <span>Revenue($k)</span>
              </div>
            </div>
          </div>

          {/* SVG Custom Area Chart */}
          <div className="mt-6 relative">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const yVal = svgPadding + chartHeight * ratio;
                const displayVal = Math.round(maxVal * (1 - ratio));
                return (
                  <g key={idx} className="opacity-40">
                    <line 
                      x1={svgPadding} 
                      y1={yVal} 
                      x2={svgWidth - svgPadding} 
                      y2={yVal} 
                      stroke="#cbd5e1" 
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <text 
                      x={svgPadding - 12} 
                      y={yVal + 3.5} 
                      fontSize={10} 
                      fill="#94a3b8" 
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      {displayVal}
                    </text>
                  </g>
                );
              })}

              {/* Chart Stroke Lines (High fidelity cubic curves) */}
              {trends.length > 0 && (
                <>
                  <path d={appPath} fill="none" stroke="#1e3a8a" strokeWidth={3.5} strokeLinecap="round" />
                  <path d={enrollPath} fill="none" stroke="#ef4444" strokeWidth={3.5} strokeLinecap="round" />
                  <path d={revPath} fill="none" stroke="#10b981" strokeWidth={3.5} strokeLinecap="round" />
                </>
              )}

              {/* Data points & Interaction anchors */}
              {trends.map((t, idx) => {
                const lx = getX(idx);
                const isHovered = hoveredTrendIndex === idx;

                return (
                  <g key={idx}>
                    {/* Vertical guidelines on hover */}
                    {isHovered && (
                      <line 
                        x1={lx} 
                        y1={svgPadding} 
                        x2={lx} 
                        y2={svgHeight - svgPadding} 
                        stroke="#94a3b8" 
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Interactive hover circle trigger overlay */}
                    <circle 
                      cx={lx} 
                      cy={svgHeight / 2} 
                      r={30} 
                      fill="transparent" 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredTrendIndex(idx)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                    />

                    {/* Visible bullet points on hover */}
                    {isHovered && (
                      <>
                        <circle cx={lx} cy={getY(t.applications)} r={5} fill="#ffffff" stroke="#1e3a8a" strokeWidth={3} />
                        <circle cx={lx} cy={getY(t.enrollments)} r={5} fill="#ffffff" stroke="#ef4444" strokeWidth={3} />
                        <circle cx={lx} cy={getY(t.revenue * 2)} r={5} fill="#ffffff" stroke="#10b981" strokeWidth={3} />
                      </>
                    )}

                    {/* X-Axis Month labels */}
                    <text 
                      x={lx} 
                      y={svgHeight - svgPadding + 20} 
                      fontSize={11} 
                      fill="#64748b" 
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {t.month}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Interactive Tooltip overlay */}
            {hoveredTrendIndex !== null && (
              <div 
                className="absolute z-10 bg-white text-neutral-900 rounded-xl p-3 shadow-xl text-xs space-y-1.5 border border-neutral-200"
                style={{
                  left: `${(hoveredTrendIndex / (trends.length - 1)) * 80 + 10}%`,
                  bottom: '75px',
                  transform: 'translateX(-50%)'
                }}
              >
                <p className="font-extrabold text-neutral-600 border-b border-neutral-200 pb-1 mb-1">
                  {trends[hoveredTrendIndex].month} Metrics
                </p>
                <p className="flex justify-between gap-4 font-semibold">
                  <span>Applications:</span>
                  <span className="font-bold text-sky-400">{trends[hoveredTrendIndex].applications}</span>
                </p>
                <p className="flex justify-between gap-4 font-semibold">
                  <span>Enrollments:</span>
                  <span className="font-bold text-red-400">{trends[hoveredTrendIndex].enrollments}</span>
                </p>
                <p className="flex justify-between gap-4 font-semibold">
                  <span>Revenue:</span>
                  <span className="font-bold text-emerald-400">${trends[hoveredTrendIndex].revenue}k</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel matching screenshot 2x3 grid and exact colors */}
        <div className="rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-[17px] font-extrabold text-neutral-900">
              Quick Actions
            </h2>
            
            {/* 2x3 Grid layout */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {/* Button 1: Add Student */}
              <button
                onClick={() => router.push('/marketing/lead-management?intake=true')}
                className="flex flex-col items-center justify-center rounded-[14px] bg-[#1a365d] text-white p-4 font-semibold text-xs transition duration-200 hover:opacity-90 active:scale-95 shadow-sm min-h-[92px]"
              >
                <GraduationCap className="h-5 w-5 mb-1.5" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">Add Student</span>
              </button>

              {/* Button 2: New Application */}
              <button
                onClick={() => router.push('/marketing/leads')}
                className="flex flex-col items-center justify-center rounded-[14px] bg-[#ff8c00] text-white p-4 font-semibold text-xs transition duration-200 hover:opacity-90 active:scale-95 shadow-sm min-h-[92px]"
              >
                <FileText className="h-5 w-5 mb-1.5" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">New Application</span>
              </button>

              {/* Button 3: Send Email */}
              <button
                onClick={() => router.push('/marketing/campaigns')}
                className="flex flex-col items-center justify-center rounded-[14px] bg-[#0ea5e9] text-white p-4 font-semibold text-xs transition duration-200 hover:opacity-90 active:scale-95 shadow-sm min-h-[92px]"
              >
                <Send className="h-5 w-5 mb-1.5" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">Send Email</span>
              </button>

              {/* Button 4: Schedule Meeting */}
              <button
                onClick={() => router.push('/marketing/automation')}
                className="flex flex-col items-center justify-center rounded-[14px] bg-[#22c55e] text-white p-4 font-semibold text-xs transition duration-200 hover:opacity-90 active:scale-95 shadow-sm min-h-[92px]"
              >
                <Calendar className="h-5 w-5 mb-1.5" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">Schedule Meeting</span>
              </button>

              {/* Button 5: Upload Documents */}
              <button
                onClick={() => router.push('/marketing/landing-pages-forms')}
                className="flex flex-col items-center justify-center rounded-[14px] bg-slate-100 hover:bg-slate-200 text-neutral-800 p-4 font-semibold text-xs transition duration-200 active:scale-95 border border-neutral-200/50 min-h-[92px]"
              >
                <Upload className="h-5 w-5 mb-1.5 text-neutral-700" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">Upload Documents</span>
              </button>

              {/* Button 6: Send SMS */}
              <button
                onClick={() => router.push('/marketing/campaigns?sms=true')}
                className="flex flex-col items-center justify-center rounded-[14px] bg-slate-200 hover:bg-slate-300 text-neutral-800 p-4 font-semibold text-xs transition duration-200 active:scale-95 border border-slate-300/50 min-h-[92px]"
              >
                <MessageSquare className="h-5 w-5 mb-1.5 text-neutral-700" />
                <span className="text-[10px] sm:text-xs font-bold leading-tight">Send SMS</span>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100 hidden xl:block">
            <div className="rounded-xl bg-neutral-50 p-3 text-neutral-500 text-[11px] leading-relaxed font-medium">
              <strong>Tip:</strong> You can speed up operations by creating targeted automation flows for newly submitted student applications.
            </div>
          </div>
        </div>
      </div>

      {/* Funnels section matching the screenshot repeated stage layout */}
      {/* <div className="grid gap-6 md:grid-cols-2">
        //  Student Funnel Card 
        <div className="rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-[17px] font-extrabold text-neutral-900">Student Funnel</h2>

          <div className="mt-6 space-y-5">
            {funnels?.studentFunnel?.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-neutral-500">
                  <span>{item.stage}</span>
                  <span className="text-neutral-900 font-extrabold">
                    {formatNumber(item.count)} <span className="text-neutral-500 font-medium ml-1">({item.conversion})</span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-[#1e3a8a] rounded-full transition-all duration-500" 
                    style={{ width: item.conversion.includes('%') ? item.conversion : `${item.conversion}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        //  Agency Funnel Card
        <div className="rounded-[20px] border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-[17px] font-extrabold text-neutral-900">Agency Funnel</h2>

          <div className="mt-6 space-y-5">
            {funnels?.agencyFunnel?.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-neutral-500">
                  <span>{item.stage}</span>
                  <span className="text-neutral-900 font-extrabold">
                    {formatNumber(item.count)} <span className="text-neutral-500 font-medium ml-1">({item.conversion})</span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-[#0ea5e9] rounded-full transition-all duration-500" 
                    style={{ width: item.conversion.includes('%') ? item.conversion : `${item.conversion}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}
      </div>
    </div>
  );
};

export default MarketingDashboard;
