'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import Link from 'next/link';

interface CalendarData {
  month: number;
  year: number;
  employees: any[];
  leaves: any[];
  wfh: any[];
  holidays: any[];
  attendance: any[];
}

export function TeamCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'wfh' | 'leave' | 'absent'>('all');

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    fetch(`/api/team/calendar?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(res => {
        if (!cancelled && res.success) {
          setData(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [month, year]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month, 1));

  // Generate days array for the grid
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const getLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return {
      date: i + 1,
      dayStr: d.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      fullDateStr: getLocalDateStr(d)
    };
  });

  // Process data into a map for fast lookup
  // Map format: employeeId -> dateStr -> { type: 'WFH' | 'PL' | 'UL' | 'H' | 'WO' | 'A', label: string, colorClass: string }
  const calendarMap = useMemo(() => {
    if (!data) return new Map();
    
    const map = new Map();
    
    // Initialize map for all employees
    data.employees.forEach(emp => {
      map.set(emp.id, new Map());
    });

    // Populate Weekly Offs & Holidays for all employees
    days.forEach(d => {
      data.employees.forEach(emp => {
        if (d.isWeekend) {
          map.get(emp.id).set(d.fullDateStr, { type: 'WO', label: 'WO', class: 'bg-muted/50 text-muted-foreground border-border' });
        }
      });
      
      const holiday = data.holidays.find(h => h.date.split('T')[0] === d.fullDateStr);
      if (holiday) {
        data.employees.forEach(emp => {
          map.get(emp.id).set(d.fullDateStr, { type: 'H', label: 'H', class: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' });
        });
      }
    });

    // WFH
    data.wfh.forEach(w => {
      const dateStr = w.request_date.split('T')[0];
      if (map.has(w.employee_id)) {
        const existing = map.get(w.employee_id).get(dateStr);
        if (existing && existing.type !== 'WO' && existing.type !== 'H') {
          map.get(w.employee_id).set(dateStr, { type: 'ML', label: 'ML', class: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30' });
        } else {
          map.get(w.employee_id).set(dateStr, { type: 'WFH', label: 'WFH', class: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30' });
        }
      }
    });

    // Leaves
    data.leaves.forEach(l => {
      // Need to iterate through leave dates (simplified here if assuming exact match or within month)
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Skip if outside current month
        if (d.getMonth() + 1 !== month || d.getFullYear() !== year) continue;
        
        if (map.has(l.employee_id)) {
          const type = l.is_paid ? 'PL' : 'UL';
          const cssClass = l.is_paid 
            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30' 
            : 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30';
            
          const existing = map.get(l.employee_id).get(dateStr);
          if (existing && existing.type !== 'WO' && existing.type !== 'H') {
             map.get(l.employee_id).set(dateStr, { type: 'ML', label: 'ML', class: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30' });
          } else {
             map.get(l.employee_id).set(dateStr, { type, label: type, class: cssClass });
          }
        }
      }
    });

    // Attendance (Absents/Leaves due to no attendance)
    data.attendance.forEach(a => {
      const dateStr = a.date.split('T')[0];
      if (a.status === 'ABSENT' || a.status === 'ON_LEAVE') {
        if (map.has(a.employee_id)) {
           const existing = map.get(a.employee_id).get(dateStr);
           // Only mark as absent if not already marked as leave/wfh/holiday
           if (!existing || existing.type === 'WO') {
              const type = a.status === 'ABSENT' ? 'A' : 'L';
              map.get(a.employee_id).set(dateStr, { 
                type, 
                label: type, 
                class: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 border-dashed' 
              });
           }
        }
      }
    });

    return map;
  }, [data, month, year, days]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    return data.employees.filter(emp => {
      const nameMatch = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
      const identifierMatch = emp.identifier?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!nameMatch && !identifierMatch) return false;
      
      if (activeFilter === 'all') return true;
      
      const empStatusMap = calendarMap.get(emp.id);
      if (!empStatusMap) return false;
      
      const statuses = Array.from(empStatusMap.values()) as any[];
      if (activeFilter === 'wfh') return statuses.some(s => s.type === 'WFH');
      if (activeFilter === 'leave') return statuses.some(s => s.type === 'PL' || s.type === 'UL' || s.type === 'ML');
      if (activeFilter === 'absent') return statuses.some(s => s.type === 'A');
      
      return true;
    });
  }, [data, searchQuery, activeFilter, calendarMap]);

  const todayStr = getLocalDateStr(today);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-xl shadow-shadow/5 overflow-hidden flex flex-col w-full backdrop-blur-sm bg-card/80">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border bg-muted/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shadow-inner">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Team Availability</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">Live Pulse Calendar</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Filter by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-xs font-bold outline-none focus:border-primary/50 focus:bg-muted/50 transition-all w-48 group-hover:w-64"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Users size={14} />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/50">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-background rounded-lg transition-all text-muted-foreground hover:text-foreground active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 py-1 bg-background border border-border/50 rounded-lg shadow-sm">
              <span className="text-sm font-black text-center uppercase tracking-widest text-foreground min-w-[140px] block">
                {monthName} {year}
              </span>
            </div>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-background rounded-lg transition-all text-muted-foreground hover:text-foreground active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border/30 bg-muted/5 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Members', count: data?.employees.length || 0 },
          { id: 'wfh', label: 'WFH', color: 'blue' },
          { id: 'leave', label: 'On Leave', color: 'amber' },
          { id: 'absent', label: 'Absent', color: 'red' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeFilter === filter.id 
              ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105' 
              : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border/50 hover:bg-muted/50'
            }`}
          >
            {filter.label} {filter.count !== undefined && <span className="ml-1 opacity-60">({filter.count})</span>}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative w-full overflow-x-auto no-scrollbar">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !data || data.employees.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-foreground">No team members found</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              There are no employees available to display in the calendar for the selected period.
            </p>
          </div>
        ) : (
          <div className="min-w-max pb-4">
            {/* Grid Header */}
            <div className="flex border-b border-border bg-muted/30 sticky top-0 z-30">
              <div className="w-64 shrink-0 py-4 px-6 border-r border-border font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground sticky left-0 bg-muted/90 backdrop-blur-md z-40 shadow-[4px_0_10px_rgba(0,0,0,0.03)] flex items-center">
                Team Member
              </div>
              <div className="flex flex-1">
                {days.map(d => {
                  const isToday = d.fullDateStr === todayStr;
                  return (
                    <div key={d.date} className={`w-12 shrink-0 flex flex-col items-center justify-center py-3 border-r border-border/30 transition-colors ${
                      isToday ? 'bg-primary/10 text-primary z-10 ring-2 ring-primary/20 ring-inset' : 
                      d.isWeekend ? 'bg-muted/40 text-muted-foreground/60' : 'bg-background'
                    }`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isToday ? 'text-primary' : 'opacity-40'}`}>
                        {d.dayStr}
                      </span>
                      <span className={`text-sm font-black ${isToday ? 'scale-110' : ''}`}>{d.date}</span>
                      {isToday && <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid Body */}
            <div className="flex flex-col">
              {filteredEmployees.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center justify-center">
                   <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No matching members found</p>
                </div>
              ) : filteredEmployees.map(emp => (
                <div key={emp.id} className="flex border-b border-border/30 hover:bg-muted/5 transition-all group">
                  {/* Employee sticky cell */}
                  <div className="w-64 shrink-0 py-4 px-6 border-r border-border flex items-center gap-4 sticky left-0 bg-background/95 backdrop-blur-sm group-hover:bg-muted/20 transition-all z-20 shadow-[4px_0_10px_rgba(0,0,0,0.03)]">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-xs border border-primary/20 group-hover:rotate-3 transition-transform">
                        {emp.identifier ? emp.identifier.slice(-2) : emp.first_name[0]}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background ${emp.is_active ? 'bg-green-500' : 'bg-muted'}`}></div>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/70 truncate mt-0.5">
                        {emp.identifier || 'TEAM MEMBER'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Days cells */}
                  <div className="flex flex-1">
                    {days.map(d => {
                      const status = calendarMap.get(emp.id)?.get(d.fullDateStr);
                      const isToday = d.fullDateStr === todayStr;
                      return (
                        <div key={d.date} className={`w-12 shrink-0 border-r border-border/30 flex items-center justify-center p-1.5 transition-colors relative ${
                          isToday ? 'bg-primary/5' : 
                          d.isWeekend && !status ? 'bg-muted/10' : ''
                        }`}>
                          {status ? (
                            <div 
                              className={`w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-black border-b-2 shadow-sm transition-all hover:scale-110 hover:shadow-md cursor-default z-10 ${status.class}`} 
                              title={`${emp.first_name}: ${status.type}`}
                            >
                              {status.label}
                            </div>
                          ) : (
                            <div className="w-full h-8 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/50 transition-all"></div>
                          )}
                          {isToday && <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-muted/5 border-t border-border p-6 flex flex-wrap gap-x-8 gap-y-4 items-center justify-center md:justify-start">
        <div className="flex items-center gap-2 mr-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status Legend</span>
          <div className="w-8 h-[2px] bg-border rounded-full"></div>
        </div>
        <LegendItem label="Work from home" code="WFH" colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 border-b-blue-500/40" />
        <LegendItem label="Paid Leave" code="PL" colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 border-b-amber-500/40" />
        <LegendItem label="Unpaid Leave" code="UL" colorClass="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 border-b-rose-500/40" />
        <LegendItem label="No Attendance" code="A" colorClass="bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/20 border-dashed border-b-red-500/40" />
        <LegendItem label="Weekly off" code="WO" colorClass="bg-muted/30 text-muted-foreground border-border/50 border-b-muted-foreground/20" />
        <LegendItem label="Holiday" code="H" colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 border-b-emerald-500/40" />
        <LegendItem label="Multiple" code="ML" colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 border-b-purple-500/40" />
      </div>
    </div>
  );
}

function LegendItem({ label, code, colorClass }: { label: string, code: string, colorClass: string }) {
  return (
    <div className="flex items-center gap-3 group cursor-help">
      <div className={`w-10 h-6 rounded-lg border-2 flex items-center justify-center text-[9px] font-black shadow-sm group-hover:scale-110 transition-transform ${colorClass}`}>
        {code}
      </div>
      <span className="text-[10px] font-black text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tighter">{label}</span>
    </div>
  );
}
