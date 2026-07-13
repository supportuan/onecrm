'use client';

import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Check,
  RotateCcw,
  Save,
  Lock,
} from 'lucide-react';
import {
  PERMISSION_CATEGORIES,
  ROLE_DESCRIPTIONS,
  HIDDEN_ROLES,
} from '../../lib/auth/rbac';
import { useAuth } from '../../lib/auth/AuthContext';
import { usePermissions } from '../../lib/auth/PermissionsContext';
import { getUsers, updateUser } from '../../services/userApi';

const titleCaseRole = (role) =>
  (role || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function RolesPermissions() {
  const { user } = useAuth();
  const { permissionMap, can, updateRole, reset, loading } = usePermissions();

  const canView = can(['VIEW_ADMIN', 'MANAGE_SYSTEM', 'MANAGE_ADMINS']);
  const canEdit = can('MANAGE_ADMINS');

  const roles = useMemo(
    () => Object.keys(permissionMap || {}).filter((r) => !HIDDEN_ROLES.has(r)),
    [permissionMap]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [draft, setDraft] = useState({});
  const [dirtyRoles, setDirtyRoles] = useState(new Set());
  const [savingRole, setSavingRole] = useState('');
  const [toast, setToast] = useState('');
  const [expandedRole, setExpandedRole] = useState(null);
  const [openAssignRole, setOpenAssignRole] = useState(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [movingUser, setMovingUser] = useState(null);

  const assignRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(permissionMap || {})));
    setDirtyRoles(new Set());
  }, [permissionMap]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await getUsers();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.users) ? res.users : [];
      setUsers(list);
    } catch (_) {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (canView) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  useEffect(() => {
    const onDown = (e) => {
      if (assignRef.current && !assignRef.current.contains(e.target)) {
        setOpenAssignRole(null);
        setAssignSearch('');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  if (user && !canView) {
    return (
      <div className="ui-page text-neutral-800 font-sans flex items-center justify-center">
        <div className="ui-card w-auto text-center space-y-3">
          <ShieldAlert size={36} className="text-rose-500 mx-auto" />
          <h2 className="text-base font-semibold text-brand">Access denied</h2>
          <p className="text-sm text-neutral-500">
            This page is restricted to administrators. Signed in as{' '}
            <span className="font-medium">{user?.role || 'unknown'}</span>.
          </p>
        </div>
      </div>
    );
  }

  const filteredRoles = roles.filter((r) => {
    const q = searchQuery.toLowerCase();
    return r.toLowerCase().includes(q) || titleCaseRole(r).toLowerCase().includes(q);
  });

  const togglePerm = (role, permKey) => {
    if (!canEdit) return;
    setDraft((prev) => {
      const current = prev[role] || [];
      const next = current.includes(permKey)
        ? current.filter((p) => p !== permKey)
        : [...current, permKey];
      return { ...prev, [role]: next };
    });
    setDirtyRoles((prev) => new Set(prev).add(role));
  };

  const handleSaveRole = async (role) => {
    if (!canEdit || !role) return;
    setSavingRole(role);
    try {
      await updateRole(role, draft[role] || []);
      setDirtyRoles((prev) => {
        const next = new Set(prev);
        next.delete(role);
        return next;
      });
      flash(`${titleCaseRole(role)} permissions saved.`);
    } catch (err) {
      flash(err?.message || 'Failed to save permissions.');
    } finally {
      setSavingRole('');
    }
  };

  const handleResetAll = async () => {
    if (!canEdit) return;
    setSavingRole('__all__');
    try {
      await reset();
      setDirtyRoles(new Set());
      flash('All roles reverted to defaults.');
    } catch (err) {
      flash(err?.message || 'Failed to reset.');
    } finally {
      setSavingRole('');
    }
  };

  const handleAssignUser = async (role, userId) => {
    if (!canEdit) return;
    try {
      await updateUser(userId, { role });
      flash(`User assigned to ${titleCaseRole(role)}.`);
      setOpenAssignRole(null);
      setAssignSearch('');
      fetchUsers();
    } catch (err) {
      flash(err?.message || 'Failed to assign user.');
    }
  };

  const handleReassignUser = async (userId, newRole) => {
    if (!canEdit || !newRole) return;
    try {
      await updateUser(userId, { role: newRole });
      flash('User role updated.');
      setMovingUser(null);
      fetchUsers();
    } catch (err) {
      flash(err?.message || 'Failed to update role.');
    }
  };

  const usersForRole = (role) => users.filter((u) => u.role === role && u.isActive !== false);

  const assignCandidates = (role) => {
    const q = assignSearch.toLowerCase();
    return users
      .filter((u) => u.isActive !== false && u.role !== role)
      .filter((u) => {
        if (!q) return true;
        return (
          (u.fullName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        );
      });
  };

  return (
    <div className="ui-page text-neutral-800 font-sans">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand tracking-tight">Roles & Permissions</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Manage role responsibilities, member assignments, and access permissions.
            {!canEdit && ' Read-only view.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading && <Loader2 size={18} className="text-neutral-500 animate-spin" />}
          {canEdit && (
            <button
              type="button"
              onClick={handleResetAll}
              disabled={savingRole === '__all__'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-md hover:bg-neutral-50 transition disabled:opacity-50"
            >
              <RotateCcw size={14} />
              Reset all
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-md text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-700"
        />
      </div>

      {/* Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 tracking-wide w-[22%]">
                  Role Level
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 tracking-wide w-[28%]">
                  Responsibilities
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 tracking-wide w-[32%]">
                  Assigned Members
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 tracking-wide w-[18%]">
                  Assignment
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-500">
                    No roles match your search.
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const members = usersForRole(role);
                  const isExpanded = expandedRole === role;
                  const isDirty = dirtyRoles.has(role);
                  const activePerms = draft[role] || [];
                  const isAssignOpen = openAssignRole === role;

                  return (
                    <Fragment key={role}>
                      <tr className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                        {/* Role Level */}
                        <td className="px-6 py-5 align-top">
                          <button
                            type="button"
                            onClick={() => setExpandedRole(isExpanded ? null : role)}
                            className="flex items-start gap-2 text-left group"
                          >
                            <span className="mt-0.5 text-neutral-500 group-hover:text-neutral-600">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-brand">{titleCaseRole(role)}</p>
                              <p className="text-xs text-neutral-500 font-mono mt-0.5 tracking-wide">{role}</p>
                              {isDirty && (
                                <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  unsaved
                                </span>
                              )}
                            </div>
                          </button>
                        </td>

                        {/* Responsibilities */}
                        <td className="px-6 py-5 align-top">
                          <p className="text-sm text-neutral-600 leading-relaxed">
                            {ROLE_DESCRIPTIONS[role] || 'Custom role with configurable permissions.'}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1.5">
                            {activePerms.length} permission{activePerms.length !== 1 ? 's' : ''} granted
                          </p>
                        </td>

                        {/* Assigned Members */}
                        <td className="px-6 py-5 align-top">
                          {usersLoading ? (
                            <span className="text-sm text-neutral-500">Loading...</span>
                          ) : members.length === 0 ? (
                            <span className="text-sm text-neutral-500">None</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {members.map((u) => (
                                <span
                                  key={u.id}
                                  className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-slate-100 border border-neutral-200 rounded-md text-sm text-neutral-700"
                                >
                                  {movingUser?.userId === u.id ? (
                                    <select
                                      autoFocus
                                      defaultValue=""
                                      onChange={(e) => {
                                        if (e.target.value) handleReassignUser(u.id, e.target.value);
                                      }}
                                      onBlur={() => setMovingUser(null)}
                                      className="text-xs border border-neutral-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:border-neutral-700"
                                    >
                                      <option value="">Move to...</option>
                                      {roles
                                        .filter((r) => r !== role)
                                        .map((r) => (
                                          <option key={r} value={r}>
                                            {titleCaseRole(r)}
                                          </option>
                                        ))}
                                    </select>
                                  ) : (
                                    <>
                                      <span className="max-w-[140px] truncate">{u.fullName || u.email}</span>
                                      {canEdit && (
                                        <button
                                          type="button"
                                          onClick={() => setMovingUser({ userId: u.id, fromRole: role })}
                                          className="p-0.5 rounded hover:bg-slate-200 text-neutral-500 hover:text-neutral-700 transition"
                                          title="Reassign to another role"
                                          aria-label={`Reassign ${u.fullName}`}
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Assignment */}
                        <td className="px-6 py-5 align-top">
                          {canEdit ? (
                            <div className="relative" ref={isAssignOpen ? assignRef : null}>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenAssignRole(isAssignOpen ? null : role);
                                  setAssignSearch('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-md hover:bg-neutral-50 transition min-w-[110px] justify-between"
                              >
                                <span>+ Assign</span>
                                <ChevronDown size={14} className="text-neutral-500" />
                              </button>

                              {isAssignOpen && (
                                <div className="absolute left-0 top-full mt-1 z-30 w-72 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
                                  <div className="p-2 border-b border-neutral-100">
                                    <div className="relative">
                                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                      <input
                                        type="text"
                                        value={assignSearch}
                                        onChange={(e) => setAssignSearch(e.target.value)}
                                        placeholder="Search employees..."
                                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-700"
                                        autoFocus
                                      />
                                    </div>
                                  </div>
                                  <ul className="max-h-52 overflow-y-auto">
                                    {assignCandidates(role).length === 0 ? (
                                      <li className="px-3 py-4 text-xs text-neutral-500 text-center">
                                        No employees available
                                      </li>
                                    ) : (
                                      assignCandidates(role).map((u) => (
                                        <li key={u.id}>
                                          <button
                                            type="button"
                                            onClick={() => handleAssignUser(role, u.id)}
                                            className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 transition flex flex-col"
                                          >
                                            <span className="text-sm font-medium text-neutral-800 truncate">
                                              {u.fullName || '—'}
                                            </span>
                                            <span className="text-xs text-neutral-500 truncate">{u.email}</span>
                                          </button>
                                        </li>
                                      ))
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                              <Lock size={12} /> Read-only
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable permissions panel */}
                      {isExpanded && (
                        <tr className="bg-neutral-50/60 border-b border-neutral-200">
                          <td colSpan={4} className="px-6 py-5">
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-sm font-semibold text-brand">
                                  Permissions — {titleCaseRole(role)}
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  Toggle access rights for this role. Changes apply on save.
                                </p>
                              </div>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveRole(role)}
                                  disabled={!isDirty || savingRole === role}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-hover transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {savingRole === role ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Save size={14} />
                                  )}
                                  Save permissions
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {PERMISSION_CATEGORIES.map((category) => {
                                const grantedHere = category.permissions.filter((p) =>
                                  activePerms.includes(p.key)
                                );
                                return (
                                  <div
                                    key={category.key}
                                    className="bg-white border border-neutral-200 rounded-lg p-4"
                                  >
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                                      <h4 className="text-xs font-semibold text-neutral-500 tracking-wide">
                                        {category.title}
                                      </h4>
                                      <span className="text-xs text-neutral-500">
                                        {grantedHere.length}/{category.permissions.length}
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      {category.permissions.map((perm) => {
                                        const granted = activePerms.includes(perm.key);
                                        const Tag = canEdit ? 'button' : 'div';
                                        return (
                                          <Tag
                                            key={perm.key}
                                            type={canEdit ? 'button' : undefined}
                                            onClick={canEdit ? () => togglePerm(role, perm.key) : undefined}
                                            className={`w-full text-left flex items-start gap-2.5 p-2 rounded-md transition ${
                                              granted
                                                ? 'bg-neutral-100/70'
                                                : 'hover:bg-neutral-50 opacity-80'
                                            } ${canEdit ? 'cursor-pointer' : ''}`}
                                          >
                                            <div className="mt-0.5 shrink-0">
                                              {granted ? (
                                                <div className="w-4 h-4 bg-brand rounded flex items-center justify-center">
                                                  <Check size={10} className="text-white stroke-[3]" />
                                                </div>
                                              ) : (
                                                <div className="w-4 h-4 border border-slate-300 rounded bg-white" />
                                              )}
                                            </div>
                                            <div className="min-w-0">
                                              <p
                                                className={`text-xs font-medium ${
                                                  granted ? 'text-brand' : 'text-neutral-600'
                                                }`}
                                              >
                                                {perm.name}
                                              </p>
                                              <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                                                {perm.desc}
                                              </p>
                                            </div>
                                          </Tag>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
