'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Search,
  Check,
  Lock,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  PERMISSION_CATEGORIES,
  ROLE_DESCRIPTIONS,
} from '../../lib/auth/rbac';
import { useAuth } from '../../lib/auth/AuthContext';
import { usePermissions } from '../../lib/auth/PermissionsContext';

export default function RolesPermissions() {
  const { user } = useAuth();
  const { permissionMap, can, updateRole, reset, refresh, loading } = usePermissions();

  const canView = can(['VIEW_ADMIN', 'MANAGE_SYSTEM', 'MANAGE_ADMINS']);
  const canEdit = can('MANAGE_ADMINS');

  const roles = useMemo(() => Object.keys(permissionMap || {}), [permissionMap]);

  const [selectedRole, setSelectedRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Sync local draft from the live map whenever it changes (and not mid-edit).
  useEffect(() => {
    if (!dirty) {
      setDraft(JSON.parse(JSON.stringify(permissionMap || {})));
    }
    if (!selectedRole && roles.length) {
      setSelectedRole(roles[0]);
    }
  }, [permissionMap, roles, dirty, selectedRole]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  if (user && !canView) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm max-w-md text-center space-y-3">
          <ShieldAlert size={36} className="text-rose-500 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-800">access denied</h2>
          <p className="text-[10px] text-slate-500">
            this page is restricted to administrators. signed in as{' '}
            <span className="font-semibold lowercase">{user?.role || 'unknown'}</span>.
          </p>
        </div>
      </div>
    );
  }

  const filteredRoles = roles.filter((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));
  const activePerms = draft[selectedRole] || [];

  const togglePerm = (permKey) => {
    if (!canEdit) return;
    setDraft((prev) => {
      const current = prev[selectedRole] || [];
      const next = current.includes(permKey)
        ? current.filter((p) => p !== permKey)
        : [...current, permKey];
      return { ...prev, [selectedRole]: next };
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!canEdit || !selectedRole) return;
    setSaving(true);
    try {
      await updateRole(selectedRole, draft[selectedRole] || []);
      setDirty(false);
      flash(`saved. ${selectedRole.toLowerCase()} access is now live across the app.`);
    } catch (err) {
      flash(err?.message || 'failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await reset();
      setDirty(false);
      flash('all roles reverted to defaults.');
    } catch (err) {
      flash(err?.message || 'failed to reset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={14} /> {toast}
        </div>
      )}

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-900">roles & permissions</h1>
          <p className="text-slate-500 text-sm mt-1">
            control access to marketing, student crm, agency crm, hr and admin across the platform.{' '}
            {canEdit ? 'changes apply live to all users.' : 'read-only view.'}
          </p>
        </div>
        {loading && <Loader2 size={18} className="text-indigo-500 animate-spin" />}
      </div>

      <div className="space-y-6">
        {canEdit ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-900">live enforcement enabled</p>
              <p className="text-[10px] text-emerald-800 mt-0.5 leading-relaxed">
                saving a role updates the database immediately. sidebars, page guards and api
                access for every user with that role reflect the change on their next load.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
            <Lock size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-indigo-900">read-only view</p>
              <p className="text-[10px] text-indigo-700 mt-0.5 leading-relaxed">
                editing requires the manage roles & admins permission (super admin by default).
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
          {/* Roles sidebar */}
          <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm shrink-0">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h4 className="text-[10px] font-semibold text-slate-500 mb-3">active roles ({roles.length})</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="search roles..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => {
                  const isActive = selectedRole === role;
                  const count = (draft[role] || []).length;
                  return (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`w-full p-5 text-left border-b border-slate-100 transition-all flex items-center justify-between group ${
                        isActive ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-semibold lowercase ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
                          {role.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        <p className="text-[9px] font-semibold text-slate-400 mt-1">
                          {count === 0 ? 'no permissions' : `${count} permission${count === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      <Shield
                        size={12}
                        className={`transition-transform ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">no roles match.</div>
              )}
            </div>
          </div>

          {/* Permission detail */}
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
            <header className="px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  <h3 className="text-lg font-semibold text-slate-900 lowercase">
                    {selectedRole.replace(/_/g, ' ').toLowerCase() || '—'}
                  </h3>
                </div>
                <p className="text-[10px] font-medium text-slate-500 mt-1">
                  {ROLE_DESCRIPTIONS[selectedRole] || 'custom role.'}
                </p>
              </div>

              {canEdit ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <RotateCcw size={12} />
                    reset all to defaults
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    save changes
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <Lock size={11} /> read-only
                </span>
              )}
            </header>

            <div className="flex-1 p-8 overflow-y-auto space-y-8">
              {activePerms.length === 0 && (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <p className="text-xs font-semibold text-slate-700">no permissions assigned to this role.</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {canEdit
                      ? 'tick any permission below to grant it.'
                      : 'users with this role cannot access any module.'}
                  </p>
                </div>
              )}

              {PERMISSION_CATEGORIES.map((category) => {
                const grantedHere = category.permissions.filter((p) => activePerms.includes(p.key));
                return (
                  <div key={category.key} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{category.title}</h4>
                      <span className="ml-auto text-[10px] font-semibold text-slate-400">
                        {grantedHere.length} of {category.permissions.length} granted
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.permissions.map((perm) => {
                        const granted = activePerms.includes(perm.key);
                        const Tag = canEdit ? 'button' : 'div';
                        return (
                          <Tag
                            key={perm.key}
                            type={canEdit ? 'button' : undefined}
                            onClick={canEdit ? () => togglePerm(perm.key) : undefined}
                            className={`text-left p-4 rounded-2xl border select-none transition-all flex items-start gap-3 w-full ${
                              granted
                                ? 'bg-indigo-50/40 border-indigo-200'
                                : 'bg-slate-50 border-slate-200 opacity-60'
                            } ${canEdit ? 'cursor-pointer hover:border-indigo-300 hover:opacity-100' : ''}`}
                          >
                            <div className="mt-0.5">
                              {granted ? (
                                <div className="w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center">
                                  <Check size={11} className="text-white stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 border border-slate-300 rounded-lg bg-white" />
                              )}
                            </div>
                            <div>
                              <p className={`text-xs font-semibold ${granted ? 'text-indigo-900' : 'text-slate-600'}`}>
                                {perm.name}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{perm.desc}</p>
                            </div>
                          </Tag>
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
