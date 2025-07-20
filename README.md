
# Meet Platform

Meet Platform is a modern, full-stack video meeting web application built with Next.js, React, and Stream Video SDK. It allows users to create, join, and schedule video meetings, manage recordings, and collaborate in real-time with a beautiful, responsive UI.

## Features

- **Instant Meetings:** Start a meeting with a single click.
- **Join Meetings:** Join meetings via invitation links.
- **Schedule Meetings:** Plan meetings for the future with 15-minute time slot validation.
- **Meeting Recordings:** View and manage past meeting recordings.
- **Personal Room:** Access your own dedicated meeting space.
- **Transcription:** Enable live transcription for meetings (if supported).
- **Responsive Design:** Works seamlessly on desktop and mobile devices.
- **Authentication:** Secure sign-in and sign-up with Clerk.
- **Modern UI:** Built with custom and shadcn/ui components for a sleek look.

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **UI Components:** shadcn/ui, Tailwind CSS
- **Video SDK:** [Stream Video React SDK](https://getstream.io/video/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Date Picker:** react-datepicker
- **Notifications:** sonner

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd meet-platform
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```
3. **Set up environment variables:**
   - Create a `.env.local` file in the root directory.
   - Add the following variables:
     ```env
     NEXT_PUBLIC_BASE_URL=http://localhost:3000
     STREAM_API_KEY=your_stream_api_key
     CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     CLERK_SECRET_KEY=your_clerk_secret_key
     ```
   - Replace the values with your actual API keys.

4. **Run the development server:**
   ```sh
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
meet-platform/
├── app/                # Next.js app directory (routing, pages, layouts)
├── components/         # Reusable React components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── Providers/          # Context and providers
├── Constants/          # App constants
├── public/             # Static assets (icons, images)
├── actions/            # Server actions
├── ...                 # Config files, etc.
```

## Key Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build for production
- `npm run start` — Start the production server
- `npm run lint` — Run ESLint

## Customization
- **UI:** Modify or extend components in the `components/` directory.
- **Meeting Logic:** Update meeting logic in `MeetingTypeList.tsx` and related files.
- **Authentication:** Configure Clerk settings in the Clerk dashboard.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License

This project is licensed under the MIT License.

---

**Built with ❤️ using Next.js, Stream, and Clerk.**
