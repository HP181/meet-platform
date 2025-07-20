// components/CallList.tsx (updated version)

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, FileText, BrainCircuit, MessageSquare } from "lucide-react";

import Loader from "./Loader";
import MeetingCard from "./MeetingCard";
import { Button } from "./ui/button";
import TranscriptionDialog, { TranscriptionSegment, TranscriptionFile } from '@/components/TranscriptionDialog';
import SummaryDialog from '@/components/SummaryDialog';

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
  hasValidTranscription?: boolean;
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

// Function to validate transcription URL
const isValidTranscriptionUrl = (transcription: TranscriptionFile): boolean => {
  // First check if URL exists
  if (!transcription?.url) {
    return false;
  }
  
  // Check if the URL contains error indicators
  const url = transcription.url.toLowerCase();
  if (url.includes('error') || 
      url.includes('invalidkey') || 
      url.includes('unknown key')) {
    return false;
  }
  
  return true;
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
  
  // Summary dialog states
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [currentRecordingId, setCurrentRecordingId] = useState<string>("");
  
  // Function to validate transcription content
  const validateTranscriptionContent = useCallback(async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      // Check for XML error messages
      if (text.includes('<Error>') || 
          text.includes('InvalidKey') || 
          text.includes('Unknown Key')) {
        return false;
      }
      
      // Try to parse content
      let hasValidContent = false;
      
      try {
        // Try parsing as a JSON array
        const jsonArray = JSON.parse(text);
        if (Array.isArray(jsonArray) && jsonArray.length > 0) {
          // Check if first item has expected fields
          const firstItem = jsonArray[0];
          if (firstItem && firstItem.speaker_id && firstItem.text) {
            hasValidContent = true;
          }
        }
      } catch (jsonError) {
        // Try parsing as space-separated JSON objects
        const jsonObjects = text.trim().split(/\s+(?=\{)/);
        if (jsonObjects.length > 1) {
          try {
            const firstObj = JSON.parse(jsonObjects[0].trim());
            if (firstObj && firstObj.speaker_id && firstObj.text) {
              hasValidContent = true;
            }
          } catch (e) {
            // Not valid space-separated JSON
          }
        }
        
        if (!hasValidContent) {
          // Try JSONL format
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            try {
              const firstLine = JSON.parse(lines[0]);
              if (firstLine && firstLine.speaker_id && firstLine.text) {
                hasValidContent = true;
              }
            } catch (e) {
              // Not valid JSONL
            }
          }
        }
      }
      
      return hasValidContent;
    } catch (error) {
      console.error("Error validating transcription:", error);
      return false;
    }
  }, []);
  
  // Function to handle opening transcription dialog
