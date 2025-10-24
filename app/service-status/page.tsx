"use client";
import { useState } from 'react';
import { userApi, bookingApi, messagingApi, reviewApi, paymentApi, notificationApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'checking' | 'online' | 'offline';
  error?: string;
}

export default function ServiceStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'User Service', url: 'http://localhost:3000', status: 'checking' },
    { name: 'Booking Service', url: 'http://localhost:4000', status: 'checking' },
    { name: 'Messaging Service', url: 'http://localhost:5000', status: 'checking' },
    { name: 'Review Service', url: 'http://localhost:6001', status: 'checking' },
    { name: 'Payment Service', url: 'http://localhost:7000', status: 'checking' },
    { name: 'Notification Service', url: 'http://localhost:9000', status: 'checking' },
  ]);

  const checkService = async (service: ServiceStatus, index: number) => {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, status: 'checking' } : s));
    
    try {
      let response;
      switch (service.name) {
        case 'User Service':
          response = await userApi.get('/');
          break;
        case 'Booking Service':
          response = await bookingApi.get('/');
          break;
        case 'Messaging Service':
          response = await messagingApi.get('/conversations');
          break;
        case 'Review Service':
          response = await reviewApi.get('/reviews/reviews');
          break;
        case 'Payment Service':
          response = await paymentApi.get('/payments');
          break;
        case 'Notification Service':
          response = await notificationApi.get('/');
          break;
        default:
          throw new Error('Unknown service');
      }
      
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, status: 'online' } : s
      ));
    } catch (error: any) {
      setServices(prev => prev.map((s, i) => 
        i === index ? { 
          ...s, 
          status: 'offline', 
          error: error.code === 'ERR_NETWORK' ? 'Service not running' : error.message 
        } : s
      ));
    }
  };

  const checkAllServices = async () => {
    for (let i = 0; i < services.length; i++) {
      await checkService(services[i], i);
      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'checking': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '✅';
      case 'offline': return '❌';
      case 'checking': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Service Status</h1>
        <p className="text-gray-600 mb-6">
          Check the status of all microservices in the Skill Bridge system.
        </p>
        <Button onClick={checkAllServices} className="mb-6">
          Check All Services
        </Button>
      </div>

      <div className="grid gap-4">
        {services.map((service, index) => (
          <Card key={service.name} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{getStatusIcon(service.status)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600">{service.url}</p>
                  {service.error && (
                    <p className="text-sm text-red-600 mt-1">{service.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                  {service.status === 'checking' ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Checking...</span>
                    </div>
                  ) : (
                    service.status.toUpperCase()
                  )}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => checkService(service, index)}
                  disabled={service.status === 'checking'}
                >
                  Check
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Troubleshooting Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Make sure all microservices are running on their respective ports</li>
          <li>• Check that no other applications are using the same ports</li>
          <li>• Verify that the services are accessible via the URLs shown above</li>
          <li>• For development, you can start services individually or use docker-compose</li>
          <li>• Note: Port 6000 is blocked by browsers, so Review Service uses port 6001</li>
        </ul>
      </div>
    </div>
  );
}
