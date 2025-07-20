// // 'use client';

// // import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
// // import { Button } from './ui/button';
// // import { useRouter } from 'next/navigation';
// // import { useUser } from '@clerk/nextjs';
// // import { useState } from 'react';
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogFooter,
// //   DialogClose,
// // } from './ui/dialog';

// // // Define a type for user details
// // interface UserDetails {
// //   user_id: string;
// //   name: string;
// //   email?: string;
// //   image_url?: string;
// //   role?: string;
// // }

// // const EndCallButton = () => {
// //   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
// //   const call = useCall();
// //   const router = useRouter();
// //   const { user } = useUser();

// //   if (!call)
// //     throw new Error(
// //       'useStreamCall must be used within a StreamCall component.',
// //     );

// //   // https://getstream.io/video/docs/react/guides/call-and-participant-state/#participant-state-3
// //   const { useLocalParticipant, useParticipantCount } = useCallStateHooks();
// //   const localParticipant = useLocalParticipant();
// //   const participantCount = useParticipantCount();

// //   // Check if current user is the meeting creator
// //   const isMeetingOwner = 
// //     localParticipant &&
// //     call.state.createdBy &&
// //     localParticipant.userId === call.state.createdBy.id;

// //   if (!isMeetingOwner) return null;

// //   const endCall = async () => {
// //     try {
// //       // Store meeting end data with participant information before ending
// //       // Get existing custom data or initialize an empty object
// //       const customData = call.state.custom || {};
      
// //       // Get existing participants or initialize empty array
// //       const participants = customData.participants || [];
      
// //       // Create user details for who ended the call
// //       const userWhoEnded = {
// //         user_id: user?.id || localParticipant.userId,
// //         name: user?.fullName || user?.username || localParticipant.name || 'Unknown User',
// //         timestamp: new Date().toISOString()
// //       };
      
// //       // Update the call with the end status information
// //       await call.update({
// //         custom: {
// //           ...customData,
// //           ended_by: userWhoEnded,
// //           final_participant_count: participantCount,
// //           participants: participants
// //         }
// //       });
      
// //       // End the call for everyone
// //       await call.endCall();
      
// //       // Redirect to home
// //       router.push('/');
// //     } catch (error) {
// //       console.error("Error ending call:", error);
// //       // Still try to end call and redirect even if metadata update fails
// //       await call.endCall();
// //       router.push('/');
// //     }
// //   };

// //   // Simple version without confirmation dialog
// //   if (process.env.NEXT_PUBLIC_SKIP_CONFIRMATION === 'true') {
// //     return (
// //       <Button onClick={endCall} className="bg-red-500">
// //         End call for everyone
// //       </Button>
// //     );
// //   }

// //   // Version with confirmation dialog
// //   return (
// //     <>
// //       <Button 
// //         onClick={() => setIsConfirmOpen(true)} 
// //         className="bg-red-500 hover:bg-red-600"
// //       >
// //         End call for everyone
// //       </Button>

// //       <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
// //         <DialogContent className="border-none bg-[#1C1F2E] text-white">
// //           <DialogHeader>
// //             <DialogTitle className="text-xl font-bold">
// //               End Meeting for Everyone
// //             </DialogTitle>
// //           </DialogHeader>
          
// //           <div className="py-4">
// //             <p className="mb-4">
// //               Are you sure you want to end this meeting for all participants?
// //             </p>
            
// //             <div className="flex flex-col gap-2">
// //               {participantCount > 1 && (
// //                 <div className="text-sm text-gray-400 mb-2">
// //                   {participantCount} participants are currently in this meeting
// //                 </div>
// //               )}
// //             </div>
// //           </div>
          
// //           <DialogFooter className="flex flex-col sm:flex-row gap-2">
// //             <DialogClose asChild>
// //               <Button
// //                 type="button"
// //                 variant="outline"
// //                 className="border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white"
// //               >
// //                 Cancel
// //               </Button>
// //             </DialogClose>
            
// //             <Button
// //               type="button"
// //               className="bg-red-600 text-white hover:bg-red-700"
// //               onClick={endCall}
// //             >
// //               End for Everyone
// //             </Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>
// //     </>
// //   );
// // };

// // export default EndCallButton;



// 'use client';

