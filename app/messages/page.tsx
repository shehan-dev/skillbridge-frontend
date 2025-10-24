"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { messagingApi, userApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useRole } from '@/hooks/useRole';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Message {
  messageId: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  conversationId: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  isMentor: boolean;
  primaryDomain?: string;
  skills?: string[];
  seniority?: string;
  experience?: number;
}

export default function Messages() {
  const { user, token } = useAuth();
  const { isMentor, isMentee } = useRole();
  const { socket, isConnected, sendMessage: sendWebSocketMessage, lastMessage } = useWebSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [newConversationForm, setNewConversationForm] = useState({
    recipientId: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    if (token) {
      fetchConversations();
      fetchUsers();
    }
  }, [token]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      console.log('Processing WebSocket message:', lastMessage);
      
      switch (lastMessage.type) {
        case 'message':
          // Add new message to current conversation
          if (selectedConversation && lastMessage.conversationId === selectedConversation.conversationId) {
            setMessages(prev => [...prev, lastMessage.data]);
          }
          // Update conversations list
          fetchConversations();
          break;
          
        case 'conversation_update':
          // Refresh conversations when they're updated
          fetchConversations();
          break;
          
        case 'typing':
          // Handle typing indicators (optional)
          console.log('User typing:', lastMessage.data);
          break;
          
        default:
          console.log('Unknown WebSocket message type:', lastMessage.type);
      }
    }
  }, [lastMessage, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversationId);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations from:', messagingApi.defaults.baseURL + '/messages/conversations');
      const response = await messagingApi.get('/messages/conversations');
      console.log('Conversations response:', response.data);
      setConversations(response.data);
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      console.error('Error response:', error.response);
      showToast(`Failed to load conversations: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversation ID:', conversationId);
      showToast('Invalid conversation ID', 'error');
      return;
    }
    
    try {
      console.log('Fetching messages for conversation:', conversationId);
      console.log('Full URL:', messagingApi.defaults.baseURL + `/messages/conversations/${conversationId}`);
      const response = await messagingApi.get(`/messages/conversations/${conversationId}`);
      console.log('Messages response:', response.data);
      setMessages(response.data);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      console.error('Error response:', error.response);
      showToast(`Failed to load messages: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log('Fetching users for role:', isMentor ? 'mentor' : 'mentee');
      console.log('User ID:', user?.userId);
      
      if (isMentor) {
        // For mentors, fetch their mentees
        console.log('Fetching mentees for mentor:', user?.userId);
        const response = await userApi.get(`/mentors/${user?.userId}/mentees`);
        console.log('Mentees response:', response.data);
        setUsers(response.data);
      } else {
        // For mentees, fetch available mentors
        console.log('Fetching available mentors');
        const response = await userApi.get('/mentors/advanced');
        console.log('Mentors response:', response.data);
        setUsers(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      console.error('Error response:', error.response);
      showToast(`Failed to load ${isMentor ? 'mentees' : 'mentors'}: ${error.response?.data?.error || error.message}`, 'error');
      
      // For development, add some mock data if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Adding mock data for testing...');
        const mockUsers = isMentor ? [
          {
            userId: 'mentee-1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Mentee',
            isMentor: false,
            primaryDomain: 'Web Development',
            skills: ['JavaScript', 'React'],
            seniority: 'Junior',
            experience: 1
          },
          {
            userId: 'mentee-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'Mentee',
            isMentor: false,
            primaryDomain: 'Data Science',
            skills: ['Python', 'Machine Learning'],
            seniority: 'Mid',
            experience: 3
          }
        ] : [
          {
            userId: 'mentor-1',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            role: 'Mentor',
            isMentor: true,
            primaryDomain: 'Software Engineering',
            skills: ['Java', 'Spring Boot'],
            seniority: 'Senior',
            experience: 8
          },
          {
            userId: 'mentor-2',
            name: 'Bob Wilson',
            email: 'bob@example.com',
            role: 'Mentor',
            isMentor: true,
            primaryDomain: 'DevOps',
            skills: ['AWS', 'Docker', 'Kubernetes'],
            seniority: 'Principal',
            experience: 10
          }
        ];
        setUsers(mockUsers);
        showToast('Using mock data for testing. Check console for API errors.', 'warning');
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      // Get the other participant's ID
      const otherParticipantId = selectedConversation.participants.find(
        id => id !== user?.userId
      );
      
      if (!otherParticipantId) {
        showToast('Cannot determine recipient', 'error');
        return;
      }

      // Send via WebSocket if connected, otherwise fallback to HTTP
      if (isConnected && socket) {
        console.log('Sending message via WebSocket');
        sendWebSocketMessage({
          type: 'send_message',
          toUserId: otherParticipantId,
          text: newMessage.trim(),
          conversationId: selectedConversation.conversationId
        });
        
        // Optimistically add message to UI
        const optimisticMessage: Message = {
          messageId: `temp-${Date.now()}`,
          conversationId: selectedConversation.conversationId,
          fromUserId: user?.userId || '',
          toUserId: otherParticipantId,
          text: newMessage.trim(),
          timestamp: new Date().toISOString(),
          isRead: false
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
      } else {
        console.log('WebSocket not connected, using HTTP fallback');
        await messagingApi.post('/messages/messages', {
          toUserId: otherParticipantId,
          text: newMessage.trim()
        });
        
        setNewMessage('');
        fetchMessages(selectedConversation.conversationId);
        fetchConversations(); // Refresh to update last message
      }
    } catch (error: any) {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const createConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newConversationForm.recipientId) {
      showToast('Please select a recipient', 'error');
      return;
    }

    try {
      // Send a message to create a conversation
      await messagingApi.post('/messages/messages', {
        toUserId: newConversationForm.recipientId,
        text: "Hello! I'd like to start a conversation."
      });
      
      showToast('Conversation started successfully!', 'success');
      setShowNewConversationModal(false);
      setNewConversationForm({ recipientId: '' });
      fetchConversations();
    } catch (error: any) {
      showToast('Failed to start conversation', 'error');
    }
  };

  const getOtherParticipantId = (conversation: Conversation) => {
    return conversation.participants.find(id => id !== user?.userId);
  };

  const getOtherParticipantName = (conversation: Conversation) => {
    const otherId = getOtherParticipantId(conversation);
    const otherUser = users.find(u => u.userId === otherId);
    return otherUser?.name || 'Unknown User';
  };

  const getOtherParticipantRole = (conversation: Conversation) => {
    const otherId = getOtherParticipantId(conversation);
    const otherUser = users.find(u => u.userId === otherId);
    return otherUser?.role || 'User';
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">
              {isMentor 
                ? "Communicate with your mentees and provide guidance."
                : "Connect with mentors and get expert advice."
              }
            </p>
            
            {/* WebSocket Connection Status */}
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Real-time messaging active' : 'Connecting...'}
              </span>
            </div>
          </div>
          <Button onClick={() => {
            console.log('Opening modal, current state:', showNewConversationModal);
            setShowNewConversationModal(true);
            fetchUsers(); // Fetch users when opening modal
          }}>
            {isMentor ? "Message Mentees" : "Message Mentors"}
          </Button>
          
          {/* Debug Modal State */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
              <p><strong>Modal State:</strong> {showNewConversationModal ? 'Open' : 'Closed'}</p>
              <p><strong>Users Count:</strong> {users.length}</p>
              <button 
                onClick={() => setShowNewConversationModal(!showNewConversationModal)}
                className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Toggle Modal
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card title="Conversations">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {conversations.map((conversation) => {
                const otherParticipantName = getOtherParticipantName(conversation);
                return (
                  <div
                    key={conversation.conversationId}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.conversationId === conversation.conversationId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      console.log('Selected conversation:', conversation);
                      console.log('Conversation ID:', conversation.conversationId);
                      setSelectedConversation(conversation);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">
                        {otherParticipantName}
                      </h3>
                    </div>
                    
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {formatDateTime(conversation.lastMessageTime)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card>
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getOtherParticipantName(selectedConversation)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getOtherParticipantRole(selectedConversation)}
                  </p>
                </div>
              </div>

              {/* Messages List */}
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`flex ${
                      message.fromUserId === user?.userId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.fromUserId === user?.userId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.fromUserId === user?.userId ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  loading={sending}
                  disabled={sending || !newMessage.trim()}
                >
                  Send
                </Button>
              </form>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-600">Choose a conversation from the list to start messaging.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {conversations.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
            <p className="text-gray-600 mb-4">
              {isMentor 
                ? "Start a conversation with your mentees to provide guidance and support."
                : "Start a conversation with mentors to get expert advice and mentorship."
              }
            </p>
            <Button onClick={() => {
              setShowNewConversationModal(true);
              fetchUsers(); // Fetch users when opening modal
            }}>
              {isMentor ? "Message Your Mentees" : "Find Mentors to Message"}
            </Button>
          </div>
        </Card>
      )}

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {isMentor ? "Message Your Mentees" : "Message Mentors"}
              </h2>
              <button
                onClick={() => setShowNewConversationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
        <form onSubmit={createConversation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isMentor ? "Select a Mentee" : "Select a Mentor"}
            </label>
            <select
              value={newConversationForm.recipientId}
              onChange={(e) => setNewConversationForm(prev => ({ ...prev, recipientId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ color: '#111827' }}
              required
              disabled={loadingUsers}
            >
              <option value="">
                {loadingUsers 
                  ? `Loading ${isMentor ? 'mentees' : 'mentors'}...` 
                  : users.length === 0 
                    ? `No ${isMentor ? 'mentees' : 'mentors'} available`
                    : `Choose a ${isMentor ? 'mentee' : 'mentor'}...`
                }
              </option>
              {users
                .filter(u => u.userId !== user?.userId)
                .map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.name} {user.primaryDomain && `(${user.primaryDomain})`} {user.seniority && `- ${user.seniority}`}
                </option>
              ))}
            </select>
            
            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>Role: {isMentor ? 'Mentor' : 'Mentee'}</p>
                <p>Loading: {loadingUsers ? 'Yes' : 'No'}</p>
                <p>Users Count: {users.length}</p>
                <p>User ID: {user?.userId}</p>
                {users.length > 0 && (
                  <p>First User: {users[0]?.name} ({users[0]?.userId})</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewConversationModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              {isMentor ? "Message Mentee" : "Message Mentor"}
            </Button>
          </div>
        </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}