'use client';

import {
  useCall,
  useCallStateHooks,
  TranscriptionSettingsRequestModeEnum,
} from '@stream-io/video-react-sdk';

const TranscriptionToggle = () => {
  const call = useCall();
  const { useCallSettings, useIsCallTranscribingInProgress } = useCallStateHooks();
  const { transcription } = useCallSettings() || {};
  const isTranscribing = useIsCallTranscribingInProgress();
  
  // Don't render if transcription feature is disabled
  if (transcription?.mode === TranscriptionSettingsRequestModeEnum.DISABLED) {
    return null;
  }

  return (
    <button
      className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] text-white"
      onClick={() => {
        if (isTranscribing) {
          call?.stopTranscription()
            .catch((err) => {
              console.error("Failed to stop transcription", err);
            });
        } else {
          call?.startTranscription()
            .catch((err) => {
              console.error("Failed to start transcription", err);
            });
        }
      }}
    >
      {isTranscribing ? "Stop Transcription" : "Start Transcription"}
    </button>
  );
};

export default TranscriptionToggle;