import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    { label: 'Marketing', path: '/marketing', icon: () => <svg data-testid="icon" />, subItems: [] },
    { label: 'Student CRM', path: '/student-crm', icon: () => <svg data-testid="icon" />, subItems: [] },
  ],
}));

describe('Sidebar Component', () => {
  const mockLogout = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: mockPush });
    usePathname.mockReturnValue('/');
    useAuth.mockReturnValue({
      user: { role: 'ADMIN', enabledModules: ['MARKETING', 'STUDENT_CRM'], moduleAccess: {} },
      logout: mockLogout,
    });
    useWorkspace.mockReturnValue({ logout: jest.fn() });
    usePermissions.mockReturnValue({ can: jest.fn().mockReturnValue(true), permissionMap: {} });
  });

  it('renders sidebar correctly when open', () => {
    render(<Sidebar sidebarOpen={true} onClose={jest.fn()} onToggleSidebar={jest.fn()} />);
    
    // Brand name shows when open
    expect(screen.getByText('ONECRM')).toBeInTheDocument();
    
    // User info shows when open
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('hides specific elements when sidebar is closed', () => {
    render(<Sidebar sidebarOpen={false} onClose={jest.fn()} onToggleSidebar={jest.fn()} />);
    
    // Brand name is hidden when closed
    expect(screen.queryByText('ONECRM')).not.toBeInTheDocument();
    
    // User info is hidden when closed
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
  });



  it('calls auth logout function when logout button is clicked', () => {
    render(<Sidebar sidebarOpen={true} onClose={jest.fn()} onToggleSidebar={jest.fn()} />);
    
    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
