"use client";
import React from 'react';
import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Types
export interface Participant {
  role: string;
  email: string;
  user_id: string;
  image_url: string;
  name: string;
}

export interface Creator {
  user_id: string;
  image_url: string;
  name: string;
  role: string;
  email: string;
}

export interface ParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  creator: Creator | null;
}

const ParticipantsDialog: React.FC<ParticipantsDialogProps> = ({ 
  open, 
  onOpenChange, 
  participants = [], 
  creator = null 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

export default ParticipantsDialog;