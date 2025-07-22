// hooks/useRecordings.ts

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, CallRecording, CallTranscription, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { Creator, Participant } from '@/components/ParticipantsDialog';
import { TranscriptionFile, TranscriptionSegment } from '@/components/TranscriptionDialog';

// Types
export interface CustomData {
  creator: Creator;
  participants: Participant[];
}

export interface CallWithData {
  call: Call;
  recordings: CallRecording[];
  transcriptions: TranscriptionFile[];
  custom?: CustomData;
}

/**
 * Process transcriptions to ensure they have session_id
 */
function processTranscriptions(
  transcriptions: CallTranscription[], 
  recordings: CallRecording[]
): TranscriptionFile[] {
  return transcriptions.map(t => {
    if ('session_id' in t) {
      return t as TranscriptionFile;
    } else {
      // Find matching recording by timestamp
      const matchingRecording = recordings.find(r => 
        r.start_time && 'start_time' in t && 
        new Date(r.start_time).getTime() === new Date(t.start_time as string).getTime()
      );
      
      return {
        ...t,
        session_id: matchingRecording?.session_id || 'unknown'
      } as TranscriptionFile;
    }
  });
}

/**
 * Custom hook to fetch recordings and calls from Stream Video API
 */
export const useRecordings = () => {
  const client = useStreamVideoClient();
  const { user } = useUser();
  const [callsWithData, setCallsWithData] = useState<CallWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // New state for useGetCalls functionality
  const [calls, setCalls] = useState<Call[]>([]);
  const [endedCalls, setEndedCalls] = useState<Call[]>([]);
  const [upcomingCalls, setUpcomingCalls] = useState<Call[]>([]);
  const [callRecordings, setCallRecordings] = useState<Call[]>([]);

  /**
   * Fetch transcription content
   */
  const fetchTranscriptionData = async (transcriptionUrl: string): Promise<TranscriptionSegment[]> => {
    try {
      const response = await fetch(transcriptionUrl);
      const text = await response.text();
      
      try {
        // Try parsing as a single JSON array
        const jsonArray = JSON.parse(text);
        if (Array.isArray(jsonArray)) {
          return jsonArray as TranscriptionSegment[];
        }
      } catch (jsonError) {
        // If not a JSON array, try alternative formats
        
        // Try parsing as space-separated JSON objects
        const jsonObjects = text.trim().split(/\s+(?=\{)/);
        if (jsonObjects.length > 1) {
          const parsedObjects = jsonObjects
            .map(obj => {
              try {
                return JSON.parse(obj.trim()) as TranscriptionSegment;
              } catch (e) {
                return null;
              }
            })
            .filter((obj): obj is TranscriptionSegment => obj !== null);
          
          if (parsedObjects.length > 0) {
            return parsedObjects;
          }
        }
        
        // Try JSONL format
        const lines = text.split('\n').filter(line => line.trim());
        const parsedLines = lines
          .map(line => {
            try {
              return JSON.parse(line) as TranscriptionSegment;
            } catch (e) {
              return null;
            }
          })
          .filter((obj): obj is TranscriptionSegment => obj !== null);
        
        return parsedLines;
      }
      
      return [];
    } catch (error) {
      setError("Failed to load transcription data");
      return [];
    }
  };

  /**
   * Fetch recordings for the current user
   */
  const fetchRecordings = useCallback(async () => {
    if (!client || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Query calls with filters for user's calls
      const { calls } = await client.queryCalls({
        limit: 25,
        filter_conditions: {
          $or: [
            { created_by_user_id: user.id },
            { members: { $in: [user.id] } },
          ],
        },
      });
      console.log('Fetched calls:', calls);
      // 2 & 3. Get recording calls and transcriptions in parallel
      const callsWithRecordingsAndTranscriptions: {
        call: Call;
        recordings: CallRecording[];
        transcriptions: CallTranscription[];
      }[] = [];

      for (const call of calls) {
        try {
          const [recordingsResponse, transcriptionsResponse] = await Promise.all([
            call.queryRecordings(),
            call.queryTranscriptions()
          ]);
          
          // Only include calls that have recordings
          if (recordingsResponse?.recordings && recordingsResponse.recordings.length > 0) {
            callsWithRecordingsAndTranscriptions.push({
              call,
              recordings: recordingsResponse.recordings,
              // Transcriptions are optional
              transcriptions: transcriptionsResponse?.transcriptions || []
            });
          }
        } catch (err) {
          // Skip calls with errors
        }
      }

      console.log('Calls with recordings and transcriptions:', callsWithRecordingsAndTranscriptions);
      
      // 4. Process calls with recordings and extract custom data
      const finalResults: CallWithData[] = [];

      for (const callData of callsWithRecordingsAndTranscriptions) {
        try {
          // Access custom data correctly from call.state.custom
          const customData = callData.call.state?.custom as CustomData | undefined;
          
          // Process transcriptions
          const processedTranscriptions = processTranscriptions(
            callData.transcriptions,
            callData.recordings
          );
          
          finalResults.push({
            call: callData.call,
            recordings: callData.recordings,
            transcriptions: processedTranscriptions,
            custom: customData
          });

          console.log("finalResults:", finalResults);
        } catch (err) {
          // Still add the call even if we couldn't process custom data
          const processedTranscriptions = processTranscriptions(
            callData.transcriptions,
            callData.recordings
          );
          
          finalResults.push({
            call: callData.call,
            recordings: callData.recordings,
            transcriptions: processedTranscriptions,
            custom: undefined
          });
        }
      }
      
      // Process calls for useGetCalls functionality
      setCalls(calls);
      
      // Filter for ended and upcoming calls
      const now = new Date();
      const ended = calls.filter(({ state: { startsAt, endedAt } }) => {
        return (startsAt && new Date(startsAt) < now) || !!endedAt;
      });
      
      const upcoming = calls.filter(({ state: { startsAt, endedAt } }) => {
        return startsAt && new Date(startsAt) > now && !endedAt;
      });
      
      // Set the new states
      console.log("Ended calls:", ended);
      setEndedCalls(ended);
      setUpcomingCalls(upcoming);
      
      // Find calls with recordings
      const recordingCalls = calls.filter(call => {
        // Check if this call has recordings in our processed data
        return callsWithRecordingsAndTranscriptions.some(data => 
          data.call.id === call.id && data.recordings && data.recordings.length > 0
        );
      });
      setCallRecordings(recordingCalls);
      
      // Set the calls with data
      setCallsWithData(finalResults);
      setLastRefresh(new Date());
    } catch (err) {
      setError("Failed to load recordings. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [client, user]);

  // Load recordings when component mounts or dependencies change
  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  return { 
    // Original useRecordings return values
    callsWithData, 
    loading, 
    error, 
    lastRefresh,
    refreshRecordings: fetchRecordings,
    fetchTranscriptionData,
    
    // New useGetCalls return values
    calls,
    endedCalls, 
    upcomingCalls, 
    callRecordings, 
    refreshCalls: fetchRecordings
  };
};

export default useRecordings;