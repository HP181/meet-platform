"use client";
import React, { useEffect } from 'react';
import { formatTimestamp } from '@/hooks/formatTimestamp';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
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
  transcriptionLoading = false
}) => {
  const referenceTime = transcriptionInfo?.start_time;
  
  // Reset scroll position when dialog opens with new data
  useEffect(() => {
    if (open) {
      // Reset scroll position when dialog opens
      const scrollArea = document.querySelector('.scroll-area');
      if (scrollArea) {
        scrollArea.scrollTop = 0;
      }
    }
  }, [open, transcriptionInfo?.session_id]);

  // Memoize the transcription content to prevent unnecessary re-renders
  const dialogContent = (
    <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-white">
      <DialogHeader>
        <DialogTitle className="text-white">
          Transcription
          {transcriptionInfo?.filename && (
            <span className="block mt-1 text-sm text-gray-400 font-normal">
              {transcriptionInfo.filename}
            </span>
          )}
        </DialogTitle>
      </DialogHeader>
      
      <ScrollArea className="max-h-[60vh] scroll-area">
        {transcriptionLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : transcriptionData.length > 0 ? (
          <div className="space-y-4">
            {transcriptionData.map((segment, index) => (
              <div key={`${transcriptionInfo?.session_id}-${index}`} className="border-b border-slate-700 pb-2">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span className="font-medium">
                    {segment.speaker_id || 'Unknown'}
                    {segment.type && <span className="ml-2 text-xs opacity-70">({segment.type})</span>}
                  </span>
                  {(segment.start_ts !== undefined) && (
                    <span>
                      {formatTimestamp(segment.start_ts, referenceTime)} 
                      {segment.stop_ts !== undefined && ` - ${formatTimestamp(segment.stop_ts, referenceTime)}`}
                    </span>
                  )}
                </div>
                <p className="text-white">{segment.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">
            No transcription content available
          </div>
        )}
      </ScrollArea>
      
      <DialogFooter>
        <Button 
          onClick={() => onOpenChange(false)} 
          className="w-full bg-slate-800 hover:bg-slate-700 text-white"
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogContent}
    </Dialog>
  );
};

export default TranscriptionDialog;