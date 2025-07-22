"use client";
import React, { useEffect, useRef } from "react";
import { formatTimestamp } from "@/hooks/formatTimestamp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TranscriptionSegment {
  speaker_id: string;
  type: string;
  text: string;
  start_ts: number;
  stop_ts: number;
}

export interface TranscriptionFile {
  filename: string;
  url: string;
  start_time: string;
  end_time: string;
  session_id: string;
}

export interface TranscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcriptionData: TranscriptionSegment[];
  transcriptionInfo: TranscriptionFile | null;
  transcriptionLoading: boolean;
}

const TranscriptionDialog: React.FC<TranscriptionDialogProps> = ({
  open,
  onOpenChange,
  transcriptionData = [],
  transcriptionInfo = null,
  transcriptionLoading = false,
}) => {
  const referenceTime = transcriptionInfo?.start_time;

  useEffect(() => {
    if (open) {
      // Use a small timeout to ensure the DOM has updated
      setTimeout(() => {
        // Find all scroll containers in the dialog
        const scrollContainers = document.querySelectorAll(
          ".scroll-view[data-radix-scroll-area-viewport]"
        );
        scrollContainers.forEach((container) => {
          if (container instanceof HTMLElement) {
            container.scrollTop = 0;
          }
        });
      }, 100);
    }
  }, [open, transcriptionInfo?.session_id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-white max-h-[90vh] flex flex-col overflow-hidden max-w-[90vw] w-full">
        <DialogHeader className="px-2 pt-4 pb-2">
          <DialogTitle className="text-white text-center">
            Transcription
            {transcriptionInfo?.filename && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block mt-1 text-sm text-gray-400 font-normal truncate max-w-full">
                      {transcriptionInfo.filename}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{transcriptionInfo.filename}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[50vh] w-full">
            <div className="px-4 pb-4">
              {transcriptionLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : transcriptionData.length > 0 ? (
                <div className="space-y-4">
                  {transcriptionData.map((segment, index) => (
                    <div
                      key={`${
                        transcriptionInfo?.session_id || "segment"
                      }-${index}`}
                      className="border-b border-slate-700 pb-2"
                    >
                      <div className="flex flex-col text-sm text-gray-400 mb-1">
                        <span className="font-medium truncate w-full">
                          {segment.speaker_id || "Unknown"}
                          {segment.type && (
                            <span className="ml-2 text-xs opacity-70">
                              ({segment.type})
                            </span>
                          )}
                        </span>
                        {segment.start_ts !== undefined && (
                          <span className="text-xs">
                            {formatTimestamp(segment.start_ts, referenceTime)}
                            {segment.stop_ts !== undefined &&
                              ` - ${formatTimestamp(
                                segment.stop_ts,
                                referenceTime
                              )}`}
                          </span>
                        )}
                      </div>
                      <p className="text-white break-words text-sm">
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  No transcription content available
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-4 py-3 border-t border-slate-800 mt-auto">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptionDialog;
