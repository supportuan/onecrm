'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, RefreshCw, Activity, Trash2, Loader2, X, Check } from 'lucide-react';
import { hardwareUserKey, mergeDeviceUserBatches } from '@/lib/biometric/enrolled-merge';

export default function BiometricTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceIp, setSelectedDeviceIp] = useState('');
  const [mode, setMode] = useState('WEB_UI');
  const [skipRoles, setSkipRoles] = useState<string[]>([]);
  const [skipEmployeeIds, setSkipEmployeeIds] = useState<string>('');
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [newDev, setNewDev] = useState({ name: '', ip: '' });
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sidebarBusy, setSidebarBusy] = useState(false);
  const [processingLogs, setProcessingLogs] = useState(false);
  const [enrolledMergeInfo, setEnrolledMergeInfo] = useState<{
    warnings: string[];
    skippedNoHardwareId: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ALL_DEVICES = '__ALL__';

  const fetchInit = async (mode: 'bootstrap' | 'refresh' = 'refresh') => {
    if (mode === 'bootstrap') setBootstrapping(true);
    else setSidebarBusy(true);
    try {
      const [dRes, sRes, eRes] = await Promise.all([
        fetch('/api/admin/devices').then(r => r.json()),
        fetch('/api/admin/attendance/settings').then(r => r.json()),
        fetch('/api/employees?scope=all').then(r => r.json())
      ]);
      if (dRes.success) {
        const fetchedDevices = dRes.devices || [];
        setDevices(fetchedDevices);
        setSelectedDeviceIp((prev) => {
          if (prev && fetchedDevices.some((d: any) => d.device_ip === prev)) return prev;
          return fetchedDevices.length > 1 ? ALL_DEVICES : (fetchedDevices[0]?.device_ip || '');
        });
      }
      if (sRes.success) {
        setMode(sRes.settings.attendance_mode || 'WEB_UI');
        setSkipRoles(sRes.settings.skip_attendance_roles || []);
        setSkipEmployeeIds((sRes.settings.skip_attendance_employee_ids || []).join(', '));
      }
      if (eRes.success) setAllEmployees(eRes.employees || []);
    } catch (e: any) { setError(e.message); }
    finally {
      setBootstrapping(false);
      setSidebarBusy(false);
    }
  };

  useEffect(() => { void fetchInit('bootstrap'); }, []);

  useEffect(() => {
    if (!selectedDeviceIp) {
      setUsers([]);
      setEnrolledMergeInfo(null);
      return;
    }
    const loadUsers = async () => {
      try {
        if (selectedDeviceIp === ALL_DEVICES) {
          const ips = devices.map((d) => d.device_ip).filter(Boolean);
          const batches: Parameters<typeof mergeDeviceUserBatches>[0] = [];
          for (const ip of ips) {
            try {
              const r = await fetch(`/api/biometric/users?ip=${encodeURIComponent(ip)}`).then((res) => res.json());
              batches.push({
                deviceIp: ip,
                success: !!r?.success,
                users: r?.users,
                error: r?.error,
              });
            } catch (e) {
              batches.push({
                deviceIp: ip,
                success: false,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
          const { merged, warnings, skippedNoHardwareId } = mergeDeviceUserBatches(batches);
          setUsers(merged);
          setEnrolledMergeInfo(
            warnings.length > 0 || skippedNoHardwareId > 0 ? { warnings, skippedNoHardwareId } : null
          );
          return;
        }

        setEnrolledMergeInfo(null);
        const uRes = await fetch(`/api/biometric/users?ip=${encodeURIComponent(selectedDeviceIp)}`).then((r) => r.json());
        if (uRes.success) setUsers(uRes.users || []);
        else setUsers([]);
      } catch {
        setUsers([]);
        setEnrolledMergeInfo(null);
      }
    };
    void loadUsers();
  }, [selectedDeviceIp, devices]);

  const addDev = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/admin/devices', { method: 'POST', body: JSON.stringify({ device_id: newDev.ip, device_name: newDev.name, device_ip: newDev.ip }) });
    if (res.ok) { setNewDev({ name: '', ip: '' }); void fetchInit('refresh'); }
  };

  const handleProcess = async () => {
    setProcessingLogs(true);
    try {
      const res = await fetch('/api/attendance/process', { method: 'POST' });
      const data = await res.json();
      if (data.success) alert(data.message);
      void fetchInit('refresh');
    } catch (e: any) { alert(e.message); }
    finally { setProcessingLogs(false); }
  };

  if (bootstrapping) return <LoadingPlaceholder />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
      <div className="lg:col-span-2 space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Biometric Hardware</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => void fetchInit('refresh')} disabled={sidebarBusy} className="p-2.5 bg-card border border-border rounded-2xl text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"><RefreshCw size={18} className={sidebarBusy ? 'animate-spin' : ''} /></button>
            <button type="button" onClick={handleProcess} disabled={processingLogs} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">Process Logs</button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm divide-y divide-border">
          {devices.map(d => (
            <div key={d.id} className="p-6 flex justify-between items-center hover:bg-muted/30 group transition-all">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-primary shadow-inner"><Fingerprint size={24} /></div>
                <div>
                  <p className="font-bold text-foreground text-sm uppercase tracking-tight">{d.device_name}</p>
                  <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{d.device_ip} · ONLINE</p>
                </div>
              </div>
              <button type="button" onClick={() => fetch(`/api/admin/devices?id=${d.id}`, { method: 'DELETE' }).then(() => void fetchInit('refresh'))} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 p-2 transition-all"><Trash2 size={16} /></button>
            </div>
          ))}
          {devices.length === 0 && <div className="p-20 text-center text-muted-foreground uppercase text-[10px] font-bold">No biometric devices registered</div>}
        </div>

        {users.length > 0 && (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-muted/50 border-b border-border flex justify-between items-center">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Enrolled Users (Device Cache)</h4>
               <div className="flex items-center gap-3">
                 <select
                   value={selectedDeviceIp}
                   onChange={(e) => setSelectedDeviceIp(e.target.value)}
                   className="rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-mono text-foreground"
                 >
                   {devices.length > 1 && <option value={ALL_DEVICES}>All Devices (Merged)</option>}
                   {devices.map((d) => (
                     <option key={d.id} value={d.device_ip}>
                       {d.device_name} ({d.device_ip})
                     </option>
                   ))}
                 </select>
                 <span className="text-[10px] font-bold text-primary">{users.length} Users</span>
               </div>
            </div>
            {enrolledMergeInfo && (
              <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-200 space-y-1">
                {enrolledMergeInfo.warnings.map((w) => (
                  <p key={w}>Device issue — {w} (users from that device may be missing until the device responds.)</p>
                ))}
                {enrolledMergeInfo.skippedNoHardwareId > 0 && (
                  <p>{enrolledMergeInfo.skippedNoHardwareId} row(s) skipped: no hardware user id in payload.</p>
                )}
              </div>
            )}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest sticky top-0 z-10">
                    <th className="px-6 py-4">HW ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={hardwareUserKey(u) ?? u.userId ?? JSON.stringify(u)} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-primary text-[10px] font-bold">{hardwareUserKey(u) ?? '—'}</td>
                      <td className="px-6 py-4 font-bold text-xs uppercase tracking-tight">{u.name}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-widest">Authorized</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-3xl p-8 h-fit space-y-6 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b border-border pb-4">Register Device</h3>
          <form onSubmit={addDev} className="space-y-4">
            <input placeholder="Device IP" required value={newDev.ip} onChange={e => setNewDev({ ...newDev, ip: e.target.value })} className="w-full bg-muted border border-border p-4 rounded-2xl text-sm font-mono outline-none focus:border-primary transition-all" />
            <input placeholder="Display Name" required value={newDev.name} onChange={e => setNewDev({ ...newDev, name: e.target.value })} className="w-full bg-muted border border-border p-4 rounded-2xl text-sm outline-none focus:border-primary transition-all" />
            <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all">Add Hardware</button>
          </form>
        </div>
        <div className="bg-muted/50 border border-border rounded-3xl p-8 space-y-6">
           <div className="flex items-center gap-2 text-primary">
              <Activity size={18} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">System Policy</h4>
           </div>
           
           <div className="space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attendance Mode</p>
              <div className="grid grid-cols-1 gap-2">
                 {['WEB_UI', 'BIOMETRIC', 'BOTH'].map(m => (
                   <button 
                     key={m} 
                     onClick={() => fetch('/api/admin/attendance/settings', { method: 'PATCH', body: JSON.stringify({ attendance_mode: m }) }).then(() => setMode(m))} 
                     className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${mode === m ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
                   >
                     {m.replace('_', ' ')}
                   </button>
                 ))}
              </div>
           </div>

           <div className="pt-4 border-t border-border/50 space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Skip Attendance for Roles</p>
              <div className="flex flex-wrap gap-2">
                {['EXECUTIVE', 'MANAGER', 'HR', 'ADMIN', 'STAFF'].map(role => {
                  const isSkipped = (Array.isArray(skipRoles) ? skipRoles : []).includes(role);
                  return (
                    <button
                      key={role}
                      onClick={async () => {
                        const newRoles = isSkipped 
                          ? skipRoles.filter(r => r !== role)
                          : [...(Array.isArray(skipRoles) ? skipRoles : []), role];
                        
                        const res = await fetch('/api/admin/attendance/settings', {
                          method: 'PATCH',
                          body: JSON.stringify({ skip_attendance_roles: newRoles })
                        });
                        if (res.ok) setSkipRoles(newRoles);
                      }}
                      className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${isSkipped ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Selected roles will be exempt from mandatory attendance logs and won't be marked as absent.
              </p>
           </div>
           <div className="pt-4 border-t border-border/50 space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Skip Attendance for Individuals</p>
              
              <div className="space-y-3">
                {/* Search Box */}
                <input 
                  type="text"
                  placeholder="Search by name..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full bg-card border border-border px-3 py-2 rounded-xl text-[10px] outline-none focus:border-primary transition-all"
                />

                {/* Selected Chips */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                   {skipEmployeeIds.split(',').map(s => s.trim()).filter(Boolean).map(id => {
                      const emp = allEmployees.find(e => e.employee_id === id);
                      return (
                        <div key={id} className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 group">
                           {emp ? `${emp.first_name} ${emp.last_name}` : id}
                           <button 
                             onClick={async () => {
                               const currentIds = skipEmployeeIds.split(',').map(s => s.trim()).filter(Boolean);
                               const newIds = currentIds.filter(i => i !== id);
                               const res = await fetch('/api/admin/attendance/settings', {
                                 method: 'PATCH',
                                 body: JSON.stringify({ skip_attendance_employee_ids: newIds })
                               });
                               if (res.ok) setSkipEmployeeIds(newIds.join(', '));
                             }}
                             className="hover:text-rose-500"
                           >
                             <X size={10} />
                           </button>
                        </div>
                      );
                   })}
                </div>

                {/* Search Results */}
                {employeeSearch && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto divide-y divide-border/50">
                    {allEmployees
                      .filter(e => `${e.first_name} ${e.last_name}`.toLowerCase().includes(employeeSearch.toLowerCase()))
                      .slice(0, 10)
                      .map(emp => {
                        const isSelected = skipEmployeeIds.includes(emp.employee_id);
                        return (
                          <button
                            key={emp.id}
                            onClick={async () => {
                              const currentIds = skipEmployeeIds.split(',').map(s => s.trim()).filter(Boolean);
                              const newIds = isSelected 
                                ? currentIds.filter(i => i !== emp.employee_id)
                                : [...currentIds, emp.employee_id];
                              
                              const res = await fetch('/api/admin/attendance/settings', {
                                method: 'PATCH',
                                body: JSON.stringify({ skip_attendance_employee_ids: newIds })
                              });
                              if (res.ok) {
                                setSkipEmployeeIds(newIds.join(', '));
                                setEmployeeSearch('');
                              }
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-muted transition-all flex justify-between items-center"
                          >
                            <div>
                              <p className="text-[10px] font-bold text-foreground">{emp.first_name} {emp.last_name}</p>
                              <p className="text-[8px] font-mono text-muted-foreground">{emp.employee_id}</p>
                            </div>
                            {isSelected && <Check size={12} className="text-primary" />}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Comprehensive Skipped List */}
              <div className="pt-2 space-y-2">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                   <Activity size={10} /> Currently Exempt
                 </p>
                 <div className="bg-card border border-border rounded-xl divide-y divide-border/50 max-h-40 overflow-y-auto">
                    {allEmployees
                      .filter(e => 
                        skipEmployeeIds.includes(e.employee_id) || 
                        (Array.isArray(skipRoles) && skipRoles.includes(e.role || e.access_role))
                      )
                      .map(emp => (
                        <div key={emp.id} className="px-3 py-2 flex justify-between items-center">
                           <div>
                              <p className="text-[10px] font-bold text-foreground">{emp.first_name} {emp.last_name}</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">
                                {skipEmployeeIds.includes(emp.employee_id) ? 'Individual Skip' : `Role: ${emp.role || emp.access_role}`}
                              </p>
                           </div>
                           {skipEmployeeIds.includes(emp.employee_id) && (
                              <button 
                                onClick={async () => {
                                  const currentIds = skipEmployeeIds.split(',').map(s => s.trim()).filter(Boolean);
                                  const newIds = currentIds.filter(i => i !== emp.employee_id);
                                  const res = await fetch('/api/admin/attendance/settings', {
                                    method: 'PATCH',
                                    body: JSON.stringify({ skip_attendance_employee_ids: newIds })
                                  });
                                  if (res.ok) setSkipEmployeeIds(newIds.join(', '));
                                }}
                                className="text-muted-foreground hover:text-rose-500 transition-colors"
                              >
                                <X size={12} />
                              </button>
                           )}
                        </div>
                      ))}
                    {allEmployees.filter(e => 
                        skipEmployeeIds.includes(e.employee_id) || 
                        (Array.isArray(skipRoles) && skipRoles.includes(e.role || e.access_role))
                      ).length === 0 && (
                      <div className="p-4 text-center text-[9px] text-muted-foreground italic">No active exemptions</div>
                    )}
                 </div>
              </div>
              
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Search and select employees by name to exempt them from attendance tracking.
              </p>
           </div>

        </div>
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

