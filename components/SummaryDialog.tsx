"use client";

import React from 'react';
import { MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  isLoading: boolean;
  recordingId: string;
  onChatClick: () => void;
}

const SummaryDialog: React.FC<SummaryDialogProps> = ({
  open,
  onOpenChange,
  content,
  isLoading,
  recordingId,
  onChatClick
}) => {
  // Function to format the summary content with proper styling
  const formatSummaryContent = (content: string) => {
    if (!content) return null;
    
    // Split the content by sections (assuming they're separated by ###)
    const sections = content.split(/(?=###)/g);
    
    return (
      <div className="space-y-6">
        {sections.map((section, index) => {
          // Process section title and content
          const sectionMatch = section.match(/^###\s*(.*?):\s*([\s\S]*)/);
          
          if (sectionMatch) {
            const [, title, sectionContent] = sectionMatch;
            
            // Process bullet points (lines starting with -)
            const bulletPoints = sectionContent
              .split('\n')
              .map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('-')) {
                  return (
                    <li key={i} className="ml-4 list-disc text-gray-200">
                      {trimmed.substring(1).trim()}
                    </li>
                  );
                }
                return trimmed ? <p key={i} className="text-gray-200">{trimmed}</p> : null;
              })
              .filter(Boolean);
              
            return (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-400">{title}</h3>
                <ul className="space-y-1">
                  {bulletPoints}
                </ul>
              </div>
            );
          }
          
          // If no section formatting, just return the content
          return (
            <div key={index} className="text-gray-200">
              {section}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="bg-blue-600 p-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-circuit"><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5Z"/><path d="M16 8V5c0-1.1.9-2 2-2"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/><path d="M20.5 8a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/><path d="M16.5 13a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/><path d="M20.5 21a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/><path d="M18.5 3a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/></svg>
            </span>
            <span>AI Summary</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] py-2 px-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-gray-400">Generating summary...</p>
            </div>
          ) : content ? (
            formatSummaryContent(content)
          ) : (
            <div className="text-center text-gray-400 py-4">
              No summary available
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
          <Button
            variant="outline"
            className="sm:order-1 w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-800"
            onClick={onChatClick}
          >
            <MessageSquare className="h-4 w-4" />
            Chat with AI about this
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto border-[#24294D] bg-[#1E2655] hover:bg-[#2A3A6A] text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryDialog;