// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { RecordingMetadata, Chat, Summary, createMessage, IMessage } from '@/models';
import { currentUser } from '@clerk/nextjs/server';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  const user = await currentUser()
  console.log('POST /api/chat - Chat request received');
  
  try {
    // Get authenticated user ID from Clerk
    const  userId = user?.id
    
    if (!userId) {
      console.error('No authenticated user found');
      return NextResponse.json(
        { error: 'User authentication required' }, 
        { status: 401 }
      );
    }
    
    console.log('Authenticated user ID:', userId);
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' }, 
        { status: 400 }
      );
    }
    
    const { 
      message, 
      uniqueId, 
      previousMessages = [] 
    } = requestBody;
    
    console.log('Request parameters:', { 
      messageLength: message?.length || 0,
      uniqueId,
      userId,
      previousMessagesCount: previousMessages?.length || 0
    });
    
    if (!message || !uniqueId) {
      console.error('Missing required parameters', { message: !!message, uniqueId: !!uniqueId });
      return NextResponse.json(
        { error: 'Message and uniqueId are required' }, 
        { status: 400 }
      );
    }

    // Connect to MongoDB via Mongoose
    console.log('Connecting to database...');
    try {
      await connectToDatabase();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' }, 
        { status: 500 }
      );
    }
    
    // Get recording metadata
    console.log('Fetching recording metadata for ID:', uniqueId);
    const recordingMetadata = await RecordingMetadata.findOne({ uniqueId });
    
    if (!recordingMetadata) {
      console.error('Recording metadata not found for ID:', uniqueId);
      return NextResponse.json(
        { error: 'Recording metadata not found' }, 
        { status: 404 }
      );
    }
    
    console.log('Recording metadata found:', {
      filename: recordingMetadata.recordingFilename,
      hasTranscriptUrl: !!recordingMetadata.transcriptUrl
    });
    
    // Prepare context from transcript and summary if available
    let context = '';
    
    // Get summary if available
    console.log('Fetching summary...');
    const summary = await Summary.findOne({ recordingId: uniqueId });
    if (summary) {
      console.log('Summary found, length:', summary.content?.length || 0);
      context += `Summary of the recording:\n${summary.content}\n\n`;
    } else {
      console.log('No summary found');
    }
    
    // Get transcript
    console.log('Fetching transcript from URL:', recordingMetadata.transcriptUrl);
    let transcript = '';
    try {
      if (!recordingMetadata.transcriptUrl) {
        console.warn('No transcript URL available');
      } else {
        const response = await fetch(recordingMetadata.transcriptUrl);
        console.log('Transcript fetch response status:', response.status);
        
        if (response.ok) {
          const text = await response.text();
          console.log('Transcript text received, length:', text.length);
          
          // Process the transcript (this will depend on your format)
          try {
            // Try parsing as a single JSON array
            const jsonArray = JSON.parse(text);
            if (Array.isArray(jsonArray)) {
              console.log('Transcript parsed as JSON array, items:', jsonArray.length);
              transcript = jsonArray
                .map(segment => `${segment.speaker_id || 'Speaker'}: ${segment.text}`)
                .join('\n');
            }
          } catch (jsonError) {
            console.log('Not a JSON array, trying JSONL format');
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
              console.log('Transcript parsed as JSONL, lines:', lines.length);
              transcript = parsedLines;
            } else {
              // If all else fails, use the raw text
              console.log('Using raw text as transcript');
              transcript = text.substring(0, 5000); // Limit size
            }
          }
        } else {
          console.error('Failed to fetch transcript:', response.status, response.statusText);
        }
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
    
    if (transcript) {
      console.log('Transcript processed, length:', transcript.length);
      context += `Transcript of the recording:\n${transcript}\n\n`;
    } else {
      console.warn('No transcript content available');
    }
    
    // Find existing chat or create new one for this specific user
    console.log('Finding existing chat for user and recording...');
    let chat = await Chat.findOne({ 
      recordingId: uniqueId,
      userId: userId
    });
    let chatMessages: IMessage[] = [];
    
    if (chat) {
      console.log('Existing chat found for this user, messages:', chat.messages.length);
      // Use existing chat history
      chatMessages = chat.messages;
    } else {
      console.log('No existing chat found for this user, will create new');
    }
    
    // Format all messages for the OpenAI API
    console.log('Preparing messages for OpenAI API');
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
      console.log('Adding messages from database:', chatMessages.length);
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
      console.log('Adding messages from current session:', previousMessages.length);
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

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' }, 
        { status: 500 }
      );
    }

    // Generate response using OpenAI
    console.log('Calling OpenAI API with message count:', formattedMessages.length);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: formattedMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      console.log('OpenAI API response received');
      const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
      console.log('Generated reply length:', reply.length);

      // Create message objects using our model functions
      const newUserMessage = createMessage(message, 'user');
      const newAiMessage = createMessage(reply, 'assistant');

      // Save messages to the database
      console.log('Saving messages to database');
      try {
        if (chat) {
          // Update existing chat
          chat.messages.push(newUserMessage, newAiMessage);
          await chat.save();
          console.log('Updated existing chat');
        } else {
          // Create new chat with userId
          chat = new Chat({
            recordingId: uniqueId,
            userId: userId, // Include userId
            messages: [newUserMessage, newAiMessage]
          });
          await chat.save();
          console.log('Created new chat with userId');
        }
      } catch (dbSaveError) {
        console.error('Error saving chat to database:', dbSaveError);
        // Don't fail the request if database save fails
      }

      return NextResponse.json({ reply });
    } catch (openAiError:any) {
      console.error('OpenAI API error:', openAiError);
      return NextResponse.json(
        { error: `OpenAI API error: ${openAiError.message || 'Unknown error'}` }, 
        { status: 500 }
      );
    }
    
  } catch (error:any) {
    console.error('Unhandled error in chat API route:', error);
    return NextResponse.json(
      { error: `Failed to generate response: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}