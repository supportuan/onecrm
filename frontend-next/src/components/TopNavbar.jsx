'use client';

import { LogOut, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getStaffPageMeta } from '@/lib/staff-page-meta';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import NotificationBell from '@/components/NotificationBell';
import AddLeadModal from '@/components/AddLeadModal';
import StaffAvatarLink from '@/components/StaffAvatarLink';
import { useState } from 'react';


const TopNavbar = ({ onToggleSidebar }) => {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { can } = usePermissions();
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

    const meta = getStaffPageMeta(pathname || '');
    const breadcrumb = meta.breadcrumb;
    const title = meta.title;
    const description = meta.description;
    const canAddLead =
      user?.role !== 'STUDENT' &&
      (can('MANAGE_MARKETING') || can('VIEW_MARKETING'));

    return (
        <header className="flex h-20 items-center justify-between gap-4 bg-white px-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-6">
                <div className="flex min-w-0 flex-col justify-center gap-0.5">
                    {breadcrumb ? (
                      <p className="text-[11px] font-semibold text-slate-400 leading-none">{breadcrumb}</p>
                    ) : null}
                    <h1
                        className="app-title-gradient truncate text-2xl font-semibold leading-tight"
                        style={{ fontSize: 'var(--type-page-title)' }}
                    >
                        {title}
                    </h1>
                    {description && (
                        <p
                            className="max-w-xl text-xs font-medium leading-snug text-slate-500 line-clamp-2"
                            style={{ fontSize: '12px' }}
                        >
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-2">
                <NotificationBell />
                {canAddLead && (
                    <button
                        type="button"
                        onClick={() => setIsAddLeadOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--ui-text-muted)] transition hover:bg-brand-soft hover:text-brand active:scale-95"
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
            </div>
            {canAddLead && (
                <AddLeadModal
                    open={isAddLeadOpen}
                    onClose={() =>
                        setIsAddLeadOpen(false)
                    }
                />
            )}
        </header>
    );
};

export default TopNavbar;
