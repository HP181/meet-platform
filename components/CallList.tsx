"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, FileText, BrainCircuit, MessageSquare } from "lucide-react";

import Loader from "./Loader";
import MeetingCard from "./MeetingCard";
import { Button } from "./ui/button";
import TranscriptionDialog, { TranscriptionSegment, TranscriptionFile } from '@/components/TranscriptionDialog';
import SummaryDialog from '@/components/SummaryDialog'; // New component for summary

// Import the useRecordings hook
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
  
  // Use the useRecordings hook
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
  
  // Summary dialog states
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [currentRecordingId, setCurrentRecordingId] = useState<string>("");
  
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
  
  // Function to handle generating summary
  const handleGenerateSummary = async (transcriptionFiles: TranscriptionFile[], recordingId: string) => {
    if (!transcriptionFiles || transcriptionFiles.length === 0) return;
    
    setSummaryLoading(true);
    setCurrentRecordingId(recordingId);
    setSummaryDialogOpen(true);
    
    try {
      // First check if summary already exists in database
      const summaryResponse = await fetch(`/api/summary/${recordingId}`);
      
      if (summaryResponse.ok) {
        // Summary exists, use it
        const data = await summaryResponse.json();
        setSummaryContent(data.content);
        setSummaryLoading(false);
        return;
      }
      
      // Summary doesn't exist, need to generate it
      const transcriptionUrl = transcriptionFiles[0]?.url;
      
      if (!transcriptionUrl) {
        throw new Error("No transcription URL found");
      }
      
      // Load the transcription data
      const parsedData = await fetchTranscriptionData(transcriptionUrl);
      
      // Convert transcription segments to a text format for the AI
      const transcriptText = parsedData
        .map(segment => `${segment.speaker_id || 'Speaker'}: ${segment.text}`)
        .join('\n');
      
      // Send to AI API to generate summary
      const aiResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptText,
          recordingId,
          sessionId: transcriptionFiles[0].session_id,
          filename: transcriptionFiles[0].filename
        }),
      });
      
      if (!aiResponse.ok) {
        throw new Error("Failed to generate summary");
      }
      
      const summaryData = await aiResponse.json();
      setSummaryContent(summaryData.summary);
      
    } catch (err) {
      console.error("Error generating summary:", err);
      setSummaryContent("Failed to generate summary. Please try again later.");
      toast.error("Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // Function to navigate to chat page
  const handleNavigateToChat = (transcriptionFiles: TranscriptionFile[], recordingId: string) => {
    // Store necessary info in localStorage for the chat page
    localStorage.setItem('currentRecordingId', recordingId);
    localStorage.setItem('transcriptionUrl', transcriptionFiles[0]?.url || '');
    localStorage.setItem('recordingName', transcriptionFiles[0]?.filename || 'Recording');
    
    // Navigate to chat page
    router.push(`/chat/${recordingId}`);
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

  // Reset summary data when dialog closes
  useEffect(() => {
    if (!summaryDialogOpen) {
      const timer = setTimeout(() => {
        setSummaryContent("");
        setCurrentRecordingId("");
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [summaryDialogOpen]);

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
console.log("recording", recording);
              return (
                <div key={recording.uniqueId} className="flex flex-col">
                  <MeetingCard
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
                  
                  {/* Add AI buttons only for recordings with transcriptions */}
                  {recording.hasTranscriptions && recording.transcriptions.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2 bg-[#1E2655] hover:bg-[#2A3A6A] border-[#24294D] text-white"
                        onClick={() => handleGenerateSummary(recording.transcriptions, recording.session_id)}
                      >
                        <BrainCircuit className="h-4 w-4" />
                        Summary
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2 bg-[#1E2655] hover:bg-[#2A3A6A] border-[#24294D] text-white"
                        onClick={() => handleNavigateToChat(recording.transcriptions, recording.session_id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat with AI
                      </Button>
                    </div>
                  )}
                </div>
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
      
      {/* Summary Dialog */}
      <SummaryDialog
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
        content={summaryContent}
        isLoading={summaryLoading}
        recordingId={currentRecordingId}
        onChatClick={() => {
          setSummaryDialogOpen(false);
          if (selectedTranscriptionInfo) {
            handleNavigateToChat(
              [selectedTranscriptionInfo], 
              currentRecordingId
            );
          }
        }}
      />
    </div>
  );
};

export default CallList;