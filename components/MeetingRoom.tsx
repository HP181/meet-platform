'use client';

import { useState, useEffect } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, FileText } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import { cn } from '@/lib/utils';
import TranscriptionToggle from './TranscriptionToggle';
import TranscriptionViewer from './TranscriptionViewer';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showTranscriptions, setShowTranscriptions] = useState(false);
  
  // Get call instance and hooks
  const call = useCall();
  const { 
    useCallCallingState, 
    useIsCallTranscribingInProgress,
    useCallEndedAt 
  } = useCallStateHooks();
  
  const callingState = useCallCallingState();
  const isTranscribing = useIsCallTranscribingInProgress();
  const callEndedAt = useCallEndedAt();

  // Effect to detect when call has ended and redirect all participants
  useEffect(() => {
    if (callEndedAt) {
      console.log('Call has ended, redirecting to home page');
      router.push('/');
    }
  }, [callEndedAt, router]);

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>

        {/* Transcription panel */}
        {showTranscriptions && (
          <div className="absolute right-4 top-4 w-80 z-10">
            <TranscriptionViewer />
          </div>
        )}
      </div>

      {/* Video layout and call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push(`/`)} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <Users size={20} className="text-white" />
          </div>
        </button>
        
        {/* Transcription toggle button */}
        <TranscriptionToggle />
        
        {/* Show/hide transcriptions button */}
        <button 
          onClick={() => setShowTranscriptions(prev => !prev)}
          className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]"
        >
          <div className="flex items-center">
            <FileText size={20} className="text-white" />
            {isTranscribing && (
              <span className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            )}
          </div>
        </button>
        
        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;