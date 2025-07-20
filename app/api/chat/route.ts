// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { RecordingMetadata, Chat, Summary, createMessage, IMessage } from '@/models';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { 
      message, 
      uniqueId, 
      previousMessages = [] 
    } = await req.json();
    
    if (!message || !uniqueId) {
      return NextResponse.json(
        { error: 'Message and uniqueId are required' }, 
        { status: 400 }
      );
    }

    // Connect to MongoDB via Mongoose
    await connectToDatabase();
    
    // Get recording metadata
    const recordingMetadata = await RecordingMetadata.findOne({ uniqueId });
    
    if (!recordingMetadata) {
      return NextResponse.json(
        { error: 'Recording metadata not found' }, 
        { status: 404 }
      );
    }
    
    // Prepare context from transcript and summary if available
    let context = '';
    
    // Get summary if available
    const summary = await Summary.findOne({ recordingId: uniqueId });
    if (summary) {
      context += `Summary of the recording:\n${summary.content}\n\n`;
    }
    
    // Get transcript
    let transcript = '';
    try {
      const response = await fetch(recordingMetadata.transcriptUrl);
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
    
    if (transcript) {
      context += `Transcript of the recording:\n${transcript}\n\n`;
    }
    
    // Find existing chat or create new one
    let chat = await Chat.findOne({ recordingId: uniqueId });
    let chatMessages: IMessage[] = [];
    
    if (chat) {
      // Use existing chat history
      chatMessages = chat.messages;
    }
    
    // Format all messages for the OpenAI API
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
    
    // Add previous chat messages to the context
    // First add messages from the database
    if (chatMessages.length > 0) {
      for (const msg of chatMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          formattedMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }
    
    // Then add any messages from the current session that might not be in the database yet
    if (previousMessages.length > 0) {
      for (const prevMsg of previousMessages) {
        // Only add if not already in the database messages
        const exists = chatMessages.some(msg => msg.id === prevMsg.id);
        if (!exists && (prevMsg.role === 'user' || prevMsg.role === 'assistant')) {
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

    // Create message objects using our model functions
    const newUserMessage = createMessage(message, 'user');
    const newAiMessage = createMessage(reply, 'assistant');

    // Save messages to the database
    if (chat) {
      // Update existing chat
      chat.messages.push(newUserMessage, newAiMessage);
      await chat.save();
    } else {
      // Create new chat
      chat = new Chat({
        recordingId: uniqueId,
        messages: [newUserMessage, newAiMessage]
      });
      await chat.save();
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