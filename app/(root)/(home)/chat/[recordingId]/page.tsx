"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SendHorizontal, ArrowLeft, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

interface ChatHistory {
  recordingId: string;
  messages: Message[];
}

const ChatWithAI = () => {
  const params = useParams();
  const recordingId = params.recordingId as string;
  const router = useRouter();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingName, setRecordingName] = useState<string>('');
  const [initializing, setInitializing] = useState(true);
  const [summary, setSummary] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Load recording info and chat history
  useEffect(() => {
    const fetchData = async () => {
      setInitializing(true);
      
      try {
        // Get recording name from localStorage
        const storedName = localStorage.getItem('recordingName');
        setRecordingName(storedName || 'Recording');
        
        // Get summary from database
        const summaryResponse = await fetch(`/api/summary/${recordingId}`);
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData.content);
        }
        
        // Fetch chat history from database
        const historyResponse = await fetch(`/api/chat/${recordingId}`);
        if (historyResponse.ok) {
          const historyData: ChatHistory = await historyResponse.json();
          if (historyData.messages && historyData.messages.length > 0) {
            setMessages(historyData.messages);
          } else {
            // Add initial AI greeting if no history
            setMessages([
              {
                id: 'initial-message',
                role: 'assistant',
                content: `Hello! I'm your AI assistant. I have access to the transcript and summary of "${storedName || 'this recording'}". How can I help you with information from this recording?`,
                createdAt: new Date()
              }
            ]);
          }
        } else {
          // Add initial AI greeting if no history
          setMessages([
            {
              id: 'initial-message',
              role: 'assistant',
              content: `Hello! I'm your AI assistant. I have access to the transcript and summary of "${storedName || 'this recording'}". How can I help you with information from this recording?`,
              createdAt: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
        toast.error('Failed to load chat data');
      } finally {
        setInitializing(false);
      }
    };
    
    if (recordingId) {
      fetchData();
    }
  }, [recordingId]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      createdAt: new Date()
    };
    
    // Update messages state with the user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get transcription URL from localStorage
      const transcriptionUrl = localStorage.getItem('transcriptionUrl');
      
      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          recordingId,
          transcriptionUrl,
          summary,
          previousMessages: messages
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: data.reply,
        role: 'assistant',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response from AI');
    } finally {
      setIsLoading(false);
      // Focus input field after sending
      inputRef.current?.focus();
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-screen text-white">
      {/* Header */}
      <div className="flex items-center p- border-b border-slate-800">
        <Link href="/recordings" className="mr-2">
          <Button variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold truncate">{recordingName}</h1>
      </div>
      
      {/* Chat container */}
      <div className="flex-1 overflow-hidden">
        {initializing ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <ScrollArea className="h-full  py-4">
            <div className="flex flex-col space-y-4 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`flex max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-blue-600 rounded-l-lg rounded-tr-lg' 
                        : 'bg-slate-800 rounded-r-lg rounded-tl-lg'
                    } p-3`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>
      
      {/* Input area */}
      <Card className="m-2 bg-slate-900 border-slate-800 p-0 fixed bottom-3 w-[70vw]">
        <div className="flex items-center justify-center">
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent border-0 resize-none focus:ring-0 outline-none placeholder:text-gray-500 p-2 h-full text-white"
            placeholder="Ask a question about this recording..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            style={{ maxHeight: '150px', overflow: 'auto' }}
          />
          <Button 
            onClick={handleSendMessage} 
            className={`ml-2 rounded-full  ${isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <SendHorizontal className="h-3 w-3" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ChatWithAI;