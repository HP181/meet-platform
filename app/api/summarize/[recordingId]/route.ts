// app/api/summary/[recordingId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Summary, RecordingMetadata } from '@/models';

export async function GET(
  req: NextRequest,
  context: { params: { recordingId: string } }
) {
  try {
    const param = await context.params;
    const recordingId = param.recordingId;
    
    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID is required' }, 
        { status: 400 }
      );
    }

    // Connect to MongoDB via Mongoose
    await connectToDatabase();
    
    // Find summary by recordingId
    const summary = await Summary.findOne({ recordingId });
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' }, 
        { status: 404 }
      );
    }
    
    // Get recording metadata for additional context
    const metadata = await RecordingMetadata.findOne({ uniqueId: recordingId });

    return NextResponse.json({
      recordingId: summary.recordingId,
      content: summary.content,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      recordingMetadata: metadata
    });
    
  } catch (error) {
    console.error('Error in get summary API route:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve summary' }, 
      { status: 500 }
    );
  }
}