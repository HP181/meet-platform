"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FileText,
  Users,
  MessageSquare,
  Bot,
  Clock,
  Calendar,
  BrainCircuit,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { TranscriptionFile } from "@/components/TranscriptionDialog";

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
  onViewTranscription?: () => void;
  summary?: string;
  generateSummary?: () => void;
  chatWithAI?: () => void;
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
  onViewTranscription,
  summary,
  generateSummary,
  chatWithAI,
}: MeetingCardProps) => {
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const formattedDuration = duration ? formatDuration(duration) : undefined;

  const formattedDateTime = formatDateTime(date);

  const handleViewParticipants = (e: React.MouseEvent) => {
    e.stopPropagation();
    setParticipantsDialogOpen(true);
  };

  const handleViewTranscript = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewTranscription) {
      onViewTranscription();
    }
  };

  const handleSummaryGeneration = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (generateSummary) {
      generateSummary();
    }
  };

  const handleChatWithAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (chatWithAI) {
      chatWithAI();
    }
  };

  return (
    <div className="shadow shadow-blue-500 lg:shadow-none flex flex-col rounded-lg bg-[#161A2F]  overflow-hidden h-full">
      <div className="p-4 border-b border-[#252A41]">
        <div className="flex justify-between items-start">
          <div className="flex-shrink-0">
            <Image
              src={icon}
              alt="Icon"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>

          <div className="flex gap-2">
            {hasTranscriptions && (
              <Badge className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap">
                Transcription
              </Badge>
            )}

            {participants && participants.length > 0 && (
              <Badge
                variant="outline"
                className="border-blue-500 text-blue-400 whitespace-nowrap"
              >
                {participants.length} <Users className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-3">
          <div className="min-w-0 flex-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-white truncate max-w-[220px] sm:max-w-[300px]">
                    {title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center text-sm text-gray-400 gap-1 ml-4 flex-shrink-0">
            <Calendar className="h-3 w-3" />
            <span className="truncate">{formattedDateTime.date}</span>
            <Clock className="h-3 w-3 ml-2" />
            <span className="truncate">{formattedDateTime.time}</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {formattedDuration && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Duration: <span className="text-white">{formattedDuration}</span>
            </p>
          </div>
        )}

        {endedBy && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Ended by:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-white ml-1 truncate inline-block max-w-[150px] align-bottom">
                      {endedBy.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{endedBy.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-2">Participants</p>
          <div className="flex flex-wrap -space-x-2 overflow-hidden">
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

            {participants &&
              participants
                .filter((p) => !creator || p.user_id !== creator.user_id)
                .slice(0, 3)
                .map((participant, i) => (
                  <Avatar key={i} className="border-2 border-[#161A2F]">
                    {participant.image_url ? (
                      <AvatarImage
                        src={participant.image_url}
                        alt={participant.name}
                      />
                    ) : (
                      <AvatarFallback className="bg-blue-600">
                        {participant.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}

            {participants && participants.length > 4 && (
              <Avatar className="border-2 border-[#161A2F] bg-gray-700">
                <AvatarFallback>+{participants.length - 4}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>

        {summary && (
          <div className="mb-4">
            <Collapsible
              open={summaryExpanded}
              onOpenChange={setSummaryExpanded}
              className="w-full border border-[#252A41] rounded-md overflow-hidden"
            >
              <div className="bg-[#1A1E32] px-3 py-2 flex justify-between items-center">
                <h4 className="text-sm font-medium text-white">
                  Meeting Summary
                </h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-7 w-7">
                    <span className="sr-only">
                      {summaryExpanded ? "Close" : "Open"}
                    </span>
                    <span
                      className={`transition-transform ${
                        summaryExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 4L6 8L10 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="p-3 bg-[#161A2F] text-sm text-gray-300">
                  {summary}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      <div className="p-4 pt-2 border-t border-[#252A41]">
        <div className="grid grid-cols-1 gap-2">
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
              <span>{buttonText}</span>
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full border-[#24294D] bg-[#1E2655] hover:bg-[#2A3A6A] hover:text-white text-white flex items-center justify-center gap-2"
            onClick={handleViewParticipants}
          >
            <Users className="h-5 w-5" />
            <span className="truncate">View Participants</span>
          </Button>

          {hasTranscriptions && onViewTranscription && (
            <Button
              variant="outline"
              className="w-full border-[#24294D] bg-[#1E2655] hover:bg-[#2A3A6A] hover:text-white text-white flex items-center justify-center gap-2"
              onClick={handleViewTranscript}
            >
              <FileText className="h-5 w-5" />
              <span className="truncate">View Transcript</span>
            </Button>
          )}

          {/* AI buttons section - always present but conditionally rendered buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {generateSummary ? (
              <Button
                variant="outline"
                className="border-[#24294D] bg-[#1E2655] hover:bg-[#2A3A6A] hover:text-white text-white flex items-center justify-center gap-2"
                onClick={handleSummaryGeneration}
              >
                <BrainCircuit className="h-4 w-4" />
                <span className="truncate">Summary</span>
              </Button>
            ) : (
              // Placeholder div to maintain grid layout
              <div className="opacity-0 pointer-events-none"></div>
            )}

            {chatWithAI ? (
              <Button
                variant="outline"
                className="border-[#24294D] bg-[#1E2655] hover:bg-[#2A3A6A] hover:text-white text-white flex items-center justify-center gap-2"
                onClick={handleChatWithAI}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="truncate">Chat with AI</span>
              </Button>
            ) : (
              // Placeholder div to maintain grid layout
              <div className="opacity-0 pointer-events-none"></div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={participantsDialogOpen}
        onOpenChange={setParticipantsDialogOpen}
      >
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">Participants</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-auto">
            <div className="pr-4">
              {creator && (
                <div className="mb-4 border-b border-slate-700 pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {creator.image_url ? (
                        <AvatarImage
                          src={creator.image_url}
                          alt={creator.name || "Creator"}
                        />
                      ) : (
                        <AvatarFallback className="bg-purple-600">
                          {creator.name?.charAt(0) ||
                            creator.user_id?.charAt(0) ||
                            "C"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium flex items-center text-white flex-wrap gap-2">
                        <span className="truncate">
                          {creator.name || creator.user_id || "Call Creator"}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
                        >
                          Creator
                        </Badge>
                      </div>
                      {creator.email && (
                        <div className="text-sm text-gray-400 truncate">
                          {creator.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {participants && participants.length > 0 ? (
                  participants
                    .filter((p) => !creator || p.user_id !== creator.user_id)
                    .map((participant, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Avatar className="flex-shrink-0">
                          {participant.image_url ? (
                            <AvatarImage
                              src={participant.image_url}
                              alt={participant.name || "User"}
                            />
                          ) : (
                            <AvatarFallback className="bg-blue-600">
                              {participant.name?.charAt(0) ||
                                participant.user_id?.charAt(0) ||
                                "?"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="font-medium text-white truncate">
                                  {participant.name ||
                                    participant.user_id ||
                                    "Unknown User"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {participant.name ||
                                    participant.user_id ||
                                    "Unknown User"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="text-sm text-gray-400 truncate">
                            {participant.role || "participant"}
                          </div>
                          {participant.email && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm text-gray-400 truncate">
                                    {participant.email}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{participant.email}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    No other participants found
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
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

function formatDateTime(dateString: string): { date: string; time: string } {
  try {
    const date = new Date(dateString);

    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return { date: formattedDate, time: formattedTime };
  } catch (error) {
    return { date: dateString, time: "" };
  }
}

export default MeetingCard;
