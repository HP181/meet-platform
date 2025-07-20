'use client';

import React, { useEffect, useState } from 'react';
import { Call, OwnCapability } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { RecordIcon, StopCircleIcon, LoaderCircleIcon } from 'lucide-react';

interface CallRecordingProps {
  call: Call;
}

// State for recording
type RecordingState = 'idle' | 'starting' | 'recording' | 'stopping';

export const CallRecording: React.FC<CallRecordingProps> = ({ call }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [hasStartRecordPermission, setHasStartRecordPermission] = useState(false);
  const [hasStopRecordPermission, setHasStopRecordPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Check for recording permissions
  useEffect(() => {
    if (call) {
      const startPermission = call.permissionsContext.hasPermission(OwnCapability.START_RECORD_CALL);
      const stopPermission = call.permissionsContext.hasPermission(OwnCapability.STOP_RECORD_CALL);
      
      setHasStartRecordPermission(startPermission);
      setHasStopRecordPermission(stopPermission);
    }
  }, [call]);

  // Subscribe to recording state changes
  useEffect(() => {
    if (!call) return;

    // Subscribe to recording state changes
    const subscription = call.state.recording$.subscribe((recording) => {
      setIsRecording(!!recording);
      
      // If we were in the starting state and now recording is active, change to recording state
      if (recordingState === 'starting' && recording) {
        setRecordingState('recording');
        toast.success('Call recording started');
      }
      
      // If we were in the stopping state and now recording is inactive, change to idle state
      if (recordingState === 'stopping' && !recording) {
        setRecordingState('idle');
        toast.success('Call recording stopped');
      }
    });

    // Listen for recording_ready event
    const handleRecordingReady = () => {
      toast.success('Recording is now available');
    };

    call.on('call.recording_ready', handleRecordingReady);

    // Cleanup
    return () => {
      subscription.unsubscribe();
      call.off('call.recording_ready', handleRecordingReady);
    };
  }, [call, recordingState]);

  // Start recording
  const startRecording = async () => {
    if (!call || !hasStartRecordPermission) {
      toast.error('You do not have permission to record this call');
      return;
    }

    try {
      setRecordingState('starting');
      toast.info('Starting call recording...');
      await call.startRecording();
      // The state will be updated by the subscription
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingState('idle');
      toast.error('Failed to start recording');
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!call || !hasStopRecordPermission) {
      toast.error('You do not have permission to stop recording');
      return;
    }

    try {
      setRecordingState('stopping');
      toast.info('Stopping call recording...');
      await call.stopRecording();
      // The state will be updated by the subscription
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setRecordingState('recording');
      toast.error('Failed to stop recording');
    }
  };

  // Render loading indicators during state transitions
  const renderButtonContent = () => {
    switch (recordingState) {
      case 'starting':
        return (
          <>
            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
            Starting...
          </>
        );
      case 'recording':
        return (
          <>
            <StopCircleIcon className="mr-2 h-4 w-4 text-red-500 animate-pulse" />
            Stop Recording
          </>
        );
      case 'stopping':
        return (
          <>
            <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
            Stopping...
          </>
        );
      case 'idle':
      default:
        return (
          <>
            <RecordIcon className="mr-2 h-4 w-4" />
            Start Recording
          </>
        );
    }
  };

  // Show nothing if the call doesn't exist
  if (!call) return null;

  return (
    <div className="flex items-center">
      {isRecording && recordingState === 'recording' && (
        <div className="flex items-center mr-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-1"></div>
          <span className="text-sm text-red-500">Recording</span>
        </div>
      )}
      
      <Button
        variant={recordingState === 'recording' ? "destructive" : "default"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={
          (isRecording && !hasStopRecordPermission) || 
          (!isRecording && !hasStartRecordPermission) ||
          recordingState === 'starting' ||
          recordingState === 'stopping'
        }
        className="transition-all"
      >
        {renderButtonContent()}
      </Button>
    </div>
  );
};

export default CallRecording;