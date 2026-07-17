import React from 'react';
import { render, screen } from '@testing-library/react';
import StudentApplicationDetail from '@/features/student-portal/pages/StudentApplicationDetail';
import { getApplication, getApplicationReadiness, getProcessStages } from '@/services/studentCrmApi';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

jest.mock('@/services/studentCrmApi', () => ({
  getApplication: jest.fn(),
  getApplicationReadiness: jest.fn(),
  getProcessStages: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock sub-components that might cause issues in simple rendering
jest.mock('@/features/student-portal/components/StudentPaymentPanel', () => () => <div data-testid="payment-panel" />);
jest.mock('@/components/NotificationBell', () => () => null);

describe('StudentApplicationDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: 'app123' });
    useAuth.mockReturnValue({ user: { id: 1 } });
    getApplication.mockResolvedValue({
      success: true,
      data: {
        id: 'app123',
        status: 'SUBMITTED',
        programme: 'BSc Computer Science',
        university: 'Tech University, USA',
        documents: [],
        fees: [],
        payments: []
      }
    });
    getApplicationReadiness.mockResolvedValue({ success: true, data: { canPay: true, missingDocuments: [] } });
    getProcessStages.mockResolvedValue({ success: true, data: { visaWorkflow: [] } });
  });

  it('renders application details correctly', async () => {
    render(<StudentApplicationDetail applicationId="app123" />);
    
    // Wait for the data to load
    const title = await screen.findByText('Tech University, USA');
    expect(title).toBeInTheDocument();
  });

  it('shows error state if fetch fails', async () => {
    getApplication.mockRejectedValue(new Error('Network error'));
    
    render(<StudentApplicationDetail applicationId="app123" />);
    
    // The component flashes a toast on error, so we can check for that toast text.
    // If the toast text is rendered in the DOM, this will pass.
    // If not, we should just check that 'Application not found.' is shown.
    const notFound = await screen.findByText('Application not found.');
    expect(notFound).toBeInTheDocument();
  });
});
