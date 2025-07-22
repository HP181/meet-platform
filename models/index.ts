import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecordingMetadata extends Document {
  uniqueId: string;
  sessionId: string;
  recordingFilename: string;
  recordingUrl: string;
  transcriptFilename: string;
  transcriptUrl: string;
}

// Message Interface
export interface IMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
}

export interface IChat extends Document {
  recordingId: string;
  userId: string;
  messages: IMessage[];
}

export interface ISummary extends Document {
  recordingId: string;
  content: string;
}

const MessageSchema = new Schema<IMessage>({
  id: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RecordingMetadataSchema = new Schema<IRecordingMetadata>(
  {
    uniqueId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    recordingFilename: {
      type: String,
      required: true,
    },
    recordingUrl: {
      type: String,
      required: true,
    },
    transcriptFilename: {
      type: String,
      required: false,
    },
    transcriptUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ChatSchema = new Schema<IChat>(
  {
    recordingId: {
      type: String,
      required: true,
      ref: "RecordingMetadata",
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Add compound index for recordingId and userId
ChatSchema.index({ recordingId: 1, userId: 1 }, { unique: true });

const SummarySchema = new Schema<ISummary>(
  {
    recordingId: {
      type: String,
      required: true,
      ref: "RecordingMetadata",
      index: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const RecordingMetadata =
  mongoose.models.RecordingMetadata ||
  mongoose.model<IRecordingMetadata>(
    "RecordingMetadata",
    RecordingMetadataSchema
  );

export const Chat =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

export const Summary =
  mongoose.models.Summary || mongoose.model<ISummary>("Summary", SummarySchema);

export const createMessage = (
  content: string,
  role: "user" | "assistant"
): IMessage => {
  return {
    id: `${role}-${Date.now()}`,
    content,
    role,
    createdAt: new Date(),
  };
};
