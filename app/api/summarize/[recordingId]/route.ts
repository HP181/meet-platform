// app/api/summary/[recordingId]/route.ts
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
    
    // Find summary by recordingId
    const summary = await db
      .collection('summaries')
      .findOne({ recordingId });
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: summary._id,
      recordingId: summary.recordingId,
      content: summary.content,
      createdAt: summary.createdAt
    });
    
  } catch (error) {
    console.error('Error in get summary API route:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve summary' }, 
      { status: 500 }
    );
  }
}