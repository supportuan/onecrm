'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  AGENT_ONBOARDING_PATH,
  isAgencyPartnerRole,
  isAgentBlockedPath,
} from '@/features/agency-crm/agentPortal';

/**
 * Agency CRM layout: block agents from admin-only partner-ops screens.
 * Navigation lives in the main sidebar (Agent Hub) — no duplicate top tabs.
 */
export default function AgencyCrmLayout({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname() || '';
  const router = useRouter();
  const isAgent = isAgencyPartnerRole(user?.role);

  useEffect(() => {
    if (loading || !user || !isAgent) return;
    if (isAgentBlockedPath(pathname)) {
      router.replace(AGENT_ONBOARDING_PATH);
    }
  }, [loading, user, isAgent, pathname, router]);

  return <div className="agency-crm-shell">{children}</div>;
}
