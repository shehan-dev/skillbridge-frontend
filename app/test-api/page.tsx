"use client";
import { useState } from 'react';
import { userApi, bookingApi, messagingApi, reviewApi, paymentApi, notificationApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function TestAPI() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testService = async (serviceName: string, api: any, endpoint: string) => {
    setLoading(prev => ({ ...prev, [serviceName]: true }));
    try {
      const response = await api.get(endpoint);
      setResults(prev => ({ 
        ...prev, 
        [serviceName]: { 
          status: 'success', 
          data: response.data,
          statusCode: response.status 
        } 
      }));
    } catch (error: any) {
      setResults(prev => ({ 
        ...prev, 
        [serviceName]: { 
          status: 'error', 
          error: error.message,
          statusCode: error.response?.status || 'No response',
          details: error.response?.data || 'No data'
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [serviceName]: false }));
    }
  };

  const testAllServices = async () => {
    await Promise.all([
      testService('User Service', userApi, '/'),
      testService('All Mentees', userApi, '/mentees'),
      testService('Booking Service', bookingApi, '/'),
      testService('Mentor Bookings', bookingApi, '/bookings/mentor/7e7c4370-c164-41ba-b51d-2a90eb5b35b0'),
      testService('Messaging Service', messagingApi, '/messages/conversations'),
      testService('Send Message', messagingApi, '/messages/messages'),
      testService('Mentor Mentees', userApi, '/mentors/7e7c4370-c164-41ba-b51d-2a90eb5b35b0/mentees'),
      testService('Available Mentors', userApi, '/mentors/advanced'),
      testService('Review Service', reviewApi, '/reviews/reviews'),
      testService('Mentor Reviews', reviewApi, '/reviews/reviews/mentor/me'),
      testService('Payment Service', paymentApi, '/payments'),
      testService('Mentor Earnings', userApi, '/earnings/me'),
      testService('Notification Service', notificationApi, '/'),
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">API Service Test</h1>
      
      <div className="mb-6">
        <Button onClick={testAllServices} className="mb-4">
          Test All Services
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(results).map(([serviceName, result]) => (
          <div key={serviceName} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{serviceName}</h3>
              <span className={`px-2 py-1 rounded text-sm ${
                result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.status === 'success' ? '✅ Connected' : '❌ Error'}
              </span>
            </div>
            
            {loading[serviceName] && (
              <p className="text-blue-600">Testing...</p>
            )}
            
            {result.status === 'success' && (
              <div>
                <p className="text-green-600">Status Code: {result.statusCode}</p>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
            
            {result.status === 'error' && (
              <div>
                <p className="text-red-600">Error: {result.error}</p>
                <p className="text-red-600">Status Code: {result.statusCode}</p>
                <pre className="bg-red-50 p-2 rounded text-sm overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Service URLs:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>User Service: http://localhost:3000</li>
          <li>Booking Service: http://localhost:4000</li>
          <li>Messaging Service: http://localhost:5000</li>
          <li>Review Service: http://localhost:6001</li>
          <li>Payment Service: http://localhost:7000</li>
          <li>Notification Service: http://localhost:9000</li>
        </ul>
        <div className="mt-4">
          <h4 className="font-semibold text-blue-900 mb-2">New Endpoints:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>GET /mentees - Get all mentees</li>
            <li>GET /mentors/&#123;mentor_id&#125;/mentees - Get mentees by mentor</li>
            <li>GET /bookings/mentor/:mentorId - Get bookings for mentor (includes mentee details)</li>
            <li>GET /reviews/reviews/mentor/me - Get review requests for mentor</li>
            <li>GET /users/earnings/me - Get earnings for mentor</li>
            <li>POST /messages/messages - Send a message</li>
            <li>GET /messages/conversations - Get user conversations</li>
            <li>GET /messages/conversations/:conversationId - Get conversation messages</li>
            <li>GET /mentors/:mentorId/mentees - Get mentees for a mentor</li>
            <li>GET /mentors/advanced - Get available mentors for mentees</li>
          </ul>
        </div>
        <div className="mt-4">
          <h4 className="font-semibold text-green-900 mb-2">Updated Response Format:</h4>
          <div className="text-sm text-green-800 bg-green-50 p-3 rounded">
            <p className="font-medium mb-2">Bookings now include nested mentee object:</p>
            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`{
  "bookingId": "3c4cbdee-be7c-4923-b610-b6a10da8da9c",
  "menteeId": "3e1fa105-9245-446d-8868-8fc90bf64d90",
  "mentorId": "7e7c4370-c164-41ba-b51d-2a90eb5b35b0",
  "startTime": "2025-10-26T17:50:12.006Z",
  "endTime": "2025-10-26T18:50:12.006Z",
  "status": "pending",
  "mentee": {
    "name": "Shehan Silva",
    "email": "shehan@gmail.com",
    "primaryDomain": "Web Development",
    "skills": ["JavaScript", "React", "Node.js"],
    "seniority": "Mid",
    "experience": 3
  }
}`}
            </pre>
          </div>
        </div>
        <div className="mt-4">
          <h4 className="font-semibold text-purple-900 mb-2">Messaging API Format:</h4>
          <div className="text-sm text-purple-800 bg-purple-50 p-3 rounded">
            <p className="font-medium mb-2">Message Response Format:</p>
            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`{
  "messageId": "msg-123-456",
  "conversationId": "conv-789-012",
  "fromUserId": "7e7c4370-c164-41ba-b51d-2a90eb5b35b0",
  "toUserId": "3e1fa105-9245-446d-8868-8fc90bf64d90",
  "text": "Hello! How are you doing?",
  "timestamp": "2024-01-15T10:30:00Z",
  "isRead": false
}`}
            </pre>
            <p className="font-medium mb-2 mt-4">Conversation Response Format:</p>
            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`{
  "conversationId": "conv-789-012",
  "participants": ["7e7c4370-c164-41ba-b51d-2a90eb5b35b0", "3e1fa105-9245-446d-8868-8fc90bf64d90"],
  "lastMessage": "Hello! How are you doing?",
  "lastMessageTime": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
