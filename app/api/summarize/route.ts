// app/api/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { RecordingMetadata, Summary } from '@/models';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const { 
      transcript, 
      uniqueId, 
      sessionId, 
      recordingFilename,
      recordingUrl,
      transcriptFilename,
      transcriptUrl
    } = await req.json();
    
    if (!transcript || !uniqueId || !sessionId) {
      return NextResponse.json(
        { error: 'Transcript, uniqueId, and sessionId are required' }, 
        { status: 400 }
      );
    }

    // Connect to MongoDB via Mongoose
    await connectToDatabase();
    
    // First, ensure we have the recording metadata stored
    let recordingMetadata = await RecordingMetadata.findOne({ uniqueId });
    
    if (!recordingMetadata) {
      // Create new recording metadata if it doesn't exist
      recordingMetadata = new RecordingMetadata({
        uniqueId,
        sessionId,
        recordingFilename,
        recordingUrl,
        transcriptFilename,
        transcriptUrl
      });
      await recordingMetadata.save();
    }
    
    // Check if summary already exists
    const existingSummary = await Summary.findOne({ recordingId: uniqueId });
    
    if (existingSummary) {
      return NextResponse.json({ summary: existingSummary.content });
    }

    // Generate summary using OpenAI with improved formatting instructions
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant that summarizes meeting transcripts. Create a comprehensive summary of the meeting with the following format:

### Meeting Summary:
- Key point 1
- Key point 2
- Key point 3

### Action Items:
- Action item 1
- Action item 2
- Action item 3

### Decisions Made:
- Decision 1
- Decision 2
- Decision 3

For each section, use clear bullet points. If a section has no relevant information, omit that section entirely. Format your response cleanly with proper spacing and organization. Use exactly this format with these section titles, no more and no less.`
      },
      {
        role: "user",
        content: `Please summarize the following meeting transcript:\n\n${transcript}`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.5,
    });

    const summaryContent = completion.choices[0]?.message?.content || "Failed to generate summary";

    // Create and save new summary
    const newSummary = new Summary({
      recordingId: uniqueId,
      content: summaryContent
    });
    
    await newSummary.save();

    return NextResponse.json({ summary: summaryContent });
    
  } catch (error) {
    console.error('Error in summarize API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' }, 
      { status: 500 }
    );
  }
}