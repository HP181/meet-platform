"use client";

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { useParticipantTracking } from "@/hooks/useParticipantTracking";

const EndCallButton = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const call = useCall();
  const router = useRouter();
  const { trackParticipant } = useParticipantTracking();

  if (!call)
    throw new Error(
      "useStreamCall must be used within a StreamCall component."
    );

  const { useLocalParticipant, useParticipantCount } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const participantCount = useParticipantCount();

  // Check if current user is the meeting creator
  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  // End the call
  const endCall = async () => {
    if (isEnding) return; // Prevent multiple clicks

    setIsEnding(true);

    try {
      // First track the end event using our server-side API
      // This happens before ending the call to ensure we capture who ended it
      await trackParticipant(call.id, call.type, "end");

      await call.endCall();

      // Redirect to home
      router.push("/");
    } catch (error) {
      setIsEnding(false);

      // Try to end call anyway if tracking failed
      try {
        await call.endCall();
        router.push("/");
      } catch (endError) {
        alert("Failed to end the meeting. Please try again.");
      }
    }
  };

  if (process.env.NEXT_PUBLIC_SKIP_CONFIRMATION === "true") {
    return (
      <Button onClick={endCall} className="bg-red-500" disabled={isEnding}>
        {isEnding ? "Ending..." : "End call for everyone"}
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsConfirmOpen(true)}
        className="bg-red-500 hover:bg-red-600"
        disabled={isEnding}
      >
        {isEnding ? "Ending..." : "End call for everyone"}
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="border-none bg-[#1C1F2E] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              End Meeting for Everyone
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4">
              Are you sure you want to end this meeting for all participants?
            </p>

            <div className="flex flex-col gap-2">
              {participantCount > 1 && (
                <div className="text-sm text-gray-400 mb-2">
                  {participantCount} participants are currently in this meeting
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white"
                disabled={isEnding}
              >
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700 cursor-pointer hover:cursor-pointer"
              onClick={endCall}
              disabled={isEnding}
            >
              {isEnding ? "Ending..." : "End for Everyone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EndCallButton;
