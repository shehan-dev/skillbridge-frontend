"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notificationApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'message' | 'code_review' | 'session' | 'payment' | 'general';
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  bookingNotifications: boolean;
  messageNotifications: boolean;
  reviewNotifications: boolean;
  sessionNotifications: boolean;
  paymentNotifications: boolean;
}

export default function Notifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    bookingNotifications: true,
    messageNotifications: true,
    reviewNotifications: true,
    sessionNotifications: true,
    paymentNotifications: true
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
        const allResponse = await notificationApi.get('/notifications');
      setNotifications(allResponse.data);
    } catch (error: any) {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await notificationApi.get('/preferences');
      setPreferences(response.data);
    } catch (error: any) {
      showToast('Failed to load preferences', 'error');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationApi.put(`/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      showToast('Failed to mark notification as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.put('/read-all');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (error: any) {
      showToast('Failed to mark all notifications as read', 'error');
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await notificationApi.put('/preferences', preferences);
      showToast('Preferences saved successfully!', 'success');
      setShowPreferencesModal(false);
    } catch (error: any) {
      showToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📅';
      case 'message': return '💬';
      case 'code_review': return '🔍';
      case 'session': return '🎥';
      case 'payment': return '💳';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-blue-600 bg-blue-100';
      case 'message': return 'text-green-600 bg-green-100';
      case 'code_review': return 'text-purple-600 bg-purple-100';
      case 'session': return 'text-orange-600 bg-orange-100';
      case 'payment': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              Stay updated with your mentoring activities.
              {unreadCount > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                Mark All Read
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowPreferencesModal(true)}>
              Preferences
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-2xl">
                {getTypeIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-medium ${
                    !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {notification.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                      {notification.type.replace('_', ' ')}
                    </span>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <p className={`text-sm ${
                  !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {notification.message}
                </p>
                
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(notification.createdAt)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
          </div>
        </Card>
      )}

      {/* Preferences Modal */}
      <Modal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        title="Notification Preferences"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">General Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">Email notifications</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">Push notifications</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Types</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.bookingNotifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, bookingNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">📅 Booking updates</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.messageNotifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, messageNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">💬 New messages</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.reviewNotifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, reviewNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">🔍 Code review updates</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.sessionNotifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, sessionNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">🎥 Session reminders</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.paymentNotifications}
                  onChange={(e) => setPreferences(prev => ({ ...prev, paymentNotifications: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">💳 Payment updates</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowPreferencesModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={savePreferences}
              loading={saving}
              disabled={saving}
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
