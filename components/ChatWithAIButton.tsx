"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatButtonProps {
  recordingId?: string;
  recordingData: {
    name: string;
    url: string;
    transcriptUrl?: string;
    sessionId?: string;
  };
}

const ChatWithAIButton: React.FC<ChatButtonProps> = ({
  recordingId,
  recordingData,
}) => {
  const router = useRouter();

  const handleChatClick = async () => {
    try {
      localStorage.setItem("recordingName", recordingData.name);
      localStorage.setItem("recordingUrl", recordingData.url);

      if (recordingData.transcriptUrl) {
        localStorage.setItem("transcriptUrl", recordingData.transcriptUrl);
      }

      if (recordingData.sessionId) {
        localStorage.setItem("sessionId", recordingData.sessionId);
      } else {
        localStorage.setItem("sessionId", `session-${Date.now()}`);
      }

      let chatRecordingId = recordingId;

      if (!chatRecordingId) {
        // Create a consistent ID based on the recording URL and name
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 10);
        chatRecordingId = `recording-${timestamp}-${randomPart}-0`;
      }

      router.push(`/chat/${chatRecordingId}`);
    } catch (error) {
      console.error("Error navigating to chat:", error);
      toast.error("Failed to open chat. Please try again.");
    }
  };

  return (
    <Button
      variant="outline"
      className="border-green-900 bg-green-900/30 hover:bg-green-800 text-green-400 hover:text-green-200 flex items-center justify-center gap-2"
      onClick={handleChatClick}
    >
      <MessageSquare className="h-5 w-5" />
      <span className="truncate">Chat with AI</span>
    </Button>
  );
};

export default ChatWithAIButton;
