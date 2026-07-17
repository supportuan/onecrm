import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudentPaymentPanel from '@/features/student-portal/components/StudentPaymentPanel';
import { createPaymentOrder, verifyPayment } from '@/services/studentCrmApi';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuth } from '@/lib/auth/AuthContext';

jest.mock('@/services/studentCrmApi', () => ({
  createPaymentOrder: jest.fn(),
  verifyPayment: jest.fn(),
}));

jest.mock('@/lib/razorpay', () => ({
  openRazorpayCheckout: jest.fn(),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('StudentPaymentPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { fullName: 'Test Student', email: 'student@test.com' } });
  });

  it('renders "No fees" message when fees array is empty', () => {
    render(<StudentPaymentPanel app={{ fees: [] }} readiness={{ canPay: true }} onPaid={jest.fn()} />);
    expect(screen.getByText('No fees have been assigned to this application yet.')).toBeInTheDocument();
  });

  it('renders fees and shows lock message if readiness.canPay is false', () => {
    const app = { fees: [{ id: 1, label: 'Application Fee', amountPaise: 50000 }] };
    const readiness = { canPay: false, missingDocuments: ['Passport'] };
    
    render(<StudentPaymentPanel app={app} readiness={readiness} onPaid={jest.fn()} />);
    
    expect(screen.getByText('Upload all required documents before payment unlocks.')).toBeInTheDocument();
    
    const payBtn = screen.getByRole('button', { name: /Pay now/i });
    expect(payBtn).toBeDisabled();
  });

  it('shows paid status if fee is in payments array', () => {
    const app = { 
      fees: [{ id: 1, label: 'Application Fee', amountPaise: 50000 }],
      payments: [{ id: 101, feeId: 1, status: 'PAID' }]
    };
    
    render(<StudentPaymentPanel app={app} readiness={{ canPay: true }} onPaid={jest.fn()} />);
    
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pay now/i })).not.toBeInTheDocument();
  });

  it('initiates payment process on clicking Pay Now', async () => {
    const app = { id: 'app123', fees: [{ id: 1, label: 'Application Fee', amountPaise: 50000 }] };
    createPaymentOrder.mockResolvedValue({ 
      data: { keyId: 'rzp_test_123', orderId: 'order_123', amount: 50000, currency: 'INR' } 
    });
    
    openRazorpayCheckout.mockImplementation(async (options) => {
      // Simulate successful payment callback
      await options.onSuccess({ 
        razorpay_order_id: 'order_123', 
        razorpay_payment_id: 'pay_123', 
        razorpay_signature: 'sig_123' 
      });
    });

    const mockOnPaid = jest.fn();
    
    render(<StudentPaymentPanel app={app} readiness={{ canPay: true }} onPaid={mockOnPaid} />);
    
    const payBtn = screen.getByRole('button', { name: /Pay now/i });
    fireEvent.click(payBtn);
    
    await waitFor(() => {
      expect(createPaymentOrder).toHaveBeenCalledWith('app123', 1);
      expect(openRazorpayCheckout).toHaveBeenCalled();
      expect(verifyPayment).toHaveBeenCalledWith('app123', {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });
      expect(mockOnPaid).toHaveBeenCalled();
    });
  });
});
