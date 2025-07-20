// app/api/chat/[recordingId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Chat, RecordingMetadata } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { recordingId: string } }
) {
  try {
    const recordingId = (await params).recordingId;
    
    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' }, 
        { status: 400 }
      );
    }

    // Connect to MongoDB via Mongoose
    await connectToDatabase();
    
    // Get recording metadata for context
    const metadata = await RecordingMetadata.findOne({ uniqueId: recordingId });
    
    if (!metadata) {
      return NextResponse.json(
        { error: 'Recording metadata not found' }, 
        { status: 404 }
      );
    }
    
    // Find chat history by recordingId
    const chatHistory = await Chat.findOne({ recordingId });
    
    if (!chatHistory) {
      // Return empty messages array if no chat history found
      return NextResponse.json({
        recordingId,
        messages: [],
        recordingMetadata: metadata
      });
    }

    return NextResponse.json({
      recordingId: chatHistory.recordingId,
      messages: chatHistory.messages,
      createdAt: chatHistory.createdAt,
      updatedAt: chatHistory.updatedAt,
      recordingMetadata: metadata
    });
    
  } catch (error) {
    console.error('Error in get chat history API route:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' }, 
      { status: 500 }
    );
  }
}