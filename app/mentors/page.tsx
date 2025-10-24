"use client";
import { useEffect, useState } from 'react';
import { userApi, bookingApi, paymentApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/context/AuthContext';

interface Mentor {
  userId: string;
  name: string;
  email: string;
  bio?: string;
  primaryDomain?: string;
  badges?: string[];
  experience?: string;
  location?: string;
  rating?: number;
  totalReviews?: number;
  hourlyRate?: number;
  availability?: string[];
  // For mentees
  skills?: string[];
  isActive?: boolean;
  createdAt?: string;
  lastSession?: string;
  totalSessions?: number;
}

export default function Mentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentorAvailability, setMentorAvailability] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    slotStart: '',
    slotEnd: '',
    amount: 0
  });
  const [filters, setFilters] = useState({
    domain: 'all',
    search: '',
    seniority: 'all',
    badges: [] as string[],
    minRating: 0,
    maxRate: 1000,
    availableNow: false
  });
  const { showToast } = useToast();
  const { isMentor, isMentee } = useRole();
  const { user } = useAuth();

  useEffect(() => {
    fetchMentors();
  }, [filters]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      if (isMentor) {
        // For mentors, fetch their associated mentees using the mentor's ID
        const response = await userApi.get(`/mentors/${user?.userId}/mentees`);
        setMentors(response.data);
      } else {
        // For mentees, fetch available mentors
        const params = new URLSearchParams();
        if (filters.domain !== 'all') params.append('domain', filters.domain);
        if (filters.search) params.append('search', filters.search);
        if (filters.seniority !== 'all') params.append('seniority', filters.seniority);
        if (filters.badges.length > 0) params.append('badges', filters.badges.join(','));
        if (filters.minRating > 0) params.append('minRating', filters.minRating.toString());
        if (filters.maxRate < 1000) params.append('maxRate', filters.maxRate.toString());
        if (filters.availableNow) params.append('availableNow', 'true');

        const response = await userApi.get(`/mentors/advanced?${params.toString()}`);
        setMentors(response.data);
      }
    } catch (error: any) {
      showToast(isMentor ? 'Failed to load mentees' : 'Failed to load mentors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | number | boolean | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBookSession = async (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowBookingModal(true);
    setLoadingAvailability(true);
    setMentorAvailability([]);
    setSelectedSlot(null);
    
    // Fetch mentor availability
    try {
      console.log('Fetching availability for mentor:', mentor.userId);
      console.log('API URL:', userApi.defaults.baseURL + `/mentors/${mentor.userId}/availability`);
      
      const response = await userApi.get(`/mentors/${mentor.userId}/availability`);
      console.log('Mentor availability response:', response);
      console.log('Mentor availability data:', response.data);
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        setMentorAvailability(response.data);
      } else if (response.data && response.data.availability) {
        setMentorAvailability(response.data.availability);
      } else if (response.data && response.data.slots) {
        setMentorAvailability(response.data.slots);
      } else if (response.data === '' || !response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        console.log('No availability data found for mentor');
        setMentorAvailability([]);
        showToast('This mentor has not set up any available time slots yet.', 'warning');
        
        // For development, add mock data even when API returns empty
        if (process.env.NODE_ENV === 'development') {
          console.log('Adding mock availability data for testing...');
          const mockAvailability = [
            {
              slotStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              slotEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
              rate: 50
            },
            {
              slotStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
              slotEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Day after tomorrow + 1 hour
              rate: 50
            }
          ];
          setMentorAvailability(mockAvailability);
          showToast('Using mock data for testing. Mentor has no availability set.', 'warning');
        }
      } else {
        console.log('Unexpected response structure:', response.data);
        setMentorAvailability([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch availability:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Set empty availability and show error
      setMentorAvailability([]);
      showToast(`Failed to load mentor availability: ${error.response?.data?.error || error.message}`, 'error');
      
      // For development/testing, add some mock data if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Adding mock availability data for testing...');
        const mockAvailability = [
          {
            slotStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            slotEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
            rate: 50
          },
          {
            slotStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
            slotEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Day after tomorrow + 1 hour
            rate: 50
          }
        ];
        setMentorAvailability(mockAvailability);
        showToast('Using mock data for testing. Check console for API errors.', 'warning');
      }
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleSlotSelection = (slot: any) => {
    setSelectedSlot(slot);
    setBookingForm({
      slotStart: slot.slotStart,
      slotEnd: slot.slotEnd,
      amount: slot.rate || 50 // Default rate or from slot
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      showToast('Please select an available time slot', 'error');
      return;
    }

    if (!selectedMentor) {
      showToast('No mentor selected', 'error');
      return;
    }

    try {
      // Create booking
      const response = await bookingApi.post('/bookings', {
        mentorId: selectedMentor.userId,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd
      });

      console.log('Booking created:', response.data);
      showToast('Session booked successfully!', 'success');
      setShowBookingModal(false);
      setSelectedMentor(null);
      setSelectedSlot(null);
      setBookingForm({ slotStart: '', slotEnd: '', amount: 0 });
    } catch (error: any) {
      console.error('Booking error:', error);
      showToast(error.response?.data?.error || 'Failed to book session', 'error');
    }
  };

  const getAvailabilityStatus = (mentor: Mentor) => {
    if (!mentor.availability || mentor.availability.length === 0) {
      return { status: 'unavailable', text: 'Not Available', color: 'text-red-600' };
    }
    return { status: 'available', text: 'Available', color: 'text-green-600' };
  };

  const domains = [
    { value: 'all', label: 'All Domains' },
    { value: 'backend', label: 'Backend Development' },
    { value: 'frontend', label: 'Frontend Development' },
    { value: 'devops', label: 'DevOps' },
    { value: 'data', label: 'Data Science' },
    { value: 'mobile', label: 'Mobile Development' },
    { value: 'ai', label: 'AI/ML' },
    { value: 'security', label: 'Cybersecurity' }
  ];

  const seniorityLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'junior', label: 'Junior Engineer' },
    { value: 'mid', label: 'Mid-Level Engineer' },
    { value: 'senior', label: 'Senior Engineer' },
    { value: 'staff', label: 'Staff Engineer' },
    { value: 'principal', label: 'Principal Engineer' },
    { value: 'architect', label: 'Software Architect' }
  ];

  const availableBadges = [
    'Interview Coach',
    'System Design Specialist',
    'Code Review Expert',
    'Career Advisor',
    'Technical Lead',
    'Open Source Contributor',
    'Conference Speaker',
    'Tech Blogger'
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isMentor ? 'My Mentees' : 'Find Your Perfect Mentor'}
        </h1>
        <p className="text-gray-600">
          {isMentor 
            ? 'View and manage your mentees and their progress.'
            : 'Connect with experienced professionals who can guide your learning journey.'
          }
        </p>
      </div>

      {/* Advanced Filters - Only show for mentees */}
      {!isMentor && (
        <Card className="mb-8">
          <div className="space-y-6">
            {/* Basic Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain
                </label>
                <select
                  value={filters.domain}
                  onChange={(e) => handleFilterChange('domain', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                >
                  {domains.map(domain => (
                    <option key={domain.value} value={domain.value}>
                      {domain.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seniority Level
                </label>
                <select
                  value={filters.seniority}
                  onChange={(e) => handleFilterChange('seniority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  style={{ color: '#111827' }}
                >
                  {seniorityLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
      </select>
              </div>
              
              <div>
                <Input
                  label="Search"
                  placeholder="Search by name or skills..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.availableNow}
                    onChange={(e) => handleFilterChange('availableNow', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Available Now</span>
                </label>
              </div>
            </div>

            {/* Rating and Rate Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Min Rating"
                  type="number"
                  placeholder="0"
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Input
                  label="Max Rate ($/hr)"
                  type="number"
                  placeholder="1000"
                  value={filters.maxRate}
                  onChange={(e) => handleFilterChange('maxRate', parseInt(e.target.value) || 1000)}
                />
              </div>
            </div>

            {/* Badges Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specializations & Badges
              </label>
              <div className="flex flex-wrap gap-2">
                {availableBadges.map(badge => (
                  <label key={badge} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.badges.includes(badge)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange('badges', [...filters.badges, badge]);
                        } else {
                          handleFilterChange('badges', filters.badges.filter(b => b !== badge));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{badge}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((person) => {
          if (isMentor) {
            // Show mentees for mentors
            return (
              <Card key={person.userId} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                    <p className="text-sm text-gray-600">{person.email}</p>
                  </div>
                  <span className={`text-sm font-medium ${
                    person.isActive ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {person.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {person.bio && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {person.bio}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {person.skills && person.skills.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Skills:</span> {person.skills.join(', ')}
                    </div>
                  )}

                  {person.totalSessions && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Sessions:</span> {person.totalSessions}
                    </div>
                  )}

                  {person.lastSession && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Last Session:</span> {new Date(person.lastSession).toLocaleDateString()}
                    </div>
                  )}

                  {person.createdAt && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Joined:</span> {new Date(person.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Navigate to mentee profile
                      window.location.href = `/profile/${person.userId}`;
                    }}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Navigate to messages
                      window.location.href = `/messages?userId=${person.userId}`;
                    }}
                  >
                    Message
                  </Button>
                </div>
              </Card>
            );
          } else {
            // Show mentors for mentees
            const availability = getAvailabilityStatus(person);

            return (
              <Card key={person.userId} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                    <p className="text-sm text-gray-600">{person.primaryDomain}</p>
                  </div>
                  <span className={`text-sm font-medium ${availability.color}`}>
                    {availability.text}
                  </span>
                </div>

                {person.bio && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {person.bio}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {person.rating && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Rating:</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(person.rating!) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-gray-600">
                          {person.rating} ({person.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  )}

                  {person.hourlyRate && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Rate:</span> ${person.hourlyRate}/hour
                    </div>
                  )}

                  {person.experience && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Experience:</span> {person.experience}
                    </div>
                  )}

                  {person.location && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Location:</span> {person.location}
                    </div>
                  )}
        </div>

                {person.badges && person.badges.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {person.badges.slice(0, 3).map((badge, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {badge}
                        </span>
                      ))}
                      {person.badges.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{person.badges.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Book session directly
                      handleBookSession(person);
                    }}
                  >
                    Book Session
                  </Button>
                </div>
              </Card>
            );
          }
        })}
      </div>
      
      {mentors.length === 0 && !loading && (
        <Card>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isMentor ? 'No mentees found' : 'No mentors found'}
            </h3>
            <p className="text-gray-600">
              {isMentor 
                ? 'You don\'t have any mentees yet. Start by accepting booking requests or promoting your profile.'
                : 'Try adjusting your search criteria.'
              }
            </p>
          </div>
        </Card>
      )}

      {/* Booking Modal - Simplified */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Book Session with {selectedMentor?.name || 'Mentor'}
              </h2>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedMentor(null);
                  setSelectedSlot(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Debug Info */}
              <div className="bg-yellow-100 p-4 rounded mb-6">
                <h3 className="font-bold text-yellow-800 mb-2">Debug Information</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>Modal Open: {showBookingModal ? 'Yes' : 'No'}</p>
                  <p>Mentor: {selectedMentor?.name || 'None'}</p>
                  <p>Mentor ID: {selectedMentor?.userId || 'None'}</p>
                  <p>Loading: {loadingAvailability ? 'Yes' : 'No'}</p>
                  <p>Availability Count: {mentorAvailability.length}</p>
                  <p>Selected Slot: {selectedSlot ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Available Time Slots */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h3>
                {loadingAvailability ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 mt-2">Loading availability...</p>
                  </div>
                ) : mentorAvailability.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No available time slots found.</p>
                    <p className="text-sm text-gray-400 mt-2">This mentor may not have set up availability yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mentorAvailability.map((slot, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedSlot?.slotStart === slot.slotStart
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSlotSelection(slot)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(slot.slotStart).toLocaleDateString()} at {new Date(slot.slotStart).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Duration: {Math.round((new Date(slot.slotEnd).getTime() - new Date(slot.slotStart).getTime()) / (1000 * 60))} minutes
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">${slot.rate || 50}</p>
                            <p className="text-xs text-gray-500">per session</p>
                          </div>
                        </div>
        </div>
      ))}
                  </div>
                )}
              </div>

              {/* Selected Slot Summary */}
              {selectedSlot && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-green-800 mb-2">Selected Session</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><span className="font-medium">Date:</span> {new Date(selectedSlot.slotStart).toLocaleDateString()}</p>
                    <p><span className="font-medium">Time:</span> {new Date(selectedSlot.slotStart).toLocaleTimeString()} - {new Date(selectedSlot.slotEnd).toLocaleTimeString()}</p>
                    <p><span className="font-medium">Duration:</span> {Math.round((new Date(selectedSlot.slotEnd).getTime() - new Date(selectedSlot.slotStart).getTime()) / (1000 * 60))} minutes</p>
                    <p><span className="font-medium">Rate:</span> ${selectedSlot.rate || 50}</p>
                  </div>
                </div>
              )}


              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedMentor(null);
                    setSelectedSlot(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBookingSubmit}
                  disabled={!selectedSlot}
                >
                  Book Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
