'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Sliders, 
  Users, 
  Wallet, 
  Fingerprint, 
  Network, 
  Info,
  Check,
  Save,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';
import { ROLE_PERMISSIONS } from '../../lib/auth/rbac';

export default function RolesPermissions() {
  const [roles, setRoles] = useState(['SUPER_ADMIN', 'ADMIN']);
  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');
  const [searchQuery, setSearchQuery] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  
  // Custom permissions state simulating stateful customization
  const [customPermissions, setCustomPermissions] = useState(ROLE_PERMISSIONS);
  const [successToast, setSuccessToast] = useState('');

  // Fetch custom permissions from backend on mount
  useEffect(() => {
    const fetchCustom = async () => {
      try {
        const res = await fetch('/api/auth/custom-permissions');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.customPermissions && Object.keys(data.customPermissions).length > 0) {
            setCustomPermissions(data.customPermissions);
            // Include any dynamically loaded custom roles in the roles list
            const loadedRoles = Object.keys(data.customPermissions);
            const merged = Array.from(new Set(['SUPER_ADMIN', 'ADMIN', ...loadedRoles]));
            setRoles(merged);
          }
        }
      } catch (err) {
        console.error("Failed to load custom permissions:", err);
      }
    };
    fetchCustom();
  }, []);

  const permissionCategories = [
    {
      title: 'Employee Directory & Organization',
      icon: Users,
      permissions: [
        { key: 'VIEW_ALL_EMPLOYEES', name: 'View All Employees', desc: 'Allows viewing full institutional personnel directory lists.' },
        { key: 'MANAGE_EMPLOYEES', name: 'Manage Employees', desc: 'Allows creating, modifying, and archiving employee records.' },
        { key: 'VIEW_TEAM', name: 'View Team Members', desc: 'Access to viewing assigned reporting tree and team members.' },
        { key: 'MANAGE_TEAM', name: 'Manage Team Organization', desc: 'Allows reorganizing teams and supervisor relationships.' }
      ]
    },
    {
      title: 'Finance & Payroll',
      icon: Wallet,
      permissions: [
        { key: 'MANAGE_PAYROLL', name: 'Manage Payroll Structures', desc: 'Permissions to execute monthly batches and override structures.' },
        { key: 'VIEW_OWN_PAYSLIP', name: 'View Personal Statement', desc: 'Allows downloading and printing own monthly payslip statements.' },
        { key: 'VIEW_REPORTS', name: 'View Financial Reports', desc: 'Gives access to auditing ledger distributions and finance analytics.' }
      ]
    },
    {
      title: 'Biometric Security & Hardware',
      icon: Fingerprint,
      permissions: [
        { key: 'MANAGE_BIOMETRICS', name: 'Manage Biometric Registries', desc: 'Register hardware devices and merge enrolling user indices.' },
        { key: 'MANAGE_NETWORK_SECURITY', name: 'Manage Network Whitelist', desc: 'Configure IP ranges, whitelist subnets, and active geofences.' },
        { key: 'VIEW_ATTENDANCE', name: 'View Attendance Ledgers', desc: 'Auditing daily clocks, Team Calendars, and system logs.' },
        { key: 'MANAGE_ATTENDANCE', name: 'Override & Regularize Clocks', desc: 'Allows approving or rejecting attendance correction requests.' }
      ]
    },
    {
      title: 'Leave & System Settings',
      icon: Sliders,
      permissions: [
        { key: 'VIEW_LEAVE', name: 'View Leave Balances', desc: 'Allows checking staff leave requests and carry-forward balances.' },
        { key: 'MANAGE_LEAVE', name: 'Manage Leave Policies', desc: 'Configure entitlement cycles, definitions, and approve leaves.' },
        { key: 'MANAGE_SYSTEM', name: 'Manage System Operations', desc: 'Gives root configuration privileges to modify branding and cycles.' },
        { key: 'MANAGE_ADMINS', name: 'Manage Administrator Accounts', desc: 'Grant or revoke administrative permissions for corporate keys.' }
      ]
    }
  ];

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    const formatted = newRoleName.trim().toUpperCase().replace(/[-\s]/g, '_');
    if (roles.includes(formatted)) {
      alert("This role already exists!");
      return;
    }
    setRoles([...roles, formatted]);
    setCustomPermissions({
      ...customPermissions,
      [formatted]: []
    });
    setSelectedRole(formatted);
    setNewRoleName('');
    setSuccessToast(`Custom role ${formatted} added to draft layout.`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleDeleteRole = (roleToDelete) => {
    if (['SUPER_ADMIN', 'ADMIN'].includes(roleToDelete)) {
      alert("Core platform roles cannot be deleted!");
      return;
    }
    const updatedRoles = roles.filter(r => r !== roleToDelete);
    setRoles(updatedRoles);
    
    const updatedPerms = { ...customPermissions };
    delete updatedPerms[roleToDelete];
    setCustomPermissions(updatedPerms);

    if (selectedRole === roleToDelete) {
      setSelectedRole('SUPER_ADMIN');
    }
    setSuccessToast(`Role ${roleToDelete} removed.`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleTogglePermission = (role, permKey) => {
    const activePerms = customPermissions[role] || [];
    let updated;
    if (activePerms.includes(permKey)) {
      updated = activePerms.filter(p => p !== permKey);
    } else {
      updated = [...activePerms, permKey];
    }
    setCustomPermissions({
      ...customPermissions,
      [role]: updated
    });
  };

  const handleCommitPermissions = async () => {
    try {
      const res = await fetch('/api/auth/custom-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPermissions })
      });
      if (res.ok) {
        setSuccessToast(`Security access guidelines committed successfully.`);
        setTimeout(() => setSuccessToast(''), 3000);
      } else {
        alert("Failed to commit guidelines to backend customPermissionsStore");
      }
    } catch (err) {
      console.error('Error committing custom permissions:', err);
      alert("Error committing custom permissions");
    }
  };

  const handleResetDefaults = async () => {
    const defaults = {
      SUPER_ADMIN: [
        'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
        'MANAGE_BIOMETRICS', 'MANAGE_NETWORK_SECURITY', 'MANAGE_SCHEDULING',
        'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
        'MANAGE_ADMINS', 'MANAGE_SUPPORT_REQUESTS', 'MANAGE_SYSTEM', 'VIEW_REPORTS'
      ],
      ADMIN: [
        'VIEW_ALL_EMPLOYEES', 'MANAGE_EMPLOYEES', 'MANAGE_PAYROLL', 'VIEW_OWN_PAYSLIP',
        'MANAGE_BIOMETRICS', 'VIEW_TEAM', 'MANAGE_TEAM', 'VIEW_ATTENDANCE', 'MANAGE_ATTENDANCE', 'VIEW_LEAVE', 'MANAGE_LEAVE',
        'MANAGE_SUPPORT_REQUESTS', 'MANAGE_SYSTEM', 'VIEW_REPORTS'
      ]
    };
    try {
      const res = await fetch('/api/auth/custom-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPermissions: defaults })
      });
      if (res.ok) {
        setCustomPermissions(defaults);
        setRoles(['SUPER_ADMIN', 'ADMIN']);
        setSelectedRole('SUPER_ADMIN');
        setSuccessToast('Restored default role permissions from master config.');
        setTimeout(() => setSuccessToast(''), 3000);
      }
    } catch (err) {
      console.error("Failed to reset permissions:", err);
    }
  };

  const filteredRoles = roles.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      {/* Title */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">
          Roles & Permission Policies
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure security authorization, assign core transaction limits, and customize role-based access rules.
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast */}
        {successToast && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/25 rounded-2xl flex items-center gap-3 text-purple-400 animate-in fade-in duration-200">
            <ShieldCheck size={18} />
            <span className="text-xs font-semibold">{successToast}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
          {/* Sidebar Roles list */}
          <div className="w-full lg:w-80 bg-slate-800 border border-slate-700/60 rounded-3xl flex flex-col overflow-hidden shadow-xl shrink-0">
            <div className="p-6 border-b border-slate-700 bg-slate-800/40 space-y-4">
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 mb-2">Create Custom Role</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. IT_LEAD"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 placeholder-slate-500 focus:border-purple-500 outline-none transition-all"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddRole();
                    }}
                  />
                  <button
                    onClick={handleAddRole}
                    className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-slate-950 font-bold rounded-xl text-xs transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Search roles..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 placeholder-slate-500 focus:border-purple-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-none no-scrollbar divide-y divide-slate-800">
              {filteredRoles.map(role => {
                const isActive = selectedRole === role;
                const permissionsCount = (customPermissions[role] || []).length;
                const isSystemRole = ['SUPER_ADMIN', 'ADMIN'].includes(role);
                return (
                  <div
                    key={role}
                    className={`w-full group relative transition-all flex items-center justify-between ${
                      isActive 
                        ? 'bg-slate-750/90 border-l-4 border-l-purple-500' 
                        : 'border-l-4 border-l-transparent hover:bg-slate-750/40'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="flex-1 p-5 text-left flex items-center justify-between"
                    >
                      <div>
                        <p className={`text-xs font-extrabold tracking-wider uppercase ${
                          isActive ? 'text-purple-400' : 'text-slate-200'
                        }`}>
                          {role.replace('_', ' ')}
                        </p>
                        <p className="text-[9px] font-semibold text-slate-500 mt-1">
                          {permissionsCount} Active Guidelines
                        </p>
                      </div>
                    </button>
                    <div className="pr-4 flex items-center gap-2">
                      {!isSystemRole && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role);
                          }}
                          className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                          title="Delete Custom Role"
                        >
                          ✕
                        </button>
                      )}
                      <Shield size={12} className={`transition-transform duration-300 ${
                        isActive ? 'text-purple-400 scale-110' : 'text-slate-600 group-hover:scale-105'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core access panel grid */}
          <div className="flex-1 bg-slate-800 border border-slate-700/60 rounded-3xl flex flex-col overflow-hidden shadow-xl">
            <header className="px-8 py-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-purple-400" />
                  <h3 className="text-lg font-semibold text-slate-100">{selectedRole.replace('_', ' ')}</h3>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 mt-1">
                  Assigned Guidelines & Authorization Policies
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetDefaults}
                  className="px-4 py-2 border border-slate-700 hover:border-slate-600 rounded-xl text-[10px] font-semibold text-slate-350 hover:bg-slate-750 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw size={12} />
                  Restore Defaults
                </button>
                <button
                  onClick={handleCommitPermissions}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-950 rounded-xl text-[10px] font-semibold shadow-lg shadow-purple-500/10 hover:scale-[1.01] hover:shadow-xl transition-all flex items-center gap-1.5"
                >
                  <Save size={12} />
                  Commit System Access
                </button>
              </div>
            </header>

            <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8">
              {permissionCategories.map((category, catIdx) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={catIdx} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-750 pb-2">
                      <CategoryIcon size={14} className="text-slate-450" />
                      <h4 className="text-[11px] font-semibold text-slate-400">{category.title}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.permissions.map((perm) => {
                        const isGranted = (customPermissions[selectedRole] || []).includes(perm.key);
                        return (
                          <div 
                            key={perm.key}
                            onClick={() => handleTogglePermission(selectedRole, perm.key)}
                            className={`p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 flex items-start gap-4 ${
                              isGranted
                                ? 'bg-purple-500/5 border-purple-500/40 text-slate-200 hover:bg-purple-500/10'
                                : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:border-slate-650'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isGranted ? (
                                <div className="p-1 bg-purple-500 text-slate-950 rounded-md">
                                  <Check size={10} className="stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-4.5 h-4.5 border border-slate-700 rounded-md bg-slate-950"></div>
                              )}
                            </div>
                            
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-wider ${
                                isGranted ? 'text-purple-400' : 'text-slate-300'
                              }`}>
                                {perm.name}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                                {perm.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
