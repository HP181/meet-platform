import { NextRequest, NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { currentUser } from "@clerk/nextjs/server";

// Define interfaces for our request
interface ParticipantData {
  user_id: string;
  name: string;
  email?: string;
  image_url?: string;
  role?: string;
}

interface TrackingRequest {
  call_id: string;
  call_type: string;
  participant: ParticipantData;
  action: "join" | "leave" | "end";
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get API keys from environment variables
    const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
    const STREAM_API_SECRET = process.env.STREAM_VIDEO_API_SECRET;

    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      return NextResponse.json(
        { error: "Stream API credentials not configured" },
        { status: 500 }
      );
    }

    const requestData: TrackingRequest = await req.json();
    const { call_id, call_type, participant, action } = requestData;

    if (!call_id || !call_type || !participant || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize Stream client with server-side credentials
    const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

    const call = streamClient.video.call(call_type, call_id);

    const callData = await call.get();

    const customData = (callData.call?.custom as any) || {};
    const participants = Array.isArray(customData.participants)
      ? customData.participants
      : [];

    let updatedParticipants = [...participants];

    if (action === "join") {
      // Check if participant already exists
      const existingIndex = updatedParticipants.findIndex(
        (p) => p.user_id === participant.user_id
      );

      if (existingIndex >= 0) {
        updatedParticipants[existingIndex] = participant;
      } else {
        updatedParticipants.push(participant);
      }

      await call.update({
        custom: {
          ...customData,
          participants: updatedParticipants,
        },
      });

      await call.updateCallMembers({
        update_members: [
          {
            user_id: participant.user_id,
            ...(participant.role === "creator" ? { role: "admin" } : {}),
          },
        ],
      });
    } else if (action === "leave") {
      updatedParticipants = updatedParticipants.map((p) =>
        p.user_id === participant.user_id
          ? { ...p, status: "left", left_at: new Date().toISOString() }
          : p
      );

      await call.update({
        custom: {
          ...customData,
          participants: updatedParticipants,
        },
      });
    } else if (action === "end") {
      customData.ended_by = participant;
      customData.ended_at = new Date().toISOString();
      customData.final_participant_count = updatedParticipants.length;

      // Update the custom data
      await call.update({
        custom: {
          ...customData,
          participants: updatedParticipants,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking participant:", error);
    return NextResponse.json(
      { error: "Failed to track participant" },
      { status: 500 }
    );
  }
}
