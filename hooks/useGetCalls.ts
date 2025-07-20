import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

/**
 * Custom hook to fetch and categorize calls from Stream Video API
 * @returns Object containing categorized calls and loading state
 */
export const useGetCalls = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>([]);
  const [callRecordings, setCallRecordings] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  /**
   * Fetch calls from Stream API
   */
  const loadCalls = useCallback(async () => {
    if (!client || !user?.id) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all calls that the user is a part of
      const { calls: fetchedCalls } = await client.queryCalls({
        sort: [{ field: 'starts_at', direction: -1 }],
        filter_conditions: {
          $or: [
            { created_by_user_id: user.id },
            { members: { $in: [user.id] } },
          ],
        },
        limit: 100, // Set an appropriate limit
      });

      console.log('Fetched calls:', fetchedCalls?.length || 0);
      setCalls(fetchedCalls || []);

      // Fetch calls with recordings specifically
      // This query focuses on calls that might have recordings
      const { calls: recordingCalls } = await client.queryCalls({
        filter_conditions: {
          recording: { $exists: true },
          $or: [
            { created_by_user_id: user.id },
            { members: { $in: [user.id] } },
          ],
        },
        limit: 50,
      });

      setCallRecordings(recordingCalls || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching calls:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch calls'));
    } finally {
      setIsLoading(false);
    }
  }, [client, user?.id]);

  // Load calls on initial render and when dependencies change
  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  // Process calls into categories
  const now = new Date();

  // Ended calls: either they have an endedAt property or their start time is in the past
  const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < now) || !!endedAt;
  });

  // Upcoming calls: their start time is in the future
  const upcomingCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return startsAt && new Date(startsAt) > now && !endedAt;
  });

  return { 
    endedCalls, 
    upcomingCalls, 
    callRecordings, 
    isLoading,
    error,
    lastRefresh,
    refreshCalls: loadCalls
  };
};

export default useGetCalls;