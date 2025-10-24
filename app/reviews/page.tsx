"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reviewApi, userApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { useRole } from '@/hooks/useRole';

interface CodeReview {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  menteeId: string;
  mentorId?: string;
  createdAt: string;
  updatedAt: string;
  annotations?: Annotation[];
  comments?: Comment[];
  artifacts?: Artifact[];
}

interface Annotation {
  id: string;
  lineNumber: number;
  content: string;
  type: 'suggestion' | 'issue' | 'praise';
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Artifact {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
}

interface Mentor {
  userId: string;
  name: string;
  primaryDomain: string;
}

export default function Reviews() {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<CodeReview | null>(null);
  const [reviewForm, setReviewForm] = useState({
    title: '',
    description: '',
    mentorId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { showToast } = useToast();
  const { isMentor, isMentee, canPerformAction } = useRole();

  useEffect(() => {
    if (token) {
      fetchReviews();
      fetchMentors();
    }
  }, [token]);

  const fetchReviews = async () => {
    try {
      if (isMentor) {
        // For mentors, fetch review requests assigned to them
        const url = reviewApi.defaults.baseURL + '/reviews/reviews/mentor/me';
        console.log('Fetching mentor reviews from:', url);
        console.log('Review API base URL:', reviewApi.defaults.baseURL);
        
        const response = await reviewApi.get('/reviews/reviews/mentor/me');
        console.log('Mentor reviews response:', response.data);
        setReviews(response.data);
      } else {
        // For mentees, fetch their review requests
        const url = reviewApi.defaults.baseURL + '/reviews/reviews';
        console.log('Fetching mentee reviews from:', url);
        console.log('Review API base URL:', reviewApi.defaults.baseURL);
        
        const response = await reviewApi.get('/reviews/reviews');
        console.log('Mentee reviews response:', response.data);
        setReviews(response.data);
      }
    } catch (error: any) {
      console.error('Reviews fetch error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Request config:', error.config);
      
      // Check if it's a network error
      if (error.code === 'ERR_NETWORK') {
        showToast('Reviews service is not running. Please start the reviews service on port 6001.', 'error');
        // Set empty array to show empty state instead of loading forever
        setReviews([]);
      } else {
        showToast(`Failed to load reviews: ${error.message}`, 'error');
        setReviews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      // Only fetch mentors for mentees (not for mentors)
      if (!isMentor) {
        const response = await userApi.get('/mentors');
        setMentors(response.data);
      }
    } catch (error: any) {
      showToast('Failed to load mentors', 'error');
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewForm.title || !reviewForm.description) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await reviewApi.post('/reviews', {
        title: reviewForm.title,
        description: reviewForm.description,
        mentorId: reviewForm.mentorId || undefined
      });
      
      showToast('Code review request created successfully!', 'success');
      setShowCreateModal(false);
      setReviewForm({ title: '', description: '', mentorId: '' });
      fetchReviews();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (reviewId: string) => {
    if (!selectedFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    setUploading(true);
    try {
      // Get upload URL
      const response = await reviewApi.post(`/reviews/${reviewId}/upload`);
      const { uploadUrl } = response.data;
      
      // Upload file
      await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type
        }
      });
      
      showToast('File uploaded successfully!', 'success');
      setSelectedFile(null);
      fetchReviews();
    } catch (error: any) {
      showToast('Failed to upload file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAssignMentor = async (reviewId: string, mentorId: string) => {
    try {
      await reviewApi.post(`/reviews/${reviewId}/assign`, { mentorId });
      showToast('Mentor assigned successfully!', 'success');
      fetchReviews();
    } catch (error: any) {
      showToast('Failed to assign mentor', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
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
            <h1 className="text-3xl font-bold text-gray-900">
              {isMentor ? 'Review Requests' : 'Code Reviews'}
            </h1>
            <p className="text-gray-600">
              {isMentor 
                ? 'Review and provide feedback on mentee code submissions assigned to you.'
                : 'Request and manage code reviews from experienced mentors.'
              }
            </p>
          </div>
          {canPerformAction('request_review') && (
            <Button onClick={() => setShowCreateModal(true)}>
              {isMentor ? 'View Requests' : 'Request Review'}
            </Button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{review.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                    {review.status.replace('_', ' ').charAt(0).toUpperCase() + review.status.replace('_', ' ').slice(1)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{review.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Created:</span> {formatDateTime(review.createdAt)}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {formatDateTime(review.updatedAt)}
                  </div>
                  <div>
                    <span className="font-medium">Mentor:</span> {review.mentorId ? 'Assigned' : 'Not assigned'}
                  </div>
                </div>

                {review.artifacts && review.artifacts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Files:</h4>
                    <div className="flex flex-wrap gap-2">
                      {review.artifacts.map((artifact) => (
                        <a
                          key={artifact.id}
                          href={artifact.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                        >
                          {artifact.filename}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {review.annotations && review.annotations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Annotations ({review.annotations.length}):</h4>
                    <div className="space-y-1">
                      {review.annotations.slice(0, 3).map((annotation) => (
                        <div key={annotation.id} className="text-xs text-gray-600">
                          Line {annotation.lineNumber}: {annotation.content}
                        </div>
                      ))}
                      {review.annotations.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{review.annotations.length - 3} more annotations
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedReview(review);
                    setShowReviewModal(true);
                  }}
                >
                  View Details
                </Button>
                
                {canPerformAction('assign_review') && !review.mentorId && (
                  <Button
                    size="sm"
                    onClick={() => handleAssignMentor(review.id, user?.userId || '')}
                  >
                    Assign to Me
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600 mb-4">You haven't requested any code reviews yet.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Request Your First Review
            </Button>
          </div>
        </Card>
      )}

      {/* Create Review Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Request Code Review"
        size="lg"
      >
        <form onSubmit={handleCreateReview} className="space-y-4">
          <Input
            label="Review Title"
            value={reviewForm.title}
            onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Brief description of what you want reviewed"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={reviewForm.description}
              onChange={(e) => setReviewForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your code, what you're working on, and what specific feedback you're looking for..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Mentor (Optional)
            </label>
            <select
              value={reviewForm.mentorId}
              onChange={(e) => setReviewForm(prev => ({ ...prev, mentorId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Let system assign automatically</option>
              {mentors.map(mentor => (
                <option key={mentor.userId} value={mentor.userId}>
                  {mentor.name} - {mentor.primaryDomain}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
            >
              Create Review Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Details Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={selectedReview?.title || 'Review Details'}
        size="xl"
      >
        {selectedReview && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{selectedReview.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReview.status)}`}>
                  {selectedReview.status.replace('_', ' ').charAt(0).toUpperCase() + selectedReview.status.replace('_', ' ').slice(1)}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                <p className="text-gray-600">{formatDateTime(selectedReview.createdAt)}</p>
              </div>
            </div>

            {selectedReview.artifacts && selectedReview.artifacts.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Files</h4>
                <div className="space-y-2">
                  {selectedReview.artifacts.map((artifact) => (
                    <div key={artifact.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{artifact.filename}</span>
                      <a
                        href={artifact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReview.annotations && selectedReview.annotations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Annotations</h4>
                <div className="space-y-2">
                  {selectedReview.annotations.map((annotation) => (
                    <div key={annotation.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Line {annotation.lineNumber}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          annotation.type === 'issue' ? 'bg-red-100 text-red-800' :
                          annotation.type === 'suggestion' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {annotation.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{annotation.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReviewModal(false)}
              >
                Close
              </Button>
              {selectedReview.status === 'pending' && (
                <Button
                  onClick={() => {
                    setShowReviewModal(false);
                    // Handle file upload
                  }}
                >
                  Upload Files
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