// Updated handleViewTranscript function for CallList.tsx
// Updated handleViewTranscript function for CallList.tsx
const handleViewTranscript = async (transcriptionFiles: TranscriptionFile[]) => {
  if (!transcriptionFiles || transcriptionFiles.length === 0) return;
  
  setTranscriptionData([]);
  setTranscriptionLoading(true);
  setSelectedTranscriptionInfo(transcriptionFiles[0]);
  
  // Open dialog immediately with loading state
  setTranscriptionDialogOpen(true);
  
  try {
    const transcriptionUrl = transcriptionFiles[0]?.url;
    
    if (!transcriptionUrl) {
      // Set empty data without showing toast
      setTranscriptionData([]);
      setTranscriptionLoading(false);
      return;
    }
    
    // Check if response contains XML error messages
    const response = await fetch(transcriptionUrl);
    const text = await response.text();
    
    if (text.includes('<Error>') || 
        text.includes('InvalidKey') || 
        text.includes('Unknown Key')) {
      // Set empty data without showing toast
      setTranscriptionData([]);
      setTranscriptionLoading(false);
      return;
    }
    
    // Load the data before updating the dialog content
    const parsedData = await fetchTranscriptionData(transcriptionUrl);
    
    // Validate parsed data
    if (!parsedData || parsedData.length === 0 || 
        !parsedData[0]?.speaker_id || !parsedData[0]?.text) {
      // Set empty data without showing toast
      setTranscriptionData([]);
      setTranscriptionLoading(false);
      return;
    }
    
    // Set transcription data once loaded
    setTranscriptionData(parsedData);
    
  } catch (err) {
    console.error("Error loading transcription:", err);
    
    // Set empty data without showing toast for expected errors
    setTranscriptionData([]);
    
    // Only show toast for unexpected errors (network issues, etc.)
    if (!(err instanceof Error && 
         (err.message.includes("Transcription not available") || 
          err.message.includes("Invalid transcription format") ||
          err.message.includes("No transcription URL found")))) {
      toast.error("Failed to load transcription");
    }
  } finally {
    setTranscriptionLoading(false);
  }
};
  // Function to handle generating summary
  const handleGenerateSummary = async (recording: EnhancedRecording) => {
    if (!recording || !recording.transcriptions || recording.transcriptions.length === 0 || !recording.hasValidTranscription) return;
    
    setSummaryLoading(true);
    setCurrentRecordingId(recording.uniqueId);
    setSummaryDialogOpen(true);
    
    try {
      // First check if summary already exists in database
      const summaryResponse = await fetch(`/api/summary/${recording.uniqueId}`);
      
      if (summaryResponse.ok) {
        // Summary exists, use it
        const data = await summaryResponse.json();
        setSummaryContent(data.content);
        setSummaryLoading(false);
        return;
      }
      
      // Summary doesn't exist, need to generate it
      const transcriptionUrl = recording.transcriptions[0]?.url;
      
      if (!transcriptionUrl) {
        throw new Error("No transcription URL found");
      }
      
      // Load the transcription data
      const parsedData = await fetchTranscriptionData(transcriptionUrl);
      
      // Check if data is valid
      if (!parsedData || parsedData.length === 0) {
        throw new Error("Invalid transcription data");
      }
      
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
          uniqueId: recording.uniqueId,
          sessionId: recording.session_id,
          recordingFilename: recording.filename,
          recordingUrl: recording.url,
          transcriptFilename: recording.transcriptions[0]?.filename || 'transcript.txt',
          transcriptUrl: transcriptionUrl
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
  const handleNavigateToChat = (recording: EnhancedRecording) => {
    if (!recording.hasValidTranscription) return;
    
    // Store necessary info in localStorage for the chat page
    localStorage.setItem('currentRecordingId', recording.uniqueId);
    localStorage.setItem('transcriptionUrl', recording.transcriptions[0]?.url || '');
    localStorage.setItem('recordingName', recording.filename || 'Recording');
    
    // Navigate to chat page
    router.push(`/chat/${recording.uniqueId}`);
  };

  // Process recordings when callsWithData changes
  useEffect(() => {
    if (type !== "recordings" || callsWithData.length === 0) return;
    
    const enhancedRecordings: EnhancedRecording[] = [];
    
    callsWithData.forEach((callData, callIndex) => {
      callData.recordings.forEach((recording, recordingIndex) => {
        // Find matching transcriptions for this recording
        const matchingTranscriptions = callData.transcriptions.filter(
          t => t.session_id === recording.session_id
        );
        
        enhancedRecordings.push({
          uniqueId: `recording-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${recordingIndex}`,
          filename: recording.filename || "Unnamed Recording",
          url: recording.url,
          start_time: recording.start_time || new Date(),
          session_id: recording.session_id,
          hasTranscriptions: matchingTranscriptions.length > 0,
          transcriptions: matchingTranscriptions,
          hasValidTranscription: false // Default to false until validated
        });
      });
    });
    
    // Set the initial recordings
    setProcessedRecordings(enhancedRecordings);
    
  }, [callsWithData, type]);
  
  // Separate effect to validate transcriptions after initial rendering
  // This prevents the circular dependency that was causing infinite updates
  useEffect(() => {
    if (processedRecordings.length === 0) return;
    
    const validateRecordings = async () => {
      const validationPromises: Promise<{ index: number; isValid: boolean }>[] = [];
      
      // Prepare validation promises
      processedRecordings.forEach((recording, index) => {
        if (recording.hasTranscriptions && 
            recording.transcriptions.length > 0 && 
            isValidTranscriptionUrl(recording.transcriptions[0])) {
          validationPromises.push(
            validateTranscriptionContent(recording.transcriptions[0].url)
              .then(isValid => ({ index, isValid }))
              .catch(() => ({ index, isValid: false }))
          );
        }
      });
      
      // If no validations to run, stop here
      if (validationPromises.length === 0) return;
      
      // Process validation results
      const results = await Promise.all(validationPromises);
      
      // Create updated recordings with validation results
      const updatedRecordings = [...processedRecordings];
      let hasChanges = false;
      
      results.forEach(({ index, isValid }) => {
        if (index < updatedRecordings.length && updatedRecordings[index].hasValidTranscription !== isValid) {
          updatedRecordings[index] = {
            ...updatedRecordings[index],
            hasValidTranscription: isValid
          };
          hasChanges = true;
        }
      });
      
      // Only update state if changes were made
      if (hasChanges) {
        setProcessedRecordings(updatedRecordings);
      }
    };
    
    validateRecordings();
    
  }, [processedRecordings, validateTranscriptionContent]);

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
                
                  {/* Add AI buttons only for recordings with VALID transcriptions */}
                  {recording.hasTranscriptions && 
                   recording.transcriptions.length > 0 && 
                   recording.hasValidTranscription && (
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2 bg-[#1E2655] hover:bg-[#2A3A6A] border-[#24294D] text-white"
                        onClick={() => handleGenerateSummary(recording)}
                      >
                        <BrainCircuit className="h-4 w-4" />
                        Summary
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2 bg-[#1E2655] hover:bg-[#2A3A6A] border-[#24294D] text-white"
                        onClick={() => handleNavigateToChat(recording)}
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
          const recording = processedRecordings.find(r => r.uniqueId === currentRecordingId);
          if (recording) {
            handleNavigateToChat(recording);
          }
        }}
      />
    </div>
  );
};

export default CallList;