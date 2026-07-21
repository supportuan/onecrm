import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth/AuthContext';
import { useWorkspace } from '@/lib/workspaceContext';
import { usePermissions } from '@/lib/auth/PermissionsContext';
import { useRouter, usePathname } from 'next/navigation';
import { navMenu } from '@/lib/menu';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/workspaceContext', () => ({
  useWorkspace: jest.fn(),
}));

jest.mock('@/lib/auth/PermissionsContext', () => ({
  usePermissions: jest.fn(),
}));

// Provide some mocked menu items in case the actual file requires complex mocking
jest.mock('@/lib/menu', () => ({
  navMenu: [
    {
      label: 'Marketing',
      path: '/marketing',
      icon: () => <svg data-testid="icon" />,
      subItems: [
        {
          label: 'Dashboard',
          path: '/marketing',
          icon: () => <svg data-testid="icon" />,
        },
        {
          label: 'Revenue Intelligence',
          path: '/marketing/marketing-analytics',
          icon: () => <svg data-testid="icon" />,
        },
      ],
    },
    { label: 'Student Hub', path: '/student-crm', icon: () => <svg data-testid="icon" />, subItems: [] },
  ],
}));

describe('Sidebar Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: mockPush });
    usePathname.mockReturnValue('/');
    useAuth.mockReturnValue({
      user: { role: 'ADMIN', enabledModules: ['MARKETING', 'STUDENT_CRM'], moduleAccess: {} },
      logout: jest.fn(),
    });
    useWorkspace.mockReturnValue({ logout: jest.fn() });
    usePermissions.mockReturnValue({ can: jest.fn().mockReturnValue(true), permissionMap: {} });
  });

  it('renders sidebar correctly when open', () => {
    render(<Sidebar sidebarOpen={true} onClose={jest.fn()} onToggleSidebar={jest.fn()} />);
    
    // Brand name shows when open
    expect(screen.getByText('ONECRM')).toBeInTheDocument();

    // Profile details live in the top navigation, not the sidebar footer.
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
  });

  it('hides specific elements when sidebar is closed', () => {
    render(<Sidebar sidebarOpen={false} onClose={jest.fn()} onToggleSidebar={jest.fn()} />);
    
    // Brand name is hidden when closed
    expect(screen.queryByText('ONECRM')).not.toBeInTheDocument();
    
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
  });



  it('renders the ApplyUniNow slogan when open', () => {
    render(<Sidebar sidebarOpen={true} onClose={jest.fn()} onToggleSidebar={jest.fn()} />);

    expect(screen.getByText('Intelligence Connecting Seamlessly')).toBeInTheDocument();
  });

  it('shows renamed marketing pages for legacy module-access keys', () => {
    usePathname.mockReturnValue('/marketing/marketing-analytics');
    useAuth.mockReturnValue({
      user: {
        role: 'COUNSELLOR',
        enabledModules: ['MARKETING'],
        moduleAccess: {
          Marketing: {
            'Marketing Analytics': ['VIEW'],
          },
        },
      },
      logout: jest.fn(),
    });
    usePermissions.mockReturnValue({ can: jest.fn().mockReturnValue(false), permissionMap: {} });

    render(<Sidebar sidebarOpen={true} onClose={jest.fn()} onToggleSidebar={jest.fn()} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Revenue Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Dashboard').closest('a')).not.toHaveClass('bg-brand-soft');
    expect(screen.getByText('Revenue Intelligence').closest('a')).toHaveClass('bg-brand-soft');
  });
});
