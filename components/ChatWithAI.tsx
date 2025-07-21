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
  recordingMetadata?: {
    recordingFilename: string;
    recordingUrl: string;
    transcriptFilename: string;
    transcriptUrl: string;
  };
}

const ChatWithAI = () => {
  const params = useParams();
  const uniqueId = params.recordingId as string;
  const router = useRouter();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingName, setRecordingName] = useState<string>('');
  const [initializing, setInitializing] = useState(true);
  const [textareaHeight, setTextareaHeight] = useState(38); // Default height
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Load recording info and chat history
  useEffect(() => {
    const fetchData = async () => {
      setInitializing(true);
      console.log('Initializing chat with recording ID:', uniqueId);
      
      try {
        // Get recording name from localStorage as a fallback
        const storedName = localStorage.getItem('recordingName');
        console.log('Stored recording name from localStorage:', storedName);
        
        // Fetch chat history from database (includes recording metadata)
        console.log('Fetching chat history from API...');
        const historyResponse = await fetch(`/api/chat/${uniqueId}`);
        console.log('Chat history API response status:', historyResponse.status);
        
        if (historyResponse.ok) {
          const historyData: ChatHistory = await historyResponse.json();
          console.log('Chat history data received:', historyData);
          
          // Set recording name from metadata if available
          if (historyData.recordingMetadata?.recordingFilename) {
            console.log('Using recording name from metadata:', historyData.recordingMetadata.recordingFilename);
            setRecordingName(historyData.recordingMetadata.recordingFilename);
          } else {
            console.log('Using fallback recording name:', storedName || 'Recording');
            setRecordingName(storedName || 'Recording');
          }
          
          if (historyData.messages && historyData.messages.length > 0) {
            console.log(`Loading ${historyData.messages.length} existing messages from history`);
            setMessages(historyData.messages);
          } else {
            console.log('No existing messages, creating initial greeting');
            // Add initial AI greeting if no history
            setMessages([
              {
                id: 'initial-message',
                role: 'assistant',
                content: `Hello! I'm your AI assistant. I have access to the transcript and summary of "${historyData.recordingMetadata?.recordingFilename || storedName || 'this recording'}". How can I help you with information from this recording?`,
                createdAt: new Date()
              }
            ]);
          }
        } else {
          console.warn('Failed to fetch chat history:', historyResponse.status, historyResponse.statusText);
          // If we can't get chat history, use localStorage name as fallback
          setRecordingName(storedName || 'Recording');
          
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
        
        // Use fallback greeting
        console.log('Using fallback initialization due to error');
        setRecordingName(localStorage.getItem('recordingName') || 'Recording');
        setMessages([
          {
            id: 'initial-message',
            role: 'assistant',
            content: `Hello! I'm your AI assistant. How can I help you with information from this recording?`,
            createdAt: new Date()
          }
        ]);
      } finally {
        setInitializing(false);
        console.log('Chat initialization completed');
      }
    };
    
    if (uniqueId) {
      fetchData();
    } else {
      console.error('No recording ID provided');
      toast.error('Missing recording ID');
    }
  }, [uniqueId]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      // Reset height to calculate the actual height needed
      inputRef.current.style.height = 'auto';
      // Set the height based on the scrollHeight (content height)
      const newHeight = Math.min(Math.max(38, inputRef.current.scrollHeight), 150); // min 38px, max 150px
      inputRef.current.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
    }
  }, [input]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    console.log('Sending message:', input);
    console.log('Recording ID:', uniqueId);
    
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
      console.log('Preparing API request with:', {
        message: input,
        uniqueId,
        previousMessagesCount: messages.length
      });
      
      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          uniqueId,
          previousMessages: messages
        }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to get response: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response data received:', data);
      
      if (!data || !data.reply) {
        console.error('Invalid API response format:', data);
        throw new Error('Received invalid response format from API');
      }
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: data.reply,
        role: 'assistant',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      console.log('AI response added to messages');
    } catch (error) {
      console.error('Error sending message:', error);
      // More detailed error message
      let errorMessage = 'Failed to get response from AI';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
        console.error('Error details:', error.stack);
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      // Focus input field after sending
      inputRef.current?.focus();
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = '38px';
        setTextareaHeight(38);
      }
      console.log('Message sending process completed');
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
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="flex items-center p-3 border-b border-slate-800 bg-slate-950 z-10">
        <Link href="/recordings" className="mr-2">
          <Button variant="ghost" size="icon" className="text-white h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-base sm:text-lg font-bold truncate flex-1 pr-2">{recordingName}</h1>
      </div>
      
      {/* Chat container - Fills available space and scrolls */}
      <div 
        className="flex-1 overflow-hidden pb-2" 
        style={{ height: `calc(100vh - ${textareaHeight + 80}px)` }}
        ref={scrollAreaRef}
      >
        {initializing ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <ScrollArea className="h-full px-2 sm:px-4 py-4">
            <div className="flex flex-col space-y-3 max-w-3xl mx-auto pb-2">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`flex max-w-[85%] sm:max-w-[75%] ${
                      message.role === 'user' 
                        ? 'bg-blue-600 rounded-l-lg rounded-tr-lg' 
                        : 'bg-slate-800 rounded-r-lg rounded-tl-lg'
                    } p-2 sm:p-3`}
                  >
                    <div className="whitespace-pre-wrap text-sm sm:text-base break-words">{message.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>
      
      {/* Input area - Fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 z-10 px-2 sm:px-4 pb-2 pt-1 bg-slate-950">
        <Card className="bg-slate-900 border-slate-800 max-w-3xl mx-auto">
          <div className="flex items-end p-2">
            <textarea
              ref={inputRef}
              className="flex-1 bg-transparent border-0 resize-none focus:ring-0 outline-none placeholder:text-gray-500 text-white text-sm sm:text-base py-1.5 min-h-[38px]"
              placeholder="Ask a question about this recording..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <Button 
              onClick={handleSendMessage} 
              className={`ml-2 rounded-full p-2 h-8 w-8 flex items-center justify-center ${isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatWithAI;