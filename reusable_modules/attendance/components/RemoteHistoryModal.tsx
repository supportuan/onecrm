'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Clock, History, MapPin } from 'lucide-react';

type RemoteSession = {
  id: string;
  employeeId: string;
  name: string;
  identifier?: string;
  startedAt: string;
  endedAt: string | null;
  location?: any;
};

export function RemoteHistoryModal({
  open,
  onClose,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  employee: { employeeId: string; name: string; identifier?: string } | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<RemoteSession[]>([]);

  const title = useMemo(() => {
    if (!employee) return 'Remote history';
    return `${employee.name}${employee.identifier ? ` (${employee.identifier})` : ''}`;
  }, [employee]);

  useEffect(() => {
    if (!open || !employee?.employeeId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/remote-attendance/history?employeeId=${encodeURIComponent(employee.employeeId)}&limit=25`
        );
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to load history');
        if (!cancelled) setSessions(json.sessions || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, employee?.employeeId]);

  if (!open) return null;

  const fmt = (t: string) =>
    new Date(t).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <History size={14} className="text-primary" /> Remote sessions
            </p>
            <h2 className="text-base font-bold text-foreground truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="animate-spin" size={16} /> Loading history...
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-foreground">{error}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
                Try again in a moment
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No remote sessions found.</div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Clock size={12} /> {fmt(s.startedAt)} → {s.endedAt ? fmt(s.endedAt) : 'Active'}
                    </p>
                    {s.location && (
                      <div className="flex items-center gap-1.5 mt-1 group relative w-fit">
                        <MapPin size={10} className="text-primary animate-pulse" />
                        <span className="text-[8px] font-bold text-primary uppercase tracking-widest">
                          {(() => {
                            try {
                              const loc = typeof s.location === 'string' ? JSON.parse(s.location) : s.location;
                              return loc?.lat ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'Location Locked';
                            } catch {
                              return 'Location Locked';
                            }
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-xl w-fit ${
                      s.endedAt ? 'bg-muted text-muted-foreground border border-border' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {s.endedAt ? 'Closed' : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


