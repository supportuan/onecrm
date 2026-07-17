import React from 'react';
import { render, screen } from '@testing-library/react';
import Users from '@/pages-old/admin-settings/Users';
import { getUsers, getCounsellors } from '@/services/userApi';
import { useAuth } from '@/lib/auth/AuthContext';

jest.mock('@/services/userApi', () => ({
  getUsers: jest.fn(),
  getCounsellors: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Users Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { role: 'SUPER_ADMIN' } });
    getUsers.mockResolvedValue({ 
      success: true, 
      data: [
        { id: 1, fullName: 'Admin User', email: 'admin@test.com', role: 'ADMIN', status: 'ACTIVE' }
      ]
    });
    getCounsellors.mockResolvedValue({ success: true, data: [] });
  });

  it('renders users table and fetches data', async () => {
    render(<Users />);
    

    
    // Data is fetched async, wait for it
    const adminUser = await screen.findByText('Admin User');
    expect(adminUser).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('renders add user button', async () => {
    render(<Users />);
    const addBtn = await screen.findByRole('button', { name: /Create User/i });
    expect(addBtn).toBeInTheDocument();
  });
});
