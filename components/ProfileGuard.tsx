"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { userApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProfileGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProfileGuard({ children, fallback }: ProfileGuardProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user) {
      checkProfileCompletion();
    } else if (!user) {
      setProfileComplete(false);
      setLoading(false);
    }
  }, [token, user]);

  const checkProfileCompletion = async () => {
    try {
      // For now, we'll consider profile complete if user has name and email
      // You can implement a more sophisticated check based on your requirements
      const isComplete = !!(user?.name && user?.email);
      setProfileComplete(isComplete);
    } catch (error) {
      console.error('Failed to check profile completion:', error);
      setProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access this page.</p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (profileComplete === false) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-6">👤</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile</h2>
            <p className="text-gray-600 mb-6">
              To get started with SkillBridge, please complete your profile with your skills, experience, and preferences.
            </p>
            <div className="space-y-4">
              <Button onClick={() => router.push('/profile')} size="lg">
                Complete Profile
              </Button>
              <p className="text-sm text-gray-500">
                This helps us match you with the right mentors and mentees.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
