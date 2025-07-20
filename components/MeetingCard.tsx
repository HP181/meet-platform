"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FileText, Users } from "lucide-react";

// Import UI components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";


// Import types from TranscriptionDialog
import { TranscriptionFile } from "@/components/TranscriptionDialog";

// Define types
export interface UserDetails {
  user_id: string;
  name: string;
  email?: string;
  image_url?: string;
  role?: string;
}

export interface EndedByInfo {
  user_id: string;
  name: string;
  timestamp: string;
}

export interface MeetingCardProps {
  icon: string;
  title: string;
  date: string;
  link?: string;
  isPreviousMeeting?: boolean;
  buttonText?: string;
  buttonIcon1?: string;
  handleClick?: () => void;
  participants?: UserDetails[];
  creator?: UserDetails | undefined;
  endedBy?: EndedByInfo | undefined;
  duration?: number;
  hasTranscriptions?: boolean;
  transcriptions?: TranscriptionFile[];
  onViewTranscription?: () => void; // New prop for handling transcript viewing
}

const MeetingCard = ({
  icon,
  title,
  date,
  link,
  isPreviousMeeting = false,
  buttonText = "Join",
  buttonIcon1,
  handleClick,
  participants,
  creator,
  endedBy,
  duration,
  hasTranscriptions,
  transcriptions,
  onViewTranscription, // Add this to component params
}: MeetingCardProps) => {
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);

  // Format duration if available
  const formattedDuration = duration
    ? formatDuration(duration)
    : undefined;

  // Handler for participants dialog
  const handleViewParticipants = (e: React.MouseEvent) => {
    e.stopPropagation();
    setParticipantsDialogOpen(true);
  };

  // Handler for transcript viewing
  const handleViewTranscript = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewTranscription) {
      onViewTranscription();
    }
  };

  return (
    <div className="flex flex-col rounded-lg bg-[#161A2F] overflow-hidden">
      {/* Card header */}
      <div className="p-4 border-b border-[#252A41]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={icon}
              alt="Icon"
              width={36}
              height={36}
              className="object-contain"
            />
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400">{date}</p>
            </div>
          </div>
          
          {/* Badges section */}
          <div className="flex gap-2">
            {hasTranscriptions && (
              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                Transcription
              </Badge>
            )}
            
            {participants && participants.length > 0 && (
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                {participants.length} <Users className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex-1">
        {/* Meeting duration if available */}
        {formattedDuration && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Duration: <span className="text-white">{formattedDuration}</span>
            </p>
          </div>
        )}
        
        {/* Ended by info if available */}
        {endedBy && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Ended by: <span className="text-white">{endedBy.name}</span>
            </p>
          </div>
        )}
        
        {/* Participants section */}
        <div className="mt-3">
          <p className="text-gray-400 text-sm mb-2">Participants</p>
          <div className="flex -space-x-2 overflow-hidden">
            {/* Creator */}
            {creator && (
              <Avatar className="border-2 border-[#161A2F]">
                {creator.image_url ? (
                  <AvatarImage src={creator.image_url} alt={creator.name} />
                ) : (
                  <AvatarFallback className="bg-purple-600">
                    {creator.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
            )}
            
            {/* Other participants */}
            {participants && 
              participants
                .filter(p => !creator || p.user_id !== creator.user_id)
                .slice(0, 3)
                .map((participant, i) => (
                  <Avatar key={i} className="border-2 border-[#161A2F]">
                    {participant.image_url ? (
                      <AvatarImage src={participant.image_url} alt={participant.name} />
                    ) : (
                      <AvatarFallback className="bg-blue-600">
                        {participant.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}
                
            {/* Show more indicator if there are more participants */}
            {participants && participants.length > 4 && (
              <Avatar className="border-2 border-[#161A2F] bg-gray-700">
                <AvatarFallback>+{participants.length - 4}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>

      {/* Card footer with actions */}
      <div className="p-4 pt-2 border-t border-[#252A41] space-y-2">
        {/* Primary action button */}
        {!isPreviousMeeting && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            onClick={handleClick}
          >
            {buttonIcon1 && (
              <Image
                src={buttonIcon1}
                alt="Button icon"
                width={16}
                height={16}
                className="object-contain"
              />
            )}
            {buttonText}
          </Button>
        )}
        
        {/* View participants button */}
        <Button 
          variant="outline"
          className="w-full border-[#24294D] bg-[#1E2655] hover:bg-[#2A3A6A] hover:text-white text-white flex items-center justify-center gap-2"
          onClick={handleViewParticipants}
        >
          <Users className="h-5 w-5" />
          View Participants
        </Button>
        
        {/* View transcription button - only show if transcriptions are available */}
        {hasTranscriptions && onViewTranscription && (
          <Button 
            variant="outline"
            className="w-full border-[#24294D] bg-[#1E2655] hover:bg-[#2A3A6A] hover:text-white text-white flex items-center justify-center gap-2"
            onClick={handleViewTranscript}
          >
            <FileText className="h-5 w-5" />
            View Transcript
          </Button>
        )}
      </div>

      {/* Participants Dialog */}
      <Dialog open={participantsDialogOpen} onOpenChange={setParticipantsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Participants</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {/* Show creator with special badge */}
            {creator && (
              <div className="mb-4 border-b border-slate-700 pb-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {creator.image_url ? (
                      <AvatarImage src={creator.image_url} alt={creator.name || 'Creator'} />
                    ) : (
                      <AvatarFallback className="bg-purple-600">
                        {creator.name?.charAt(0) || creator.user_id?.charAt(0) || 'C'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center text-white">
                      {creator.name || creator.user_id || 'Call Creator'}
                      <Badge variant="secondary" className="ml-2 bg-purple-600 hover:bg-purple-700">
                        Creator
                      </Badge>
                    </div>
                    {creator.email && <div className="text-sm text-gray-400">{creator.email}</div>}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {participants && participants.length > 0 ? (
                participants
                  .filter(p => !creator || p.user_id !== creator.user_id) // Filter out creator if shown separately
                  .map((participant, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Avatar>
                      {participant.image_url ? (
                        <AvatarImage src={participant.image_url} alt={participant.name || 'User'} />
                      ) : (
                        <AvatarFallback className="bg-blue-600">
                          {participant.name?.charAt(0) || participant.user_id?.charAt(0) || '?'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium text-white">{participant.name || participant.user_id || 'Unknown User'}</div>
                      <div className="text-sm text-gray-400">{participant.role || 'participant'}</div>
                      {participant.email && <div className="text-sm text-gray-400">{participant.email}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-4">No other participants found</div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button 
              onClick={() => setParticipantsDialogOpen(false)} 
              className="w-full bg-slate-800 hover:bg-slate-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to format duration in a human-readable way
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default MeetingCard;