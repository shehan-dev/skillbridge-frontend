"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { paymentApi, bookingApi, userApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useRole } from '@/hooks/useRole';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  bookingId: string;
  createdAt: string;
  updatedAt: string;
  stripePaymentIntentId?: string;
}

interface Booking {
  bookingId: string;
  mentorId: string;
  menteeId: string;
  startTime: string;
  endTime: string;
  status: string;
  mentorName?: string;
  amount?: number;
}

export default function Payments() {
  const { user, token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [earningsSummary, setEarningsSummary] = useState<any>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    bookingId: '',
    amount: '',
    currency: 'usd'
  });
  const [processing, setProcessing] = useState(false);
  const { showToast } = useToast();
  const { isMentor, isMentee, canPerformAction } = useRole();

  useEffect(() => {
    if (token) {
      fetchPayments();
      fetchBookings();
    }
  }, [token]);

  const fetchPayments = async () => {
    try {
      if (isMentor) {
        // For mentors, fetch their earnings from User service
        const response = await userApi.get('/earnings/me');
        console.log('Mentor earnings response:', response.data);
        // The response contains a payments array inside the data object
        setPayments(response.data.payments || []);
        // Store the earnings summary for mentors
        setEarningsSummary(response.data);
      } else {
        // For mentees, fetch their payments from Payment service
        const response = await paymentApi.get('/payments');
        console.log('Mentee payments response:', response.data);
        setPayments(response.data);
      }
    } catch (error: any) {
      console.error('Payments fetch error:', error);
      showToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      if (isMentor) {
        // For mentors, fetch their bookings (requests from mentees)
        const response = await bookingApi.get('/bookings/mentor/me');
        setBookings(response.data);
      } else {
        // For mentees, fetch their bookings (requests to mentors)
        const response = await bookingApi.get('/bookings/me');
        setBookings(response.data);
      }
    } catch (error: any) {
      showToast('Failed to load bookings', 'error');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkoutForm.bookingId || !checkoutForm.amount) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await paymentApi.post('/checkout', {
        bookingId: checkoutForm.bookingId,
        amount: parseInt(checkoutForm.amount) * 100, // Convert to cents
        currency: checkoutForm.currency
      });
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create checkout session', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isMentor ? 'Earnings' : 'Payments'}
            </h1>
            <p className="text-gray-600">
              {isMentor 
                ? 'View your earnings and payment history from mentoring sessions.'
                : 'Manage your payments and billing history.'
              }
            </p>
          </div>
          {!isMentor && canPerformAction('make_payment') && (
            <Button onClick={() => setShowCheckoutModal(true)}>
              Create Payment
            </Button>
          )}
        </div>
      </div>

      {/* Earnings Summary for Mentors */}
      {isMentor && earningsSummary && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Earnings Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">${earningsSummary.totalEarnings || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Pending Earnings</p>
                <p className="text-2xl font-bold text-yellow-600">${earningsSummary.pendingEarnings || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Completed Payments</p>
                <p className="text-2xl font-bold text-blue-600">{earningsSummary.totalCompletedPayments || 0}</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-600">{earningsSummary.totalPendingPayments || 0}</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="space-y-4">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment #{payment.id.slice(-8)}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Amount:</span> {formatCurrency(payment.amount, payment.currency)}
                  </div>
                  <div>
                    <span className="font-medium">Booking ID:</span> {payment.bookingId}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {formatDateTime(payment.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {payments.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isMentor ? 'No earnings found' : 'No payments found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isMentor 
                ? 'You haven\'t earned any money from mentoring sessions yet.'
                : 'You haven\'t made any payments yet.'
              }
            </p>
            {!isMentor && (
              <Button onClick={() => setShowCheckoutModal(true)}>
                Create Your First Payment
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Checkout Modal */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Create Payment"
        size="lg"
      >
        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Booking
            </label>
            <select
              value={checkoutForm.bookingId}
              onChange={(e) => {
                setCheckoutForm(prev => ({ ...prev, bookingId: e.target.value }));
                const booking = bookings.find(b => b.bookingId === e.target.value);
                setSelectedBooking(booking || null);
                if (booking?.amount) {
                  setCheckoutForm(prev => ({ ...prev, amount: (booking.amount! / 100).toString() }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a booking...</option>
              {bookings
                .filter(booking => booking.status === 'confirmed')
                .map(booking => (
                <option key={booking.bookingId} value={booking.bookingId}>
                  {booking.mentorName} - {formatDateTime(booking.startTime)}
                  {booking.amount && ` (${formatCurrency(booking.amount, 'usd')})`}
                </option>
              ))}
            </select>
          </div>

          {selectedBooking && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Booking Details</h4>
              <p className="text-sm text-blue-700">
                Mentor: {selectedBooking.mentorName}
              </p>
              <p className="text-sm text-blue-700">
                Time: {formatDateTime(selectedBooking.startTime)} - {formatDateTime(selectedBooking.endTime)}
              </p>
              {selectedBooking.amount && (
                <p className="text-sm text-blue-700">
                  Amount: {formatCurrency(selectedBooking.amount, 'usd')}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              min="0"
              value={checkoutForm.amount}
              onChange={(e) => setCheckoutForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={checkoutForm.currency}
                onChange={(e) => setCheckoutForm(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </select>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Secure Payment Processing
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Your payment will be processed securely through Stripe. You'll be redirected to complete the payment.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCheckoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={processing}
              disabled={processing}
            >
              Proceed to Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
