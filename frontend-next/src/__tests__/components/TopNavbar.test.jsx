import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TopNavbar from '@/components/TopNavbar';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/NotificationBell', () => {
  return function MockNotificationBell() {
    return <div data-testid="notification-bell" />;
  };
});

jest.mock('@/components/AddLeadModal', () => {
  return function MockAddLeadModal({ open, onClose }) {
    return open ? (
      <div data-testid="add-lead-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null;
  };
});

describe('TopNavbar Component', () => {
  const mockLogout = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: mockPush });
    useAuth.mockReturnValue({
      user: { fullName: 'Test User', email: 'test@example.com' },
      logout: mockLogout,
    });
  });

  it('renders default title when on home route', () => {
    usePathname.mockReturnValue('/');
    render(<TopNavbar onToggleSidebar={jest.fn()} />);
    
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    expect(screen.getByText("Here's what's happening today.")).toBeInTheDocument();
  });

  it('renders specific title for marketing lead-management route', () => {
    usePathname.mockReturnValue('/marketing/lead-management');
    render(<TopNavbar onToggleSidebar={jest.fn()} />);
    
    expect(screen.getByText('Lead Management')).toBeInTheDocument();
    expect(screen.getByText('Manage and track all your leads in one place')).toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', () => {
    usePathname.mockReturnValue('/');
    render(<TopNavbar onToggleSidebar={jest.fn()} />);
    
    const logoutBtn = screen.getByTitle('Log out');
    fireEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('opens and closes Add Lead modal', () => {
    usePathname.mockReturnValue('/');
    render(<TopNavbar onToggleSidebar={jest.fn()} />);
    
    // Modal is initially closed
    expect(screen.queryByTestId('add-lead-modal')).not.toBeInTheDocument();
    
    // Click Add Lead button
    const addLeadBtn = screen.getByTitle('Add new lead');
    fireEvent.click(addLeadBtn);
    
    // Modal should now be open
    expect(screen.getByTestId('add-lead-modal')).toBeInTheDocument();
    
    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.queryByTestId('add-lead-modal')).not.toBeInTheDocument();
  });
});
