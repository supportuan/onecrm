'use client';

import { useState, useEffect } from 'react';
import { MousePointer2, Loader2 } from 'lucide-react';

export function RemoteClockIn() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();

    const sse = new EventSource('/api/attendance/events');
    sse.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);

        // Only react to remote attendance updates (ignore biometric/system events).
        const isRemoteEvent = ev?.channel === 'remote' || ev?.data?.is_remote === true || ev?.data?.source === 'web';
        if (!isRemoteEvent) return;

        if (ev?.data) {
          setStatus((prev: any) => {
            if (
              ev?.data?.employee_id &&
              prev?.employee_id &&
              ev.data.employee_id !== prev.employee_id
            ) {
              return prev;
            }
            return ev.data;
          });
          setLoading(false);
        } else {
          fetchStatus();
        }
      } catch {
        fetchStatus();
      }
    };

    sse.onerror = () => {
      // Reconcile state if the stream drops and reconnects.
      fetchStatus();
    };

    return () => sse.close();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/attendance/remote');
      const data = await res.json();
      if (data.success) setStatus(data.attendance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: 'in' | 'out') => {
    setActionLoading(true);
    let location = null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        acc: position.coords.accuracy,
        ts: position.timestamp
      };
    } catch (err: any) {
      console.warn("Location capture failed:", err);
      const proceed = confirm(`Could not capture your location (${err.message || "Access denied"}). Clock-${type} anyway?`);
      if (!proceed) {
        setActionLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/attendance/remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          location,
          metadata: { ua: navigator.userAgent }
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.attendance) setStatus(data.attendance);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="h-10 flex items-center justify-center"><Loader2 className="animate-spin" size={16} /></div>;

  const sessions = status?.remote_metadata?.sessions || [];
  const isRemoteActive = Array.isArray(sessions) && sessions.some((s: { out?: string }) => s && !s.out);
  const isDayCompleted = status?.check_out && !isRemoteActive;

  return (
    <div className="space-y-3">
      {isDayCompleted && (
        <div className="bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30 p-3 text-center rounded-lg">
          <p className="text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-300 tracking-widest">Shift Closed (LIFO: {new Date(status.check_out).toLocaleTimeString()})</p>
        </div>
      )}

      <button
        disabled={actionLoading}
        onClick={() => handleAction(isRemoteActive ? 'out' : 'in')}
        className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isRemoteActive
          ? 'bg-rose-500 text-white shadow-rose-500/20 dark:shadow-rose-900/40 hover:bg-rose-600'
          : 'bg-primary text-primary-foreground shadow-primary/20 dark:shadow-primary/40 hover:scale-[1.02]'
          }`}
      >
        {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <MousePointer2 size={12} />}
        {isRemoteActive ? 'Remote Clock-Out' : 'Remote Clock-In'}
      </button>
    </div>
  );
}