// import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
// import { Button } from './ui/button';
// import { useRouter } from 'next/navigation';
// import { useUser } from '@clerk/nextjs';
// import { useState } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
//   DialogClose,
// } from './ui/dialog';

// const EndCallButton = () => {
//   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
//   const call = useCall();
//   const router = useRouter();
//   const { user } = useUser();

//   if (!call)
//     throw new Error(
//       'useStreamCall must be used within a StreamCall component.',
//     );

//   // https://getstream.io/video/docs/react/guides/call-and-participant-state/#participant-state-3
//   const { useLocalParticipant, useParticipantCount } = useCallStateHooks();
//   const localParticipant = useLocalParticipant();
//   const participantCount = useParticipantCount();

//   // Check if current user is the meeting creator
//   const isMeetingOwner = 
//     localParticipant &&
//     call.state.createdBy &&
//     localParticipant.userId === call.state.createdBy.id;

//   if (!isMeetingOwner) return null;

//   // End the call directly without trying to update custom data
//   const endCall = async () => {
//     try {
//       // End the call for everyone
//       await call.endCall();
      
//       // Redirect to home
//       router.push('/');
//     } catch (error) {
//       console.error("Error ending call:", error);
//       // Still try to redirect even if ending fails
//       router.push('/');
//     }
//   };

//   // Simple version without confirmation dialog
//   if (process.env.NEXT_PUBLIC_SKIP_CONFIRMATION === 'true') {
//     return (
//       <Button onClick={endCall} className="bg-red-500">
//         End call for everyone
//       </Button>
//     );
//   }

//   // Version with confirmation dialog
//   return (
//     <>
//       <Button 
//         onClick={() => setIsConfirmOpen(true)} 
//         className="bg-red-500 hover:bg-red-600"
//       >
//         End call for everyone
//       </Button>

//       <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
//         <DialogContent className="border-none bg-[#1C1F2E] text-white">
//           <DialogHeader>
//             <DialogTitle className="text-xl font-bold">
//               End Meeting for Everyone
//             </DialogTitle>
//           </DialogHeader>
          
//           <div className="py-4">
//             <p className="mb-4">
//               Are you sure you want to end this meeting for all participants?
//             </p>
            
//             <div className="flex flex-col gap-2">
//               {participantCount > 1 && (
//                 <div className="text-sm text-gray-400 mb-2">
//                   {participantCount} participants are currently in this meeting
//                 </div>
//               )}
//             </div>
//           </div>
          
//           <DialogFooter className="flex flex-col sm:flex-row gap-2">
//             <DialogClose asChild>
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:text-white"
//               >
//                 Cancel
//               </Button>
//             </DialogClose>
            
//             <Button
//               type="button"
//               className="bg-red-600 text-white hover:bg-red-700"
//               onClick={endCall}
//             >
//               End for Everyone
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default EndCallButton;


'use client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { useParticipantTracking } from '@/hooks/useParticipantTracking';

const EndCallButton = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const call = useCall();
  const router = useRouter();
  const { user } = useUser();
  const { trackParticipant } = useParticipantTracking();

  if (!call)
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );

  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#participant-state-3
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
      await trackParticipant(call.id, call.type, 'end');
      
      // Now end the call
      await call.endCall();
      
      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error("Error ending call:", error);
      setIsEnding(false);
      
      // Try to end call anyway if tracking failed
      try {
        await call.endCall();
        router.push('/');
      } catch (endError) {
        console.error("Error in final attempt to end call:", endError);
        alert("Failed to end the meeting. Please try again.");
      }
    }
  };

  // Simple version without confirmation dialog
  if (process.env.NEXT_PUBLIC_SKIP_CONFIRMATION === 'true') {
    return (
      <Button 
        onClick={endCall} 
        className="bg-red-500"
        disabled={isEnding}
      >
        {isEnding ? 'Ending...' : 'End call for everyone'}
      </Button>
    );
  }

  // Version with confirmation dialog
  return (
    <>
      <Button 
        onClick={() => setIsConfirmOpen(true)} 
        className="bg-red-500 hover:bg-red-600"
        disabled={isEnding}
      >
        {isEnding ? 'Ending...' : 'End call for everyone'}
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
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={endCall}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'End for Everyone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EndCallButton;