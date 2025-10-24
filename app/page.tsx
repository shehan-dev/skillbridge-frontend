"use client";
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/hooks/useRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();
  const { isMentor, isMentee } = useRole();

  const getFeatures = () => {
    if (isMentor) {
      return [
        {
          title: 'My Mentees',
          description: 'View and manage your mentees',
          icon: '👥',
          href: '/mentors'
        },
        {
          title: 'My Bookings',
          description: 'Manage your mentoring sessions',
          icon: '📅',
          href: '/bookings'
        },
        {
          title: 'Review Requests',
          description: 'Provide code review feedback',
          icon: '🔍',
          href: '/reviews'
        },
        {
          title: 'Messages',
          description: 'Communicate with mentees',
          icon: '💬',
          href: '/messages'
        },
        {
          title: 'Earnings',
          description: 'View your earnings and payments',
          icon: '💰',
          href: '/payments'
        }
      ];
    } else {
      return [
        {
          title: 'Find Mentors',
          description: 'Connect with experienced professionals',
          icon: '👨‍🏫',
          href: '/mentors'
        },
        {
          title: 'Book Sessions',
          description: 'Schedule one-on-one mentoring sessions',
          icon: '📅',
          href: '/bookings'
        },
        {
          title: 'Code Reviews',
          description: 'Get expert feedback on your code',
          icon: '🔍',
          href: '/reviews'
        },
        {
          title: 'Messages',
          description: 'Communicate with mentors',
          icon: '💬',
          href: '/messages'
        },
        {
          title: 'Payments',
          description: 'Secure payment processing',
          icon: '💳',
          href: '/payments'
        }
      ];
    }
  };

  const features = getFeatures();

  const stats = [
    { label: 'Active Mentors', value: '150+', icon: '👨‍🏫' },
    { label: 'Sessions Completed', value: '2,500+', icon: '🎯' },
    { label: 'Happy Mentees', value: '1,200+', icon: '😊' },
    { label: 'Code Reviews', value: '800+', icon: '🔍' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-blue-600">SkillBridge</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with experienced mentors, accelerate your learning journey, and unlock your potential through personalized guidance and expert feedback.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <Link href={feature.href}>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name || 'User'}!
        </h1>
        <p className="text-gray-600">
          {isMentor 
            ? "Here's your mentoring dashboard. Manage your mentees and sessions."
            : "Here's what's happening with your learning journey."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center">
              <div className="text-3xl mr-4">{stat.icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <Link href={feature.href}>
                <Button className="w-full">
                  Go to {feature.title}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
            <p className="text-gray-600 mb-6">
              Explore our platform and connect with amazing mentors to accelerate your learning journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/mentors">
                <Button size="lg">
                  Find Mentors
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="lg">
                  Complete Profile
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
