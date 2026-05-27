'use client';

import { useState, useEffect } from 'react';
import { Globe, Trash2, Loader2 } from 'lucide-react';

export default function NetworkAttendanceTab() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ip: '', label: '' });

  const fetchInit = () => {
    setLoading(true);
    const api = (url: string) => fetch(url).then(r => r.json());
    Promise.all([api('/api/admin/attendance/network'), api('/api/admin/attendance/settings')])
      .then(([p, s]) => { if (p.success) setPolicies(p.data); if (s.success) setSettings(s.settings); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchInit, []);

  const toggle = async () => {
    const val = !settings.enable_ip_validation;
    const res = await fetch('/api/admin/attendance/settings', { method: 'PATCH', body: JSON.stringify({ enable_ip_validation: val }) });
    if (res.ok) setSettings({ ...settings, enable_ip_validation: val });
  };

  const add = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/admin/attendance/network', { method: 'POST', body: JSON.stringify({ ip_address_or_range: form.ip, label: form.label, is_active: true }) });
    if (res.ok) { setForm({ ip: '', label: '' }); fetchInit(); }
  };

  if (loading) return <LoadingPlaceholder />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Authorized Networks</h3>
          <button onClick={toggle} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${settings.enable_ip_validation ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
            IP Validation: {settings.enable_ip_validation ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border shadow-sm">
          {policies.length ? policies.map(p => (
            <div key={p.id} className="p-6 flex justify-between items-center hover:bg-muted/30 group transition-all">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Globe size={18} /></div>
                <div>
                  <p className="font-mono text-foreground text-sm font-bold">{p.ip_address_or_range}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{p.label || 'Static Node'}</p>
                </div>
              </div>
              <button onClick={() => fetch(`/api/admin/attendance/network/${p.id}`, { method: 'DELETE' }).then(fetchInit)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 p-2 transition-all"><Trash2 size={16} /></button>
            </div>
          )) : <div className="p-20 text-center text-muted-foreground uppercase text-[10px] font-bold">No network restrictions active</div>}
        </div>
      </div>
      <div className="bg-card border border-border rounded-3xl p-8 h-fit space-y-6 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b border-border pb-4">Whitelist New IP</h3>
        <form onSubmit={add} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">IP / CIDR Range</label>
            <input required value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} className="w-full bg-muted border border-border p-4 rounded-2xl text-sm outline-none focus:border-primary font-mono transition-all" placeholder="1.2.3.4" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Label</label>
            <input required value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="w-full bg-muted border border-border p-4 rounded-2xl text-sm outline-none focus:border-primary transition-all" placeholder="Office HQ" />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all">Add Network</button>
        </form>
      </div>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center p-32 space-y-4 animate-pulse">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Configuring Environment...</p>
    </div>
  );
}

