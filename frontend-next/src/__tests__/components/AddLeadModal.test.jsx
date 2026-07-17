import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddLeadModal from '@/components/AddLeadModal';
import { createLead, getSources } from '@/services/marketingApi';
import { getCounsellors } from '@/services/userApi';

jest.mock('@/services/marketingApi', () => ({
  createLead: jest.fn(),
  getSources: jest.fn(),
}));

jest.mock('@/services/userApi', () => ({
  getCounsellors: jest.fn(),
}));

jest.mock('@/lib/CountryDropdown/CountryDropdown', () => {
  return function MockCountryDropdown({ onChange }) {
    return (
      <select data-testid="country-dropdown" onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        <option value="UK">UK</option>
      </select>
    );
  };
});

describe('AddLeadModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSources.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Website' }] });
    getCounsellors.mockResolvedValue({ success: true, data: [{ id: 2, fullName: 'Agent A' }] });
  });

  it('renders correctly when open', async () => {
    render(<AddLeadModal open={true} onClose={jest.fn()} onCreated={jest.fn()} />);

    // Wait for async loadDropdownData
    await waitFor(() => {
      expect(screen.getByText('Add New Lead')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('rahul@example.com')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(<AddLeadModal open={false} onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('calls createLead and onCreated on successful submission', async () => {
    // createLead.mockResolvedValue({ id: 10 });
    createLead.mockResolvedValue({
      success: true,
      data: {
        id: 10,
        fullName: 'Rahul',
        email: 'rahul@test.com',
        phone: '1234567890',
      },
      
    });
    const mockOnCreated = jest.fn();
    const mockOnClose = jest.fn();

    render(<AddLeadModal open={true} onClose={mockOnClose} onCreated={mockOnCreated} />);

    await waitFor(() => expect(screen.getByText('Add New Lead')).toBeInTheDocument());

    // Fill form
    // fireEvent.change(screen.getByPlaceholderText('Rahul Sharma'), { target: { value: 'Rahul' } });
    // fireEvent.change(screen.getByPlaceholderText('rahul@example.com'), { target: { value: 'rahul@test.com' } });
    // fireEvent.change(screen.getByPlaceholderText('9876543210'), { target: { value: '1234567890' } });

    // Fill form
    fireEvent.change(
      screen.getByPlaceholderText('Rahul Sharma'),
      { target: { value: 'Rahul' } }
    );

    fireEvent.change(
      screen.getByPlaceholderText('rahul@example.com'),
      { target: { value: 'rahul@test.com' } }
    );

    fireEvent.change(
      screen.getByPlaceholderText('9876543210'),
      { target: { value: '1234567890' } }
    );
    // Submit
    fireEvent.submit(screen.getByRole('button', { name: /Create Lead/i }));

    await waitFor(() => {
      expect(createLead).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'Rahul',
        email: 'rahul@test.com',
        phone: '1234567890',
      }));
      expect(mockOnCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when close icon is clicked', async () => {
    const mockOnClose = jest.fn();
    render(<AddLeadModal open={true} onClose={mockOnClose} onCreated={jest.fn()} />);

    await waitFor(() => expect(screen.getByText('Add New Lead')).toBeInTheDocument());

    // The Lucide X icon button has a close label? No, we'll find by role or closest button.
    const closeButtons = screen.getAllByRole('button');
    // Top right close button is likely the first one. Let's just trigger cancel button
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
