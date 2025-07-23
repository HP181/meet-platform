import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { RecordingMetadata } from "@/models";

export async function POST(request: NextRequest) {
  console.log("POST /api/recordings/create - Request received");

  try {
    let requestBody;
    try {
      requestBody = await request.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      uniqueId,
      sessionId,
      recordingFilename,
      recordingUrl,
      transcriptFilename,
      transcriptUrl,
    } = requestBody;

    // Validate required fields
    if (!uniqueId || !sessionId || !recordingFilename || !recordingUrl) {
      const missingFields = [];
      if (!uniqueId) missingFields.push("uniqueId");
      if (!sessionId) missingFields.push("sessionId");
      if (!recordingFilename) missingFields.push("recordingFilename");
      if (!recordingUrl) missingFields.push("recordingUrl");

      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingRecording = await RecordingMetadata.findOne({ uniqueId });

    if (existingRecording) {
      console.log("Recording already exists:", uniqueId);
      return NextResponse.json({
        message: "Recording already exists",
        recording: {
          uniqueId: existingRecording.uniqueId,
          recordingFilename: existingRecording.recordingFilename,
        },
      });
    }

    // Create new recording metadata
    console.log("Creating new recording metadata...");
    const newRecording = new RecordingMetadata({
      uniqueId,
      sessionId,
      recordingFilename,
      recordingUrl,
      transcriptFilename:
        transcriptFilename || `transcript_${recordingFilename}`,
      transcriptUrl: transcriptUrl || "", // Empty string if not provided
    });

    await newRecording.save();
    console.log("Recording metadata created successfully:", uniqueId);

    return NextResponse.json({
      message: "Recording created successfully",
      recording: {
        uniqueId: newRecording.uniqueId,
        recordingFilename: newRecording.recordingFilename,
      },
    });
  } catch (error: any) {
    console.error("Error creating recording:", error);
    return NextResponse.json(
      { error: `Failed to create recording: ${error.message}` },
      { status: 500 }
    );
  }
}
