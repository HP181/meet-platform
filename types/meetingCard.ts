// File: types/meetingCard.ts

// User details interface for participants and creators
export interface UserDetails {
  user_id: string;
  name: string;
  email?: string;
  image_url?: string;
  role?: string;
}

// Info about who ended a meeting
export interface EndedByInfo {
  user_id: string;
  name: string;
  timestamp: string;
}

// Transcription file info
export interface TranscriptionFile {
  filename: string;
  url: string;
  start_time: string;
  end_time: string;
  session_id: string;
}

// Meeting card props interface
export interface MeetingCardProps {
  icon: string;
  title: string;
  date: string;
  link?: string;
  isPreviousMeeting?: boolean;
  buttonText?: string;
  buttonIcon1?: string;
  handleClick?: () => void;
  participants?: UserDetails[];
  creator?: UserDetails | undefined;
  endedBy?: EndedByInfo | undefined;
  duration?: number;
  hasTranscriptions?: boolean;
  transcriptions?: TranscriptionFile[];
  onViewTranscription?: () => void;
}