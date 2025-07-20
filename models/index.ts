// models/index.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Recording Metadata Interface
export interface IRecordingMetadata extends Document {
  uniqueId: string;           // Unique ID from EnhancedRecording
  sessionId: string;          // Session ID from recording
  recordingFilename: string;  // Name of the recording file
  recordingUrl: string;       // URL of the recording video
  transcriptFilename: string; // Name of the transcript file
  transcriptUrl: string;      // URL of the transcript file
}

// Message Interface
export interface IMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

// Chat Interface
export interface IChat extends Document {
  recordingId: string;        // References RecordingMetadata.uniqueId
  messages: IMessage[];       // Array of messages
}

// Summary Interface
export interface ISummary extends Document {
  recordingId: string;        // References RecordingMetadata.uniqueId
  content: string;            // The summary content
}

// Message Schema (Sub-document schema for Chat)
const MessageSchema = new Schema<IMessage>({
  id: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Recording Metadata Schema
const RecordingMetadataSchema = new Schema<IRecordingMetadata>({
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  recordingFilename: {
    type: String,
    required: true
  },
  recordingUrl: {
    type: String,
    required: true
  },
  transcriptFilename: {
    type: String,
    required: false
  },
  transcriptUrl: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Chat Schema
const ChatSchema = new Schema<IChat>({
  recordingId: {
    type: String,
    required: true,
    ref: 'RecordingMetadata',
    index: true
  },
  messages: {
    type: [MessageSchema],
    default: []
  }
}, { timestamps: true });

// Summary Schema
const SummarySchema = new Schema<ISummary>({
  recordingId: {
    type: String,
    required: true,
    ref: 'RecordingMetadata',
    index: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Initialize models with mongoose.models check to prevent errors when hot reloading
export const RecordingMetadata = mongoose.models.RecordingMetadata || 
  mongoose.model<IRecordingMetadata>('RecordingMetadata', RecordingMetadataSchema);

export const Chat = mongoose.models.Chat || 
  mongoose.model<IChat>('Chat', ChatSchema);

export const Summary = mongoose.models.Summary || 
  mongoose.model<ISummary>('Summary', SummarySchema);

// Helper function to create a new message
export const createMessage = (
  content: string,
  role: 'user' | 'assistant'
): IMessage => {
  return {
    id: `${role}-${Date.now()}`,
    content,
    role,
    createdAt: new Date()
  };
};