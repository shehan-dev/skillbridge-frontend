"use client";
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/hooks/useRole';

export default function DebugUser() {
  const { user, token } = useAuth();
  const { isMentor, isMentee, canPerformAction } = useRole();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Debug Information</h1>
      
      <div className="space-y-6">
        {/* Authentication Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Authentication Status</h2>
          <p className="text-blue-800">Token: {token ? '✅ Present' : '❌ Missing'}</p>
          <p className="text-blue-800">User: {user ? '✅ Loaded' : '❌ Not loaded'}</p>
        </div>

        {/* User Data */}
        {user && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-2">User Data</h2>
            <pre className="bg-white p-3 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        {/* Role Information */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">Role Information</h2>
          <p className="text-yellow-800">Is Mentor: {isMentor ? '✅ Yes' : '❌ No'}</p>
          <p className="text-yellow-800">Is Mentee: {isMentee ? '✅ Yes' : '❌ No'}</p>
        </div>

        {/* Permission Tests */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-purple-900 mb-2">Permission Tests</h2>
          <div className="space-y-2">
            <p className="text-purple-800">
              Can create booking: {canPerformAction('create_booking') ? '✅ Yes' : '❌ No'}
            </p>
            <p className="text-purple-800">
              Can accept booking: {canPerformAction('accept_booking') ? '✅ Yes' : '❌ No'}
            </p>
            <p className="text-purple-800">
              Can request review: {canPerformAction('request_review') ? '✅ Yes' : '❌ No'}
            </p>
            <p className="text-purple-800">
              Can assign review: {canPerformAction('assign_review') ? '✅ Yes' : '❌ No'}
            </p>
            <p className="text-purple-800">
              Can make payment: {canPerformAction('make_payment') ? '✅ Yes' : '❌ No'}
            </p>
            <p className="text-purple-800">
              Can view earnings: {canPerformAction('view_earnings') ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        {/* Navigation Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Expected Navigation</h2>
          <div className="space-y-2">
            <p className="text-gray-800">
              {isMentor ? 'Mentor Navigation:' : 'Mentee Navigation:'}
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 ml-4">
              {isMentor ? (
                <>
                  <li>My Mentees</li>
                  <li>My Bookings</li>
                  <li>Review Requests</li>
                  <li>My Sessions</li>
                  <li>Earnings</li>
                  <li>Mentor Profile</li>
                </>
              ) : (
                <>
                  <li>Find Mentors</li>
                  <li>Book Sessions</li>
                  <li>Code Reviews</li>
                  <li>Video Sessions</li>
                  <li>Payments</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
