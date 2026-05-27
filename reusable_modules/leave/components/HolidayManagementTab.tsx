'use client';

import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function HolidayManagementTab() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('public');
  const [holidayFolders, setHolidayFolders] = useState<string[]>(['public', 'restricted', 'institutional']);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchHolidays = async () => {
    try {
      const res = await fetch('/api/admin/holidays');
      const data = await res.json();
      if (data.success) {
        setHolidays(data.holidays || []);
        const existingFolders = (data.holidays || [])
          .map((h: any) => (h.type || '').trim())
          .filter((t: string) => Boolean(t));
        setHolidayFolders((prev) => Array.from(new Set([...prev, ...existingFolders])));
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAddFolder = () => {
    const folder = prompt('Enter holiday folder/list name (e.g., National, Academic, Festival):');
    if (!folder) return;
    const clean = folder.trim().toLowerCase();
    if (!clean) return;
    setHolidayFolders((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setType(clean);
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, type }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Holiday added successfully!' });
        setName('');
        setDate('');
        fetchHolidays();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add holiday' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      const res = await fetch('/api/admin/holidays', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchHolidays();
    } catch {
      // noop
    }
  };

  const filteredHolidays = holidays.filter((h) => h.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search holidays..."
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-2xl text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Holiday Name</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Folder</th>
                <th className="px-8 py-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : filteredHolidays.length > 0 ? (
                filteredHolidays.map((holiday) => (
                  <tr key={holiday.id || `${holiday.name}-${holiday.date}`} className="hover:bg-muted/10 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 text-primary rounded-lg">
                          <CalendarIcon size={16} />
                        </div>
                        <span className="text-sm font-bold text-foreground uppercase">{holiday.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-muted-foreground">
                      {new Date(holiday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-3 py-1 bg-muted border border-border rounded-lg text-[9px] font-bold text-foreground uppercase tracking-widest">
                        {holiday.type}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button onClick={() => handleDeleteHoliday(holiday.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-sm text-muted-foreground font-medium italic">
                    No holidays found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Add New Holiday</h3>
          <button type="button" onClick={handleAddFolder} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
            + Add Folder
          </button>
        </div>

        <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            required
            type="text"
            className="md:col-span-2 px-5 py-3.5 bg-muted/30 border border-border rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-medium"
            placeholder="Holiday name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            type="date"
            className="px-5 py-3.5 bg-muted/30 border border-border rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-medium"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            className="px-5 py-3.5 bg-muted/30 border border-border rounded-2xl focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-medium appearance-none"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {holidayFolders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-4 py-3 bg-primary text-secondary rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={14} />}
            Add Holiday
          </button>
        </form>

        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-4 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="shrink-0" /> : <AlertCircle className="shrink-0" />}
            <p className="text-[10px] font-bold uppercase tracking-tight">{message.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
