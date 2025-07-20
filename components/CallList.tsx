"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import Loader from "./Loader";
import MeetingCard from "./MeetingCard";
import { Button } from "./ui/button";
import TranscriptionDialog, { TranscriptionSegment, TranscriptionFile } from '@/components/TranscriptionDialog';

// Import the useRecordings hook instead of useGetCalls
import { useRecordings } from '@/hooks/useRecordings';

// Import UserDetails type from MeetingCard to ensure compatibility
import type { UserDetails } from '@/components/MeetingCard';

// Define a type for enhanced recording
interface EnhancedRecording {
  uniqueId: string;
  filename: string;
  url: string;
  start_time: string | Date;
  session_id: string;
  hasTranscriptions: boolean;
  transcriptions: TranscriptionFile[];
}

// Helper function to convert types - returns UserDetails or undefined (not null)
const convertToUserDetails = (item: any): UserDetails | undefined => {
  if (!item) return undefined;
  
  return {
    user_id: item.user_id || item.id,
    name: item.name,
    email: item.email,
    image_url: item.image_url || item.image,
    role: item.role
  };
};

// Type guard to ensure an item is a UserDetails
const isUserDetails = (item: UserDetails | undefined): item is UserDetails => {
  return item !== undefined;
};

// Helper function to safely format dates
const formatDate = (
  dateValue: Date | string | number | null | undefined
): string => {
  if (!dateValue) return "";
  try {
    if (typeof dateValue === "string") return dateValue;
    if (typeof dateValue === "number")
      return new Date(dateValue).toLocaleString();
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toLocaleString();
    }
    return String(dateValue);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

interface CallListProps {
  type: "ended" | "upcoming" | "recordings";
}

const CallList = ({ type }: CallListProps) => {
  const router = useRouter();
  
  // Use the updated useRecordings hook that includes all functionality
  const { 
    callsWithData, 
    endedCalls, 
    upcomingCalls, 
    loading, 
    error, 
    refreshRecordings, 
    fetchTranscriptionData,
    refreshCalls
  } = useRecordings();
  
  // State for processed recordings
  const [processedRecordings, setProcessedRecordings] = useState<EnhancedRecording[]>([]);
  
  // Transcription dialog states
  const [transcriptionDialogOpen, setTranscriptionDialogOpen] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionSegment[]>([]);
  const [selectedTranscriptionInfo, setSelectedTranscriptionInfo] = useState<TranscriptionFile | null>(null);
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  
  // Function to handle opening transcription dialog
  const handleViewTranscript = async (transcriptionFiles: TranscriptionFile[]) => {
    if (!transcriptionFiles || transcriptionFiles.length === 0) return;
    
    setTranscriptionData([]);
    setTranscriptionLoading(true);
    setSelectedTranscriptionInfo(transcriptionFiles[0]);
    
    try {
      const transcriptionUrl = transcriptionFiles[0]?.url;
      
      if (!transcriptionUrl) {
        throw new Error("No transcription URL found");
      }
      
      // Load the data first before opening the dialog
      const parsedData = await fetchTranscriptionData(transcriptionUrl);
      setTranscriptionData(parsedData);
      
      // Only open dialog after data is loaded
      setTranscriptionDialogOpen(true);
    } catch (err) {
      console.error("Error loading transcription:", err);
      setTranscriptionData([]);
      toast.error("Failed to load transcription");
    } finally {
      setTranscriptionLoading(false);
    }
  };

  // Process recordings when callsWithData changes
  useEffect(() => {
    if (type !== "recordings" || callsWithData.length === 0) return;
    
    const enhancedRecordings: EnhancedRecording[] = [];
    
    callsWithData.forEach((callData) => {
      callData.recordings.forEach((recording, index) => {
        // Find matching transcriptions for this recording
        const matchingTranscriptions = callData.transcriptions.filter(
          t => t.session_id === recording.session_id
        );
        
        enhancedRecordings.push({
          uniqueId: `recording-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${index}`,
          filename: recording.filename || "Unnamed Recording",
          url: recording.url,
          start_time: recording.start_time || new Date(),
          session_id: recording.session_id,
          hasTranscriptions: matchingTranscriptions.length > 0,
          transcriptions: matchingTranscriptions
        });
      });
    });
    
    setProcessedRecordings(enhancedRecordings);
  }, [callsWithData, type]);

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

  // Determine which data to use based on type
  const getCalls = () => {
    switch (type) {
      case "ended":
        return endedCalls;
      case "recordings":
        return processedRecordings;
      case "upcoming":
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case "ended":
        return "No Previous Calls";
      case "upcoming":
        return "No Upcoming Calls";
      case "recordings":
        return "No Recordings";
      default:
        return "";
    }
  };

  const handleRefresh = () => {
    if (type === "recordings") {
      refreshRecordings();
    } else {
      refreshCalls();
    }
    toast.success(`Refreshing ${type}...`);
  };

  if (loading) return <Loader />;
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-white">
        <p className="text-xl text-red-400">Error loading {type}</p>
        <p>{error}</p>
        <Button onClick={handleRefresh} className="flex items-center gap-2 bg-[#0E78F9]">
          <RefreshCw size={16} />
          Try Again
        </Button>
      </div>
    );
  }

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        {calls && calls.length > 0 && (
          <p className="text-sm text-gray-400">
            Showing {calls.length} {calls.length === 1 ? type.slice(0, -1) : type}
          </p>
        )}
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="ml-auto flex items-center gap-2 text-white border-[#252A41] bg-[#252A41] hover:bg-[#323855]"
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {calls && calls.length > 0 ? (
          calls.map((item, index) => {
            // Check if this is an enhanced recording or a call
            const isRecording = 'uniqueId' in item;
            const isPreviousMeeting = type === "ended";
            
            if (isRecording) {
              // It's a recording
              const recording = item as EnhancedRecording;
              
              // Find matching call to get participants and creator
              const matchingCall = callsWithData.find(callData => 
                callData.recordings.some(r => r.session_id === recording.session_id)
              );
              
              // Convert participants with type-safe filtering
              const participants: UserDetails[] | undefined = matchingCall?.custom?.participants 
                ? matchingCall.custom.participants
                    .map(convertToUserDetails)
                    .filter(isUserDetails) // Type-safe filtering
                : undefined;
                
              // Convert creator (ensure it's UserDetails or undefined, not null)
              let creator: UserDetails | undefined = undefined;
              if (matchingCall?.custom?.creator) {
                const convertedCreator = convertToUserDetails(matchingCall.custom.creator);
                if (convertedCreator) {
                  creator = convertedCreator;
                }
              }

              return (
                <MeetingCard
                  key={recording.uniqueId}
                  icon="/icons/recordings.svg"
                  title={recording.filename}
                  date={formatDate(recording.start_time)}
                  link={recording.url}
                  buttonIcon1="/icons/play.svg"
                  buttonText="Play"
                  handleClick={() => window.open(recording.url, '_blank')}
                  participants={participants}
                  creator={creator}
                  hasTranscriptions={recording.hasTranscriptions}
                  transcriptions={recording.transcriptions}
                  onViewTranscription={() => {
                    if (recording.hasTranscriptions && recording.transcriptions.length > 0) {
                      handleViewTranscript(recording.transcriptions);
                    }
                  }}
                />
              );
            } else {
              // It's a call (ended or upcoming)
              const call = item;
              
              // For calls, extract data from call.state.custom if available
              const customData = call.state?.custom || {};
              
              // Convert participants with type-safe filtering
              const participants: UserDetails[] | undefined = customData.participants 
                ? customData.participants
                    .map(convertToUserDetails)
                    .filter(isUserDetails) // Type-safe filtering
                : undefined;
                
              // Convert creator (ensure it's UserDetails or undefined, not null)
              let creator: UserDetails | undefined = undefined;
              if (customData.creator) {
                const convertedCreator = convertToUserDetails(customData.creator);
                if (convertedCreator) {
                  creator = convertedCreator;
                }
              }
                
              // Check for end info
              const endedBy = customData.ended_by;
                
              // Calculate duration if available
              let duration: number | undefined = undefined;
              if (call.state?.startsAt && call.state?.endedAt) {
                const startDate = new Date(call.state.startsAt);
                const endDate = new Date(call.state.endedAt);
                
                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                  duration = endDate.getTime() - startDate.getTime();
                }
              }
              
              return (
                <MeetingCard
                  key={`call-${call.id}`}
                  icon={type === "ended" ? "/icons/previous.svg" : "/icons/upcoming.svg"}
                  title={customData.description || call.id || "Untitled Meeting"}
                  date={call.state?.startsAt ? formatDate(call.state.startsAt) : ""}
                  isPreviousMeeting={isPreviousMeeting}
                  link={!isPreviousMeeting ? `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call.id}` : undefined}
                  buttonText="Start"
                  handleClick={!isPreviousMeeting ? () => router.push(`/meeting/${call.id}`) : undefined}
                  participants={participants}
                  creator={creator}
                  endedBy={endedBy}
                  duration={duration}
                />
              );
            }
          })
        ) : (
          <div className="col-span-full">
            <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
            <p className="text-gray-400 mt-2">
              {type === "ended" 
                ? "Your previous meetings will appear here once you've held some meetings."
                : type === "upcoming" 
                ? "Schedule a meeting to see it listed here."
                : "Record your meetings to access them here later."}
            </p>
          </div>
        )}
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

export default CallList;