'use client';

import React from 'react';
import { X, Calendar, Plane, Clock, ChevronRight } from 'lucide-react';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  holidays: Holiday[];
}

export function HolidayModal({ isOpen, onClose, holidays }: HolidayModalProps) {
  if (!isOpen) return null;

  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date());
  const pastHolidays = holidays.filter(h => new Date(h.date) < new Date());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col scale-100 animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-foreground leading-none">Holidays</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-6">
            {upcomingHolidays.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary ml-2">Upcoming</p>
                <div className="space-y-1">
                  {upcomingHolidays.map((holiday, index) => (
                    <div key={holiday.id || `${holiday.name}-${holiday.date}-${index}`} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-muted w-12 h-12 rounded-xl border border-border shrink-0">
                          <span className="text-sm font-bold text-foreground">{new Date(holiday.date).getDate()}</span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(holiday.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground uppercase tracking-tight">{holiday.name}</h4>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(holiday.date).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-primary/5 text-primary rounded-lg text-[8px] font-bold uppercase tracking-widest border border-primary/10">
                        {holiday.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastHolidays.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Passed</p>
                <div className="space-y-1 opacity-60">
                  {pastHolidays.map((holiday, index) => (
                    <div key={holiday.id || `${holiday.name}-${holiday.date}-${index}`} className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl grayscale">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-muted w-12 h-12 rounded-xl border border-border shrink-0">
                          <span className="text-sm font-bold text-muted-foreground">{new Date(holiday.date).getDate()}</span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(holiday.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-tight">{holiday.name}</h4>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(holiday.date).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

