'use client';

import { useState, useEffect } from 'react';
import {
  useCall,
  useCallStateHooks,
  // Call,
  CallTranscriptionReadyEvent,
} from '@stream-io/video-react-sdk';

interface StreamTranscription {
  filename: string;
  url: string;
  session_id?: string;
  created_at_date?: Date;
}

const TranscriptionViewer = () => {
  const [transcriptions, setTranscriptions] = useState<StreamTranscription[]>([]);
  const [loading, setLoading] = useState(false);
  const call = useCall();
  const { useIsCallTranscribingInProgress } = useCallStateHooks();
  const isTranscribing = useIsCallTranscribingInProgress();

  // Fetch transcriptions
  const fetchTranscriptions = async () => {
    if (!call) return;

    try {
      setLoading(true);
      const result = await call.queryTranscriptions();

      const processedTranscriptions = (result?.transcriptions || []).map(
        (transcription: { filename: string; url: string; session_id?: string }): StreamTranscription => {
          let created_at_date = new Date();

          try {
            if (transcription.filename) {
              const matches = transcription.filename.match(/(\d{4}-\d{2}-\d{2})/);
              if (matches && matches[1]) {
                created_at_date = new Date(matches[1]);
              }
            }
          } catch (e) {
            console.error('Error parsing date from filename:', e);
          }

          return {
            ...transcription,
            created_at_date,
          };
        }
      );

      setTranscriptions(processedTranscriptions);
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleTranscriptionReady = (event: CallTranscriptionReadyEvent) => {
      console.log('Transcription ready event received:', event);
      fetchTranscriptions();
    };

    if (call) {
      call.on('call.transcription_ready', handleTranscriptionReady);
      fetchTranscriptions();
    }

    return () => {
      if (call) {
        call.off('call.transcription_ready', handleTranscriptionReady);
      }
    };
  }, [call]);

  return (
    <div className="bg-[#1a1a1a] text-white p-4 rounded-lg max-h-60 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-2">Transcriptions</h3>

      {loading && <p>Loading transcriptions...</p>}

      {isTranscribing && (
        <div className="mb-4">
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Live</span>
          <span className="ml-2 text-sm">Transcription in progress...</span>
        </div>
      )}

      {transcriptions.length > 0 ? (
        <ul className="space-y-2">
          {transcriptions.map((transcript, index) => (
            <li key={index} className="border-b border-gray-700 pb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{transcript.created_at_date?.toLocaleString() || 'Unknown date'}</span>
                <a
                  href={transcript.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Download
                </a>
              </div>
              <div>{transcript.filename}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No transcriptions available yet.</p>
      )}

      <div className="mt-4">
        <button
          onClick={fetchTranscriptions}
          className="text-sm bg-[#333] hover:bg-[#444] px-3 py-1 rounded"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default TranscriptionViewer;
