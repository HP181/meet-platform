"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

// Define participant interface
export interface Participant {
  id: string;
  name: string;
  image?: string;
}

export const useGetCallsWithParticipants = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>([]);
  const [callParticipants, setCallParticipants] = useState<{ [callId: string]: Participant[] }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (!client || !user?.id) return;
      
      setIsLoading(true);

      try {
        // Query calls with minimal options
        const { calls } = await client.queryCalls({
          sort: [{ field: 'starts_at', direction: -1 }],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              { created_by_user_id: user.id },
              { members: { $in: [user.id] } },
            ],
          },
        });
        
        console.log('Retrieved calls:', calls);
        setCalls(calls);
        
        // Extract participant information for each call
        const participantsMap: { [callId: string]: Participant[] } = {};
        
        for (const call of calls) {
          const callId = call.id;
          const participants = await extractParticipants(call);
          participantsMap[callId] = participants;
        }
        
        setCallParticipants(participantsMap);
      } catch (error) {
        console.error('Error loading calls:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Extract participants from multiple sources
    const extractParticipants = async (call: Call): Promise<Participant[]> => {
      let participants: Participant[] = [];
      
      // Method 1: Try to get from call state members
      try {
        const members = call.state?.members || {};
        
        const stateParticipants = Object.entries(members)
          .filter(([userId, member]) => userId && member)
          .map(([userId, member]) => ({
            id: String(userId),
            name: String(member.user?.name || member.user?.id || 'Unknown User'),
            image: typeof member.user?.image === 'string' ? member.user.image : undefined,
          }));
          
        if (stateParticipants.length > 0) {
          participants = stateParticipants;
          console.log(`Found ${participants.length} participants from call state for ${call.id}`);
          return participants;
        }
      } catch (error) {
        console.log('Error extracting participants from call state:', error);
      }
      
      // Method 2: Try to get from call data
      try {
        const callData = await call.get();
        
        // Safely access properties with type casting only when needed
        const createdById = (callData as any).created_by?.id;
        const createdByName = (callData as any).created_by?.name;
        const createdByImage = (callData as any).created_by?.image;
        
        if (createdById) {
          participants.push({
            id: String(createdById),
            name: String(createdByName || 'Call Creator'),
            image: typeof createdByImage === 'string' ? createdByImage : undefined,
          });
        }
        
        // Get members safely
        const callMembers = callData.members || [];
        
        const dataParticipants = callMembers
          .filter(member => {
            // Check if member has required properties
            const hasUserId = !!member.user_id;
            const hasId = !!(member as any).id;
            return hasUserId || hasId;
          })
          .map(member => {
            // Safely get ID, preferring user_id if available
            const id = member.user_id || (member as any).id || 'unknown';
            
            return {
              id: String(id),
              name: String(member.user?.name || 'Call Member'),
              image: typeof member.user?.image === 'string' ? member.user.image : undefined,
            };
          });
        
        if (dataParticipants.length > 0) {
          participants = participants.concat(dataParticipants);
          
          // Remove duplicates
          participants = Array.from(
            new Map(participants.map(p => [p.id, p])).values()
          );
          
          console.log(`Found ${participants.length} participants from call data for ${call.id}`);
          return participants;
        }
      } catch (error) {
        console.log('Error extracting participants from call data:', error);
      }
      
      // Method 3: Try to get from call custom data
      try {
        const customData = call.state?.custom || {};
        const customParticipants = (customData as any).participants;
        
        if (customParticipants && Array.isArray(customParticipants)) {
          participants = customParticipants.map((p: any) => ({
            id: String(p.id || 'unknown'),
            name: String(p.name || 'Participant'),
            image: typeof p.image === 'string' ? p.image : undefined,
          }));
          
          console.log(`Found ${participants.length} participants from custom data for ${call.id}`);
          return participants;
        }
      } catch (error) {
        console.log('Error extracting participants from custom data:', error);
      }
      
      // Method 4: Create from user and creator info
      try {
        if (user) {
          const creator: Participant = {
            id: String(call.state?.createdBy || 'unknown-creator'),
            name: 'Meeting Creator',
          };
          
          const currentUser: Participant = {
            id: String(user.id),
            name: String(user.fullName || user.username || 'Current User'),
            image: typeof user.imageUrl === 'string' ? user.imageUrl : undefined,
          };
          
          participants = [creator, currentUser];
          console.log(`Using creator and current user as participants for ${call.id}`);
          return participants;
        }
      } catch (error) {
        console.log('Error creating default participants:', error);
      }
      
      // Default fallback
      return [
        { id: 'participant-1', name: 'Meeting Participant 1' },
        { id: 'participant-2', name: 'Meeting Participant 2' },
      ];
    };

    loadCalls();
  }, [client, user]);

  const now = new Date();

  const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < now) || !!endedAt
  });

  const upcomingCalls = calls?.filter(({ state: { startsAt } }: Call) => {
    return startsAt && new Date(startsAt) > now
  });

  return { 
    endedCalls, 
    upcomingCalls, 
    callRecordings: calls, 
    callParticipants, 
    isLoading 
  };
};