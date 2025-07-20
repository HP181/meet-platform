// hooks/useParticipantTracking.ts

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

// Define participant type
export interface ParticipantData {
  user_id: string;
  name: string;
  email?: string;
  image_url?: string;
  role?: string;
}

export type TrackingAction = 'join' | 'leave' | 'end';

export const useParticipantTracking = () => {
  const { user } = useUser();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track participant action (join, leave, end)
  const trackParticipant = async (
    callId: string,
    callType: string,
    action: TrackingAction
  ) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsTracking(true);
    setError(null);

    try {
      // Create participant data from current user
      const participantData: ParticipantData = {
        user_id: user.id,
        name: user.fullName || user.username || user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        image_url: user.imageUrl,
        role: action === 'end' ? 'ender' : 'participant',
      };

      // Call our API endpoint
      const response = await fetch('/api/meeting/track-participant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: callId,
          call_type: callType,
          participant: participantData,
          action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track participant');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error tracking participant:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsTracking(false);
    }
  };

  return {
    trackParticipant,
    isTracking,
    error,
  };
};