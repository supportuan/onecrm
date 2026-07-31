'use client';

import { LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import NotificationBell from '@/components/NotificationBell';
import AddLeadModal from '@/components/AddLeadModal';
import StaffAvatarLink from '@/components/StaffAvatarLink';
import { useState } from 'react';

const TopNavbar = () => {
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const canAddLead =
    user?.role !== 'STUDENT' &&
    (can('MANAGE_MARKETING') || can('VIEW_MARKETING'));

  return (
    <header className="app-shell-topbar flex h-[var(--ui-shell-header-height)] items-center justify-end gap-2 border-b border-neutral-100/80 bg-white px-4 sm:px-6 lg:px-8">
      <NotificationBell />
      {canAddLead && (
        <button
          type="button"
          onClick={() => setIsAddLeadOpen(true)}
          className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[var(--ui-text-muted)] transition hover:bg-brand-soft hover:text-brand active:scale-95"
          title="Add lead"
          aria-label="Add lead"
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </button>
      )}

      <StaffAvatarLink size="lg" />

      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95"
        onClick={logout}
        title="Log out"
        aria-label="Log out"
      >
        <LogOut className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {canAddLead && (
        <AddLeadModal
          open={isAddLeadOpen}
          onClose={() => setIsAddLeadOpen(false)}
        />
      )}
    </header>
  );
};

export default TopNavbar;
