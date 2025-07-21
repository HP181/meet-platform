"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ChatWithAI from '@/components/ChatWithAI'; // Your actual ChatWithAI component

const ChatPageHandler = () => {
  const params = useParams();
  const uniqueId = params.recordingId as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('Initializing chat page with recording ID:', uniqueId);
        
        // Check localStorage for required data
        const storedName = localStorage.getItem('recordingName');
        const storedUrl = localStorage.getItem('recordingUrl');
        const transcriptUrl = localStorage.getItem('transcriptUrl');
        const sessionId = localStorage.getItem('sessionId');
        
        console.log('Data from localStorage:', {
          name: storedName,
          url: storedUrl ? '[URL EXISTS]' : '[MISSING]',
          hasTranscript: !!transcriptUrl,
          hasSession: !!sessionId,
          sessionId: sessionId || '(none)'
        });
        
        if (!storedUrl) {
          throw new Error('Recording URL not found in local storage');
        }
        
        // First, check if the recording metadata exists
        console.log('Checking if recording metadata exists...');
        const checkResponse = await fetch(`/api/recordings/${uniqueId}/check`);
        
        if (checkResponse.ok) {
          // Recording exists, we can proceed with the chat
          console.log('Recording metadata found, proceeding with chat');
          setLoading(false);
          setInitialized(true);
        } else if (checkResponse.status === 404) {
          // Recording doesn't exist, create it
          console.log('Recording metadata not found, creating it...');
                    
          // Create recording metadata
          console.log('Creating recording metadata with:', {
            uniqueId,
            sessionId: sessionId || uniqueId,
            name: storedName,
            hasUrl: !!storedUrl,
            hasTranscriptUrl: !!transcriptUrl
          });
          
          // If sessionId is not stored, use uniqueId as sessionId
          // This is critical because in your case, uniqueId IS the sessionId
          const recordingSessionId = sessionId || uniqueId;
          
          const createResponse = await fetch('/api/recordings/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uniqueId,
              sessionId: recordingSessionId,
              recordingFilename: storedName || 'Unnamed Recording',
              recordingUrl: storedUrl,
              transcriptFilename: `transcript_${storedName || 'recording'}`,
              transcriptUrl: transcriptUrl || ''
            }),
          });
          
          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            console.error('Failed to create recording metadata:', errorData);
            throw new Error(`Failed to create recording metadata: ${errorData.error || createResponse.statusText}`);
          }
          
          console.log('Recording metadata created successfully');
          setLoading(false);
          setInitialized(true);
        } else {
          // Other error
          const errorData = await checkResponse.json().catch(() => ({}));
          console.error('Error checking recording:', errorData);
          throw new Error(`Error checking recording: ${errorData.error || checkResponse.statusText}`);
        }
      } catch (error: any) {
        console.error('Error initializing chat:', error);
        setError(error.message || 'Failed to initialize chat');
        toast.error(error.message || 'Failed to initialize chat');
        setLoading(false);
      }
    };

    if (uniqueId && !initialized) {
      initializeChat();
    } else if (!uniqueId) {
      setError('No recording ID provided');
      setLoading(false);
    }
  }, [uniqueId, initialized, router]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p>Initializing chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white p-4 text-center">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            onClick={() => router.push('/recordings')}
          >
            Return to Recordings
          </button>
        </div>
      </div>
    );
  }

  return <ChatWithAI />;
};

export default ChatPageHandler;