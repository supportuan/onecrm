'use client';

import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

export default function AccessControlTab() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningRole, setAssigningRole] = useState<string | null>(null);

  const MANAGED_ROLES = [
    { id: 'EXPENSE_MANAGER', name: 'Expense Manager', desc: 'Can approve and manage company expenses.' },
    { id: 'GLOBAL_ADMIN', name: 'Global Admin', desc: 'Full system access across all departments.' },
    { id: 'HR_EXECUTIVE', name: 'HR Executive', desc: 'Basic HR functions and records updates.' },
    { id: 'HR_MANAGER', name: 'HR Manager', desc: 'Advanced HR functions and approvals.' },
    { id: 'IT_ADMIN', name: 'IT Admin', desc: 'System configuration and biometric devices.' },
    { id: 'PAYROLL_ADMIN', name: 'Payroll Admin', desc: 'Salary structures and payroll execution.' },
  ];

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success) setEmployees(data.team || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleAssignRole = async (employeeId: string, role: string) => {
    setAssigningRole(role);
    try {
      const res = await fetch(`/api/employees/${employeeId}/access-role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) fetchEmployees();
    } catch (err) { console.error(err); }
    finally { setAssigningRole(null); }
  };

  if (loading) return <LoadingPlaceholder />;

  return (
    <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden animate-in fade-in">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <th className="px-8 py-5">Role Level</th>
            <th className="px-8 py-5">Responsibilities</th>
            <th className="px-8 py-5">Assigned Members</th>
            <th className="px-8 py-5 text-right">Assignment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {MANAGED_ROLES.map((role) => {
            const assigned = employees.filter(e => e.access_role === role.id);
            const unassigned = employees.filter(e => e.access_role !== role.id);
            return (
              <tr key={role.id} className="hover:bg-muted/10 transition-colors">
                <td className="px-8 py-6">
                  <p className="font-bold text-foreground uppercase tracking-tight">{role.name}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{role.id}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs text-muted-foreground font-medium max-w-xs">{role.desc}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-2">
                    {assigned.map(emp => (
                      <div key={emp.id} className="flex items-center gap-2 bg-muted border border-border rounded-xl pl-3 pr-1 py-1">
                        <span className="text-[10px] font-bold text-foreground uppercase">{emp.name}</span>
                        <button onClick={() => handleAssignRole(emp.id, 'EMPLOYEE')} className="p-1 hover:text-destructive transition-colors"><X size={12} /></button>
                      </div>
                    ))}
                    {assigned.length === 0 && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">None</span>}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                   {assigningRole === role.id ? <Loader2 className="w-4 h-4 animate-spin text-primary inline-block" /> : (
                     <select 
                       className="bg-card border border-border rounded-xl text-[10px] font-bold uppercase px-3 py-2 outline-none focus:border-primary transition-all"
                       onChange={(e) => { handleAssignRole(e.target.value, role.id); e.target.value = ""; }}
                       defaultValue=""
                     >
                       <option value="" disabled>+ Assign</option>
                       {unassigned.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                     </select>
                   )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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

