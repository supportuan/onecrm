'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle2, History, Send, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

interface RegularizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function RegularizationModal({ isOpen, onClose, isAdmin }: RegularizationModalProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'request' | 'history' | 'admin'> (isAdmin ? 'admin' : 'request');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/regularize');
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Construct ISO strings for check-in and check-out
      const checkInISO = checkIn ? `${date}T${checkIn}:00` : null;
      const checkOutISO = checkOut ? `${date}T${checkOut}:00` : null;

      const res = await fetch('/api/attendance/regularize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, checkIn: checkInISO, checkOut: checkOutISO, reason })
      });
      const data = await res.json();
      if (data.success) {
        alert('Request submitted successfully');
        setReason('');
        setCheckIn('');
        setCheckOut('');
        setActiveTab('history');
        fetchRequests();
      } else {
        alert(data.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    const remarks = prompt(`Enter remarks for ${status}:`);
    if (remarks === null) return;

    try {
      const res = await fetch(`/api/attendance/regularize/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks })
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-xl font-bold text-foreground">Attendance Regularization</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Correct your attendance logs for missed punches or errors</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 bg-muted/10">
          {!isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('request')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'request' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Submit Request
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                My History
              </button>
            </>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'admin' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Review Pending
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'request' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Requested In Time</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="time"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Requested Out Time</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="time"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason for Regularization</label>
                <div className="relative">
                  <MessageSquare size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <textarea
                    required
                    rows={4}
                    placeholder="E.g., Forgot to punch, Biometric machine failure, Worked from remote location..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={18} />
                  {submitting ? 'Submitting...' : 'Submit Regularization Request'}
                </button>
              </div>
            </form>
          )}

          {(activeTab === 'history' || activeTab === 'admin') && (
            <div className="space-y-4">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Clock className="animate-spin mb-4 opacity-20" size={40} />
                  <p className="text-sm font-medium">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                  <History className="mb-4 opacity-10" size={48} />
                  <p className="text-sm font-medium">No regularization requests found</p>
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="p-4 bg-muted/30 border border-border rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-card border border-border flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">{new Date(req.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                          <span className="text-lg font-bold text-foreground leading-none mt-1">{new Date(req.date).getDate()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{new Date(req.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                          {isAdmin && <p className="text-xs text-primary font-medium">{req.first_name} {req.last_name} ({req.university_id})</p>}
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        req.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {req.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-border/50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Requested Times</p>
                        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <Clock size={14} className="text-muted-foreground" />
                          {req.check_in ? new Date(req.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} 
                          <span className="mx-1 text-muted-foreground">→</span>
                          {req.check_out ? new Date(req.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submission Date</p>
                        <p className="text-sm font-medium text-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reason</p>
                      <p className="text-sm text-foreground bg-card/50 p-2 rounded-lg border border-border/50 italic">"{req.reason}"</p>
                    </div>

                    {req.remarks && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {req.status === 'approved' ? 'Approved' : 'Rejected'} by {req.approver_first_name} {req.approver_last_name}
                          {req.action_at && ` on ${new Date(req.action_at).toLocaleString()}`}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{req.remarks}</p>
                      </div>
                    )}

                    {isAdmin && req.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleAction(req.id, 'approved')}
                          className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'rejected')}
                          className="flex-1 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

