import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { RecordingMetadata } from "@/models";

export async function GET(
  request: NextRequest,
  context: { params: { recordingId: string } }
) {
  console.log("GET /api/recordings/[recordingId]/check - Request received");

  try {
    const param = await context.params;
    const recordingId = param.recordingId;
    console.log("Checking if recording exists:", recordingId);

    if (!recordingId) {
      console.error("Missing recordingId parameter");
      return NextResponse.json(
        { error: "Recording ID is required" },
        { status: 400 }
      );
    }

    console.log("Connecting to database...");
    await connectToDatabase();

    console.log("Querying for recording metadata...");
    const metadata = await RecordingMetadata.findOne({ uniqueId: recordingId });

    if (!metadata) {
      console.log("Recording metadata not found:", recordingId);
      return NextResponse.json(
        { exists: false, message: "Recording not found" },
        { status: 404 }
      );
    }

    console.log("Recording metadata found:", recordingId);
    return NextResponse.json({
      exists: true,
      metadata: {
        uniqueId: metadata.uniqueId,
        recordingFilename: metadata.recordingFilename,
        hasTranscript: !!metadata.transcriptUrl,
      },
    });
  } catch (error: any) {
    console.error("Error checking recording:", error);
    return NextResponse.json(
      { error: `Failed to check recording: ${error.message}` },
      { status: 500 }
    );
  }
}
