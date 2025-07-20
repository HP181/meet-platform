"use client";
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Import components
import MeetingCard from '@/components/MeetingCard';
import TranscriptionDialog, { TranscriptionSegment, TranscriptionFile } from '@/components/TranscriptionDialog';
import Loader from '@/components/Loader';

// Import custom hooks
import { useRecordings } from '@/hooks/useRecordings';

// Import shadcn components
import { Button } from "@/components/ui/button";

// Helper function to convert types - ensure it never returns undefined
const convertToUserDetails = (item: any): MeetingCard.UserDetails | null => {
  if (!item) return null;
  
  return {
    user_id: item.user_id,
    name: item.name || item.user_id,
    email: item.email,
    image_url: item.image_url,
    role: item.role
  };
};

const RecordingsPage: React.FC = () => {
  const { callsWithData, loading, error, refreshRecordings, fetchTranscriptionData } = useRecordings();
  
  // Transcription states
  const [transcriptionDialogOpen, setTranscriptionDialogOpen] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionSegment[]>([]);
  const [selectedTranscriptionInfo, setSelectedTranscriptionInfo] = useState<TranscriptionFile | null>(null);
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  
  // Function to handle transcription viewing
  const handleViewTranscript = async (transcriptionFiles: TranscriptionFile[]) => {
    if (!transcriptionFiles || transcriptionFiles.length === 0) return;
    
    // Clear previous data and set loading state
    setTranscriptionData([]);
    setTranscriptionLoading(true);
    setSelectedTranscriptionInfo(transcriptionFiles[0]);
    
    try {
      const transcriptionUrl = transcriptionFiles[0]?.url;
      
      if (!transcriptionUrl) {
        throw new Error("No transcription URL found");
      }
      
      // Fetch and parse transcription data
      const parsedData = await fetchTranscriptionData(transcriptionUrl);
      
      // Update state with new data and open dialog
      setTranscriptionData(parsedData);
      setTranscriptionDialogOpen(true);
    } catch (err) {
      console.error("Error loading transcription:", err);
      setTranscriptionData([]);
      toast.error("Failed to load transcription");
    } finally {
      setTranscriptionLoading(false);
    }
  };
  
  // Reset data when dialog closes
  useEffect(() => {
    if (!transcriptionDialogOpen) {
      const timer = setTimeout(() => {
        setTranscriptionData([]);
        setSelectedTranscriptionInfo(null);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [transcriptionDialogOpen]);
  
  // Handle refresh button click
  const handleRefresh = () => {
    refreshRecordings();
    toast.success("Refreshing recordings...");
  };

  // Loading state
  if (loading) return <Loader />;
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-white">
        <p className="text-xl text-red-400">Error loading recordings</p>
        <p>{error}</p>
        <Button onClick={handleRefresh} className="flex items-center gap-2 bg-[#0E78F9]">
          <RefreshCw size={16} />
          Try Again
        </Button>
      </div>
    );
  }
  
  // Empty state
  if (callsWithData.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-white text-3xl font-bold">Recordings</h1>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="ml-auto flex items-center gap-2 text-white border-[#252A41] bg-[#252A41] hover:bg-[#323855]"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
        
        <div className="col-span-full">
          <h1 className="text-2xl font-bold text-white">No Recordings</h1>
          <p className="text-gray-400 mt-2">
            Record your meetings to access them here later.
          </p>
        </div>
      </div>
    );
  }

  // Count all recordings across all calls
  const totalRecordings = callsWithData.reduce((count, call) => count + call.recordings.length, 0);

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-3xl font-bold">Recordings</h1>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="ml-auto flex items-center gap-2 text-white border-[#252A41] bg-[#252A41] hover:bg-[#323855]"
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">
        Showing {totalRecordings} {totalRecordings === 1 ? "recording" : "recordings"}
      </p>
      
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {callsWithData.map((callData, callIndex) => (
          callData.recordings.map((recording, recordingIndex) => {
            // Check if this recording has a transcription
            const recordingHasTranscription = callData.transcriptions && 
                                            callData.transcriptions.length > 0 &&
                                            callData.transcriptions.some(t => 
                                              t.session_id === recording.session_id
                                            );
            
            // Get matching transcription for this recording
            const matchingTranscriptions = callData.transcriptions.filter(
              t => t.session_id === recording.session_id
            );
            
            // Convert participants and creator to format needed by MeetingCard
            // Use a filter to remove any null/undefined values after conversion
            const participants = callData.custom?.participants 
              ? callData.custom.participants
                  .map(convertToUserDetails)
                  .filter((p): p is MeetingCard.UserDetails => p !== null)
              : undefined;
              
            const creator = callData.custom?.creator 
              ? convertToUserDetails(callData.custom.creator)
              : undefined;
            
            return (
              <MeetingCard
                key={`${callIndex}-${recordingIndex}`}
                icon="/icons/recordings.svg"
                title={recording.filename || "Unnamed Recording"}
                date={recording.start_time ? new Date(recording.start_time).toLocaleString() : ""}
                link={recording.url}
                buttonIcon1="/icons/play.svg"
                buttonText="Play"
                handleClick={() => window.open(recording.url, '_blank')}
                participants={participants}
                creator={creator === null ? undefined : creator}
                hasTranscriptions={recordingHasTranscription}
                transcriptions={matchingTranscriptions}
                onViewTranscription={() => {
                  if (recordingHasTranscription && matchingTranscriptions.length > 0) {
                    handleViewTranscript(matchingTranscriptions);
                  }
                }}
              />
            );
          })
        ))}
      </div>
      
      {/* Transcription Dialog */}
      <TranscriptionDialog 
        open={transcriptionDialogOpen}
        onOpenChange={setTranscriptionDialogOpen}
        transcriptionData={transcriptionData}
        transcriptionInfo={selectedTranscriptionInfo}
        transcriptionLoading={transcriptionLoading}
      />
    </div>
  );
};

export default RecordingsPage;

// Add namespace for MeetingCard types
namespace MeetingCard {
  export interface UserDetails {
    user_id: string;
    name: string;
    email?: string;
    image_url?: string;
    role?: string;
  }
}