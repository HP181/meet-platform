"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk"
import { useParams, useRouter } from "next/navigation"
import { Loader } from "lucide-react"

import { useGetCallById } from "@/hooks/UseGetCallById"
import Alert from "@/components/Alert"
import MeetingSetup from "@/components/MeetingSetup"
import MeetingRoom from "@/components/MeetingRoom"

const MeetingPage = () => {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { isLoaded, user } = useUser()

  // Extract id and provide fallback
  const id = params?.id
  const { call, isCallLoading } = useGetCallById(id || "")

  const [isSetupComplete, setIsSetupComplete] = useState(false)

  // Check if the call has ended (using a polling mechanism)
  useEffect(() => {
    if (!call) return;
    
    const checkCallStatus = () => {
      // If call has ended property that's truthy, redirect to home
      if (call.state?.endedAt) {
        console.log("Call has ended in MeetingPage, redirecting to home page");
        router.push('/');
      }
    };

    // Initial check
    checkCallStatus();
    
    // Set up polling to check call status regularly
    const intervalId = setInterval(checkCallStatus, 5000);
    
    return () => clearInterval(intervalId);
  }, [call, router]);

  // Show loader while data is loading
  if (!isLoaded || isCallLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" size={48} />
      </div>
    )
  }

  // Handle missing id parameter
  if (!id) {
    return <p className="text-center text-3xl font-bold text-white">Invalid Meeting ID</p>
  }

  // Handle call not found
  if (!call) {
    return <p className="text-center text-3xl font-bold text-white">Call Not Found</p>
  }

  // Check if call has ended
  if (call.state?.endedAt) {
    return (
      <Alert 
        title="This meeting has ended" 
        iconUrl="/icons/call-ended.svg" 
      />
    )
  }

  // Check if user is allowed to join the call
  const notAllowed = call.type === "invited" && (!user || !call.state.members.find((m) => m.user.id === user.id))

  if (notAllowed) {
    return <Alert title="You are not allowed to join this meeting" />
  }

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? <MeetingSetup setIsSetupComplete={setIsSetupComplete} /> : <MeetingRoom />}
        </StreamTheme>
      </StreamCall>
    </main>
  )
}

export default MeetingPage