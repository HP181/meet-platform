// app/api/chat/[recordingId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: { recordingId: string } }
) {
  try {
    const param = await params;
    const recordingId = param.recordingId;
    
    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' }, 
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Find chat history by recordingId
    const chatHistory = await db
      .collection('chats')
      .findOne({ recordingId });
    
    if (!chatHistory) {
      return NextResponse.json({
        recordingId,
        messages: []
      });
    }

    return NextResponse.json({
      recordingId: chatHistory.recordingId,
      messages: chatHistory.messages,
      createdAt: chatHistory.createdAt,
      updatedAt: chatHistory.updatedAt
    });
    
  } catch (error) {
    console.error('Error in get chat history API route:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' }, 
      { status: 500 }
    );
  }
}