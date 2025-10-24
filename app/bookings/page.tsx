"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { bookingApi, userApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useRole } from '@/hooks/useRole';

interface Mentee {
  userId: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  primaryDomain: string;
  skills: string[];
  seniority: string;
  experience: number;
}

interface Booking {
  _id: string;
  bookingId: string;
  mentorId: string;
  menteeId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  message?: string;
  mentee: Mentee;
}

interface Mentor {
  userId: string;
  name: string;
  primaryDomain: string;
  hourlyRate?: number;
}

export default function Bookings() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingForm, setBookingForm] = useState({
    mentorId: '',
    startTime: '',
    endTime: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { isMentor, isMentee, canPerformAction } = useRole();

  useEffect(() => {
    if (token) {
      fetchBookings();
      fetchMentors();
    }
  }, [token]);

  const fetchBookings = async () => {
    try {
      if (isMentor) {
        // For mentors, fetch their bookings using the mentor endpoint
        const response = await bookingApi.get(`/bookings/mentor/${user?.userId}`);
        setBookings(response.data);
      } else {
        // For mentees, fetch their bookings
        const response = await bookingApi.get('/bookings/me');
        setBookings(response.data);
      }
    } catch (error: any) {
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      // Only fetch mentors for mentees (not for mentors)
      if (!isMentor) {
        const response = await userApi.get('/mentors');
        setMentors(response.data);
      }
    } catch (error: any) {
      showToast('Failed to load mentors', 'error');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingForm.mentorId || !bookingForm.startTime || !bookingForm.endTime) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await bookingApi.post('/bookings', {
        mentorId: bookingForm.mentorId,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        message: bookingForm.message
      });
      
      showToast('Booking request sent successfully!', 'success');
      setShowBookingModal(false);
      setBookingForm({ mentorId: '', startTime: '', endTime: '', message: '' });
      fetchBookings();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create booking', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline') => {
    try {
      await bookingApi.put(`/bookings/${bookingId}/${action}`);
      showToast(`Booking ${action}ed successfully!`, 'success');
      fetchBookings();
    } catch (error: any) {
      showToast(`Failed to ${action} booking`, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
              {isMentor ? 'My Bookings' : 'My Bookings'}
            </h1>
            <p className="text-gray-600">
              {isMentor 
                ? 'Manage your mentoring sessions and view booking requests from mentees.'
                : 'Manage your mentoring sessions and book new ones.'
              }
            </p>
          </div>
          {!isMentor && canPerformAction('create_booking') && (
            <Button onClick={() => setShowBookingModal(true)}>
              Book New Session
            </Button>
          )}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.bookingId}>
            <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {isMentor ? (booking.mentee?.name || 'Mentee') : 'Mentor'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Start:</span> {formatDateTime(booking.startTime)}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {formatDateTime(booking.endTime)}
                      </div>
                      {booking.message && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Message:</span> {booking.message}
                        </div>
                      )}
                      {isMentor && booking.mentee && (
                        <div className="md:col-span-2 space-y-1">
                          <div>
                            <span className="font-medium">Mentee:</span> {booking.mentee.name}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {booking.mentee.email}
                          </div>
                          <div>
                            <span className="font-medium">Domain:</span> {booking.mentee.primaryDomain}
                          </div>
                          <div>
                            <span className="font-medium">Experience:</span> {booking.mentee.experience} years ({booking.mentee.seniority})
                          </div>
                          {booking.mentee.skills && booking.mentee.skills.length > 0 && (
                            <div>
                              <span className="font-medium">Skills:</span> {booking.mentee.skills.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
              
              {canPerformAction('accept_booking') && booking.status === 'pending' && (
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBookingAction(booking.bookingId, 'decline')}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBookingAction(booking.bookingId, 'accept')}
                  >
                    Accept
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

          {bookings.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-4">
                  {isMentor 
                    ? 'You don\'t have any booking requests from mentees yet.'
                    : 'You haven\'t made any bookings yet.'
                  }
                </p>
                {!isMentor && (
                  <Button onClick={() => setShowBookingModal(true)}>
                    Book Your First Session
                  </Button>
                )}
              </div>
            </Card>
          )}

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book a Session"
        size="lg"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Mentor
            </label>
            <select
              value={bookingForm.mentorId}
              onChange={(e) => {
                setBookingForm(prev => ({ ...prev, mentorId: e.target.value }));
                const mentor = mentors.find(m => m.userId === e.target.value);
                setSelectedMentor(mentor || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a mentor...</option>
              {mentors.map(mentor => (
                <option key={mentor.userId} value={mentor.userId}>
                  {mentor.name} - {mentor.primaryDomain}
                  {mentor.hourlyRate && ` ($${mentor.hourlyRate}/hr)`}
                </option>
              ))}
            </select>
          </div>

          {selectedMentor && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">{selectedMentor.name}</h4>
              <p className="text-sm text-blue-700">{selectedMentor.primaryDomain}</p>
              {selectedMentor.hourlyRate && (
                <p className="text-sm text-blue-700">Rate: ${selectedMentor.hourlyRate}/hour</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={bookingForm.startTime}
              onChange={(e) => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={bookingForm.endTime}
              onChange={(e) => setBookingForm(prev => ({ ...prev, endTime: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              value={bookingForm.message}
              onChange={(e) => setBookingForm(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What would you like to learn or discuss?"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBookingModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
            >
              Send Booking Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
