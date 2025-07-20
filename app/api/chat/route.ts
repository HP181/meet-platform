// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

export async function POST(req: NextRequest) {
  try {
    const { message, recordingId, transcriptionUrl, summary, previousMessages } = await req.json();
    
    if (!message || !recordingId) {
      return NextResponse.json(
        { error: 'Message and recordingId are required' }, 
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Prepare context from transcript and summary if available
    let context = '';
    
    // If we have a summary, use it in the context
    if (summary) {
      context += `Summary of the recording:\n${summary}\n\n`;
    }
    
    // If we have a transcription URL, fetch and add to context
    let transcript = '';
    if (transcriptionUrl) {
      try {
        const response = await fetch(transcriptionUrl);
        if (response.ok) {
          const text = await response.text();
          
          // Process the transcript (this will depend on your format)
          try {
            // Try parsing as a single JSON array
            const jsonArray = JSON.parse(text);
            if (Array.isArray(jsonArray)) {
              transcript = jsonArray
                .map(segment => `${segment.speaker_id || 'Speaker'}: ${segment.text}`)
                .join('\n');
            }
          } catch (jsonError) {
            // Try JSONL format
            const lines = text.split('\n').filter(line => line.trim());
            const parsedLines = lines
              .map(line => {
                try {
                  const data = JSON.parse(line);
                  return `${data.speaker_id || 'Speaker'}: ${data.text}`;
                } catch (e) {
                  return null;
                }
              })
              .filter(line => line !== null)
              .join('\n');
            
            if (parsedLines) {
              transcript = parsedLines;
            } else {
              // If all else fails, use the raw text
              transcript = text.substring(0, 5000); // Limit size
            }
          }
        }
      } catch (error) {
        console.error('Error fetching transcript:', error);
      }
    }
    
    if (transcript) {
      context += `Transcript of the recording:\n${transcript}\n\n`;
    }
    
    // Format previous messages for the chat
    const formattedMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant that helps users find information in meeting recordings. 
        You have access to a summary and/or transcript of a recording.
        Answer questions based only on the information provided in the context.
        If you don't know the answer based on the context, say so.
        Be concise, helpful and format your answers for readability.
        
        Context information:
        ${context}`
      }
    ];
    
    // Add previous messages to the context
    if (previousMessages && previousMessages.length > 0) {
      for (const prevMsg of previousMessages) {
        if (prevMsg.role === 'user' || prevMsg.role === 'assistant') {
          formattedMessages.push({
            role: prevMsg.role,
            content: prevMsg.content
          });
        }
      }
    }
    
    // Add the current message
    formattedMessages.push({
      role: "user",
      content: message
    });

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: formattedMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // Save the conversation to the database
    const chatHistory = await db.collection('chats').findOne({ recordingId });
    
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      role: 'user',
      createdAt: new Date()
    };
    
    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      content: reply,
      role: 'assistant',
      createdAt: new Date()
    };
    
    if (chatHistory) {
      // Update existing chat history
      await db.collection('chats').updateOne(
        { recordingId },
        { 
          $push: { 
            messages: { 
              $each: [newMessage, aiMessage] 
            } 
          },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      // Create new chat history
      await db.collection('chats').insertOne({
        recordingId,
        messages: [newMessage, aiMessage],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ reply });
    
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' }, 
      { status: 500 }
    );
  }
}