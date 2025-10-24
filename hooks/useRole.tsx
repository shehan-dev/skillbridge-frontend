"use client";
import { useAuth } from '@/context/AuthContext';

export function useRole() {
  const { user } = useAuth();

  const isMentor = user?.isMentor === true;
  const isMentee = user?.isMentor === false;
  const isAuthenticated = !!user;

  const canAccess = (roles: string[]) => {
    if (!user) return false;
    const userRole = user.isMentor ? 'mentor' : 'mentee';
    return roles.includes(userRole);
  };

  const canPerformAction = (action: string) => {
    if (!user) return false;
    
    const actionPermissions: Record<string, string[]> = {
      // Booking actions
      'create_booking': ['mentee'],
      'accept_booking': ['mentor'],
      'decline_booking': ['mentor'],
      
      // Review actions
      'request_review': ['mentee'],
      'assign_review': ['mentor'],
      'annotate_review': ['mentor'],
      
      // Payment actions
      'make_payment': ['mentee'],
      'view_earnings': ['mentor'],
      
      
      // Message actions
      'send_message': ['mentor', 'mentee'],
      
      // Profile actions
      'update_profile': ['mentor', 'mentee'],
      'view_mentors': ['mentee'],
      'view_mentees': ['mentor'],
    };

    const allowedRoles = actionPermissions[action] || [];
    const userRole = user.isMentor ? 'mentor' : 'mentee';
    return allowedRoles.includes(userRole);
  };

  return {
    user,
    isMentor,
    isMentee,
    isAuthenticated,
    canAccess,
    canPerformAction,
  };
}
