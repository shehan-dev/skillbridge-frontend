"use client";
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/', icon: '🏠', roles: ['mentor', 'mentee'] },
      { name: 'Profile', href: '/profile', icon: '👤', roles: ['mentor', 'mentee'] },
      { name: 'Messages', href: '/messages', icon: '💬', roles: ['mentor', 'mentee'] },
      { name: 'Notifications', href: '/notifications', icon: '🔔', roles: ['mentor', 'mentee'] },
      { name: 'Service Status', href: '/service-status', icon: '🔧', roles: ['mentor', 'mentee'] },
    ];

    const menteeItems = [
      { name: 'Find Mentors', href: '/mentors', icon: '👨‍🏫', roles: ['mentee'] },
      { name: 'Book Sessions', href: '/bookings', icon: '📅', roles: ['mentee'] },
      { name: 'Code Reviews', href: '/reviews', icon: '🔍', roles: ['mentee'] },
      { name: 'Payments', href: '/payments', icon: '💳', roles: ['mentee'] },
    ];

    const mentorItems = [
      { name: 'My Mentees', href: '/mentors', icon: '👥', roles: ['mentor'] },
      { name: 'My Bookings', href: '/bookings', icon: '📅', roles: ['mentor'] },
      { name: 'Review Requests', href: '/reviews', icon: '🔍', roles: ['mentor'] },
      { name: 'Earnings', href: '/payments', icon: '💰', roles: ['mentor'] },
      { name: 'Mentor Profile', href: '/mentor-profile', icon: '⚙️', roles: ['mentor'] },
    ];

    if (!user) return baseItems;
    
    const roleSpecificItems = user.isMentor ? mentorItems : menteeItems;
    
    return [...baseItems, ...roleSpecificItems];
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold text-gray-900">SkillBridge</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-1">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600"
                  >
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                    <span className="hidden sm:block">{user.name || 'User'}</span>
                  </Link>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="grid grid-cols-4 gap-1">
              {navigationItems.slice(0, 8).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center py-2 px-1 text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <span className="text-lg mb-1">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
