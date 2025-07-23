# 🎥 Meet Platform

*Meet Platform* is a sophisticated, full-stack video meeting application built with **Next.js 15**, **React 19**, and the **Stream Video SDK**. Our platform enables seamless video collaboration with enterprise-grade features including meeting scheduling, recording management, AI-powered transcription summaries, and interactive AI chat capabilities.

<img width="1920" height="1006" alt="screencapture-meet-platform-vercel-app-2025-07-22-21_46_49" src="https://github.com/user-attachments/assets/50b2e491-c27f-4af9-a1ba-074f6146c813" />


## ✨ Live Demo

Experience Meet Platform live: [https://meet-platform.vercel.app](https://meet-platform.vercel.app)

## 🚀 Core Features

### Meeting Management
- **Create Instant Meetings** - Launch video calls with a single click
- **Join Meetings** - Enter meetings seamlessly via invitation links
- **Schedule Meetings** - Plan future meetings with smart 15-minute time slot validation
- **Personal Room** - Access your dedicated permanent meeting space

### Recording & History
- **Recording Playback** - View and manage past meeting recordings
- **Participant Lists** - See who attended previous meetings
- **Meeting History** - Track all past meetings with detailed metadata

### AI-Powered Features
- **Transcription** - Access detailed meeting transcripts automatically
- **AI Summary Generation** - Get intelligent meeting summaries powered by AI
- **Contextual AI Chat** - Ask questions about specific recordings with an AI assistant
- **Persistent Chat History** - Store and retrieve all AI conversations

### Platform Features
- **User Management** - Secure authentication and user profiles
- **FAQ System** - Comprehensive help system with admin CRUD capabilities
- **Upcoming Meetings** - Smart calendar view of scheduled meetings
- **Mobile Responsive** - Fully adaptive design across all devices

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Lucide React icons |
| **Video SDK** | Stream Video React SDK |
| **Authentication** | Clerk |
| **Database** | MongoDB (AI summaries, chat history, FAQs) |
| **Date Management** | react-datepicker, date-fns |
| **Notifications** | Sonner toast notifications |
| **Deployment** | Vercel |

## 👥 Team & Feature Implementation

| Team Member | Role | Features Implemented |
|-------------|------|----------------------|
| **Hitkumar Patel** | Frontend Developer | • Home page design and implementation<br>• Previous meetings page<br>• Recording management<br>• Meeting playback interface <br>• Summary generation API |
| **Hrishikesh More** | Frontend Developer | • Upcoming meetings calendar<br>• Meeting scheduling system<br>• Time slot validation<br>• Meeting notifications |
| **Jagrutiben Kataria** | UI/UX Developer | • Authentication integration<br>• Dashboard UI design<br>• AI chatroom interface<br>• Responsive layout implementation |
| **Arch Patel** | Backend Developer | • FAQ management system<br>• AI transcription integration<br>• AI chat backend<br>• MongoDB integration |

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB account
- Stream account
- Clerk account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/2025-Summer-ITE-5425-OTA/project-phases-codebucks.git
   cd project-phases-codebucks
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   
   # Stream Video SDK
   NEXT_PUBLIC_STREAM_KEY=your_stream_api_key
   STREAM_SECRET=your_stream_secret
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string
   
   # OpenAI (for summaries and chat)
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Visit [http://localhost:3000](http://localhost:3000) to see the application running locally.**

## 📚 API Routes

| Endpoint | Method | Description | Implementation Details |
|----------|--------|-------------|------------------------|
| `/api/faq` | GET | Retrieve all FAQs | Returns a list of all FAQ entries from MongoDB |
| `/api/faq` | POST | Create a new FAQ | Creates a new FAQ entry with question and answer |
| `/api/faq` | PUT | Update an existing FAQ | Updates an FAQ entry by its ID |
| `/api/faq` | DELETE | Delete an FAQ | Removes an FAQ entry by its ID |
| `/api/chat` | POST | Process AI chat requests | Handles chat functionality using OpenAI, retrieving transcripts and generating contextual responses |
| `/api/chat/[recordingId]` | GET | Get chat history for a specific recording | Returns all chat messages for a specific recording and user |
| `/api/recordings/[recordingId]/check` | GET | Check if a recording exists | Verifies if recording metadata exists in the database |
| `/api/recordings/create` | POST | Register a new recording | Creates metadata entry for a new recording with optional transcript URL |
| `/api/meeting/track-participant` | POST | Track meeting participants | Records join/leave events and maintains participant lists in Stream's custom data |
| `/api/summary/[recordingId]` | GET | Get an existing summary for a recording | Retrieves a previously generated AI summary for a recording |
| `/api/summarize` | POST | Generate a new summary from transcript | Creates a structured meeting summary using OpenAI from transcript text |

## 🔧 Key Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## 🎨 Customization

- **UI Components**: Modify or extend components in the `components/` directory
- **Theme**: Adjust theme variables in `tailwind.config.js`
- **Meeting Logic**: Update meeting functionality in the meeting-related components
- **Authentication**: Configure Clerk settings in the [Clerk dashboard](https://clerk.dev/)
- **Video SDK**: Adjust Stream settings in the [Stream dashboard](https://getstream.io/)

## 🚀 Future Plans

### SaaS Implementation

- **Stripe Integration**  
  Implement subscription-based pricing tiers with different feature sets.

- **Freemium Model**  
  Offer a free tier with basic functionality and premium tiers with advanced features.

- **Usage-based Billing**  
  Track and bill for resources like recording storage and AI processing.

### Enhanced Recording Capabilities

- **Quality Selection**  
  Allow users to choose recording quality levels (SD, HD, 4K).

- **Custom Retention Policies**  
  Configurable retention periods for recordings based on subscription tier.

- **Recording Encryption**  
  End-to-end encryption for sensitive meeting recordings.

- **Download Options**  
  Multiple format options for recording downloads (MP4, WebM, audio-only).

## 🔐 Security Features

- Secure authentication with Clerk
- Protected API routes
- Meeting access controls
- Data encryption for sensitive information
- CORS protection


## 📱 Mobile Support

Meet Platform is fully responsive and optimized for:
- iOS (Safari)
- Android (Chrome)
- All modern mobile browsers

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Stream](https://getstream.io/) for their excellent Video SDK
- [Clerk](https://clerk.dev/) for authentication
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Vercel](https://vercel.com/) for hosting

---

<p align="center">
  Built with ❤️ by Team CodeBucks
</p>
