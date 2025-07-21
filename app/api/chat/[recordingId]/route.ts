// app/api/chat/[recordingId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Chat, RecordingMetadata } from '@/models';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  context: { params: { recordingId: string } }
) {
   const user = await currentUser()
  console.log('GET /api/chat/[recordingId] - Request received');
  
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
    
    // Properly access params in Next.js App Router
    const param = await context.params;
    const recordingId = param.recordingId;
    console.log('Recording ID from params:', recordingId);
    
    if (!recordingId) {
      console.error('Missing recordingId parameter');
      return NextResponse.json(
        { error: 'Recording ID is required' }, 
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
    
    // Get recording metadata for context
    console.log('Fetching recording metadata...');
    const metadata = await RecordingMetadata.findOne({ uniqueId: recordingId });
    
    if (!metadata) {
      console.error('Recording metadata not found for ID:', recordingId);
      return NextResponse.json(
        { error: 'Recording metadata not found' }, 
        { status: 404 }
      );
    }
    
    console.log('Recording metadata found:', {
      filename: metadata.recordingFilename,
      hasTranscriptUrl: !!metadata.transcriptUrl
    });
    
    // Find chat history by recordingId AND userId
    console.log('Fetching chat history for user and recording...');
    const chatHistory = await Chat.findOne({ 
      recordingId: recordingId,
      userId: userId
    });
    
    if (!chatHistory) {
      console.log('No chat history found for this user, returning empty messages array');
      // Return empty messages array if no chat history found
      return NextResponse.json({
        recordingId,
        userId,
        messages: [],
        recordingMetadata: metadata
      });
    }

    console.log('Chat history found for this user, messages:', chatHistory.messages.length);
    return NextResponse.json({
      recordingId: chatHistory.recordingId,
      userId: chatHistory.userId,
      messages: chatHistory.messages,
      createdAt: chatHistory.createdAt,
      updatedAt: chatHistory.updatedAt,
      recordingMetadata: metadata
    });
    
  } catch (error:any) {
    console.error('Error in get chat history API route:', error);
    return NextResponse.json(
      { error: `Failed to retrieve chat history: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}