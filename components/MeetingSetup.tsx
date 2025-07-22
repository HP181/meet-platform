"use client";

import { useEffect, useState } from "react";
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import Alert from "./Alert";
import { Button } from "./ui/button";
import { useParticipantTracking } from "@/hooks/useParticipantTracking";

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  const router = useRouter();
  const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;
  const { user } = useUser();
  const { trackParticipant, isTracking } = useParticipantTracking();

  const call = useCall();

  if (!call) {
    throw new Error(
      "useStreamCall must be used within a StreamCall component."
    );
  }

  // Access existing meeting details
  const [existingParticipants, setExistingParticipants] = useState<any[]>([]);

  // Load existing participants data from custom field if available
  useEffect(() => {
    if (call?.state?.custom?.participants) {
      try {
        const participants = call.state.custom.participants;
        if (Array.isArray(participants)) {
          setExistingParticipants(participants);
        }
      } catch (error) {
        console.error("Error loading participants data:", error);
      }
    }
  }, [call?.state?.custom]);

  const [isMicCamToggled, setIsMicCamToggled] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [isMicCamToggled, call.camera, call.microphone, user]);

  // Effect to handle call ended state and redirect
  useEffect(() => {
    if (callHasEnded) {
      const redirectTimer = setTimeout(() => {
        router.push("/");
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [callHasEnded, router]);

  // Handle joining the meeting
  const joinMeeting = async () => {
    if (!user?.id) {
      alert("User not found. Please sign in again.");
      return;
    }

    try {
      await call.join({
        data: {
          members: [{ user_id: user.id }],
        },
      });

      // After successfully joining, track the participant using our server-side API
      trackParticipant(call.id, call.type, "join")
        .then((success) => {
          if (!success) {
            console.warn(
              "Failed to track participant join, but meeting join was successful"
            );
          }
        })
        .catch((error) => {
          console.error("Error tracking participant:", error);
        });

      setIsSetupComplete(true);
    } catch (error) {
      <Alert title="Error joining meeting:" />;
    }
  };

  if (callTimeNotArrived)
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
      />
    );

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host. Redirecting you to home..."
        iconUrl="/icons/call-ended.svg"
      />
    );

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-center text-2xl font-bold">Setup</h1>
      <VideoPreview />
      <div className="flex h-16 items-center justify-center gap-3">
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isMicCamToggled}
            onChange={(e) => setIsMicCamToggled(e.target.checked)}
          />
          Join with mic and camera off
        </label>
        <DeviceSettings />
      </div>
      <Button
        className="rounded-md bg-green-500 px-4 py-2.5"
        onClick={joinMeeting}
        disabled={isTracking}
      >
        {isTracking ? "Joining..." : "Join meeting"}
      </Button>

      {existingParticipants.length > 0 && (
        <div className="mt-4 text-sm text-gray-300">
          <p>{existingParticipants.length} people in this meeting</p>
        </div>
      )}
    </div>
  );
};

export default MeetingSetup;
