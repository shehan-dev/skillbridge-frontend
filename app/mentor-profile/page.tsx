"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useRole } from '@/hooks/useRole';
import { RoleGuard } from '@/components/RoleGuard';

interface AvailabilitySlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  type: 'session' | 'review' | 'consultation';
}

interface MentorProfile {
  userId: string;
  name: string;
  bio: string;
  primaryDomain: string;
  seniority: string;
  badges: string[];
  hourlyRate: number;
  availability: AvailabilitySlot[];
  servicePackages: ServicePackage[];
  skills: string[];
  experience: string;
  location: string;
}

export default function MentorProfile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<AvailabilitySlot>>({
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'UTC'
  });
  const [newPackage, setNewPackage] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    price: 0,
    duration: 60,
    type: 'session'
  });
  const { showToast } = useToast();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await userApi.get('/me');
      setProfile(response.data);
    } catch (error: any) {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      await userApi.put('/profile', profile);
      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAvailability = async () => {
    if (!profile || !newSlot.dayOfWeek || !newSlot.startTime || !newSlot.endTime) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      await userApi.post('/availability', newSlot);
      showToast('Availability slot added successfully!', 'success');
      setShowAvailabilityModal(false);
      setNewSlot({
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC'
      });
      fetchProfile();
    } catch (error: any) {
      showToast('Failed to add availability slot', 'error');
    }
  };

  const handleAddServicePackage = async () => {
    if (!profile || !newPackage.name || !newPackage.description) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      await userApi.post('/service-packages', newPackage);
      showToast('Service package created successfully!', 'success');
      setShowPackageModal(false);
      setNewPackage({
        name: '',
        description: '',
        price: 0,
        duration: 60,
        type: 'session'
      });
      fetchProfile();
    } catch (error: any) {
      showToast('Failed to create service package', 'error');
    }
  };

  const handleRemoveAvailability = async (slotId: string) => {
    try {
      await userApi.delete(`/availability/${slotId}`);
      showToast('Availability slot removed successfully!', 'success');
      fetchProfile();
    } catch (error: any) {
      showToast('Failed to remove availability slot', 'error');
    }
  };

  const handleRemovePackage = async (packageId: string) => {
    try {
      await userApi.delete(`/service-packages/${packageId}`);
      showToast('Service package removed successfully!', 'success');
      fetchProfile();
    } catch (error: any) {
      showToast('Failed to remove service package', 'error');
    }
  };

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['mentor']}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mentor Profile Management</h1>
          <p className="text-gray-600">Manage your availability, pricing, and service packages.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card title="Profile Information">
            <div className="space-y-4">
              <Input
                label="Bio"
                value={profile?.bio || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                placeholder="Tell mentees about your experience and expertise..."
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seniority Level
                </label>
                <select
                  value={profile?.seniority || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, seniority: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select seniority level</option>
                  <option value="junior">Junior Engineer</option>
                  <option value="mid">Mid-Level Engineer</option>
                  <option value="senior">Senior Engineer</option>
                  <option value="staff">Staff Engineer</option>
                  <option value="principal">Principal Engineer</option>
                  <option value="architect">Software Architect</option>
                </select>
              </div>

              <Input
                label="Hourly Rate ($)"
                type="number"
                value={profile?.hourlyRate || 0}
                onChange={(e) => setProfile(prev => prev ? { ...prev, hourlyRate: parseInt(e.target.value) || 0 } : null)}
                placeholder="50"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations & Badges
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableBadges.map(badge => (
                    <label key={badge} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={profile?.badges?.includes(badge) || false}
                        onChange={(e) => {
                          if (profile) {
                            const newBadges = e.target.checked
                              ? [...(profile.badges || []), badge]
                              : (profile.badges || []).filter(b => b !== badge);
                            setProfile({ ...profile, badges: newBadges });
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

          {/* Availability Management */}
          <Card title="Availability" actions={
            <Button size="sm" onClick={() => setShowAvailabilityModal(true)}>
              Add Slot
            </Button>
          }>
            <div className="space-y-3">
              {profile?.availability?.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium capitalize">{slot.dayOfWeek}</span>
                    <span className="text-gray-600 ml-2">
                      {slot.startTime} - {slot.endTime} ({slot.timezone})
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveAvailability(slot.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              {(!profile?.availability || profile.availability.length === 0) && (
                <p className="text-gray-500 text-center py-4">No availability slots set</p>
              )}
            </div>
          </Card>

          {/* Service Packages */}
          <Card title="Service Packages" actions={
            <Button size="sm" onClick={() => setShowPackageModal(true)}>
              Add Package
            </Button>
          }>
            <div className="space-y-3">
              {profile?.servicePackages?.map((pkg) => (
                <div key={pkg.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{pkg.name}</h4>
                      <p className="text-sm text-gray-600">{pkg.description}</p>
                      <p className="text-sm text-gray-500">
                        ${pkg.price} • {pkg.duration} minutes • {pkg.type}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemovePackage(pkg.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!profile?.servicePackages || profile.servicePackages.length === 0) && (
                <p className="text-gray-500 text-center py-4">No service packages created</p>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card title="Actions">
            <div className="space-y-3">
              <Button
                onClick={handleSaveProfile}
                loading={saving}
                disabled={saving}
                className="w-full"
              >
                Save Profile Changes
              </Button>
              
              <Button
                variant="outline"
                onClick={fetchProfile}
                className="w-full"
              >
                Refresh Profile
              </Button>
            </div>
          </Card>
        </div>

        {/* Add Availability Modal */}
        <Modal
          isOpen={showAvailabilityModal}
          onClose={() => setShowAvailabilityModal(false)}
          title="Add Availability Slot"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Week
              </label>
              <select
                value={newSlot.dayOfWeek}
                onChange={(e) => setNewSlot(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
              />
              <Input
                label="End Time"
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>

            <Input
              label="Timezone"
              value={newSlot.timezone}
              onChange={(e) => setNewSlot(prev => ({ ...prev, timezone: e.target.value }))}
              placeholder="UTC"
            />

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAvailabilityModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddAvailability}>
                Add Slot
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Service Package Modal */}
        <Modal
          isOpen={showPackageModal}
          onClose={() => setShowPackageModal(false)}
          title="Create Service Package"
        >
          <div className="space-y-4">
            <Input
              label="Package Name"
              value={newPackage.name}
              onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., 1-on-1 Coding Session"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newPackage.description}
                onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this package includes..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price ($)"
                type="number"
                value={newPackage.price}
                onChange={(e) => setNewPackage(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                value={newPackage.duration}
                onChange={(e) => setNewPackage(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Type
              </label>
              <select
                value={newPackage.type}
                onChange={(e) => setNewPackage(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="session">Mentoring Session</option>
                <option value="review">Code Review</option>
                <option value="consultation">Consultation</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPackageModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddServicePackage}>
                Create Package
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  );
}
