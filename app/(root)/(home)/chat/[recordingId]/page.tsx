// app/chat/[recordingId]/page.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import ChatPageHandler to avoid hydration issues
const ChatPageHandler = dynamic(() => import("@/components/ChatPageHandler"), {
  loading: () => (
    <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <p>Loading chat...</p>
    </div>
  ),
  ssr: false, // Disable server-side rendering for this component
});

export default function ChatPage() {
  return <ChatPageHandler />;
}
