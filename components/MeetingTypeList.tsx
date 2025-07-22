"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { toast } from "sonner";

import HomeCard from "./HomeCard";
import Loader from "./Loader";
import { Textarea } from "./ui/textarea";
import ReactDatePicker from "react-datepicker";
import { Input } from "./ui/input";
import MeetingModal from "./MeetingModal";
import "react-datepicker/dist/react-datepicker.css";

interface UserDetails {
  user_id: string;
  name: string;
  email?: string;
  image_url?: string;
  role?: string;
}

const initialValues = {
  dateTime: new Date(),
  description: "",
  link: "",
};

const generateUniqueId = () => {
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomStr}`;
};

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    "isScheduleMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const client = useStreamVideoClient();
  const { user } = useUser();

  const getNextValidTimeSlot = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundUpMinutes = Math.ceil(minutes / 15) * 15;

    const nextSlot = new Date(now);
    nextSlot.setMinutes(roundUpMinutes);
    nextSlot.setSeconds(0);
    nextSlot.setMilliseconds(0);

    if (minutes > 45) {
      nextSlot.setHours(now.getHours() + 1);
      nextSlot.setMinutes(0);
    }

    return nextSlot;
  };

  const handleDateTimeChange = (date: Date | null) => {
    if (!date) return;

    const now = new Date();
    const nextValidSlot = getNextValidTimeSlot();

    if (date.toDateString() === now.toDateString()) {
      if (date < nextValidSlot) {
        toast.info(
          "Selected time adjusted to the next available 15-minute slot"
        );
        const adjustedDate = new Date(date);
        adjustedDate.setHours(nextValidSlot.getHours());
        adjustedDate.setMinutes(nextValidSlot.getMinutes());
        setValues({ ...values, dateTime: adjustedDate });
        return;
      }
    } else if (date < now) {
      toast.error(
        "Cannot schedule meetings in the past. Please select a future date and time."
      );
      return;
    }

    setValues({ ...values, dateTime: date });
  };

  const createMeeting = async (dateTime: Date, description: string = "") => {
    if (!client || !user) return null;

    try {
      const id = generateUniqueId();
      const call = client.call("default", id);

      if (!call) throw new Error("Failed to create meeting");

      const startsAt = dateTime.toISOString();
      const meetingDescription = description || "Meeting";

      const creatorDetails: UserDetails = {
        user_id: user.id,
        name: user.fullName || user.username || user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        image_url: user.imageUrl,
        role: "creator",
      };

      await call.getOrCreate({
        data: {
          settings_override: {
            transcription: {
              language: "en",
              mode: "available",
            },
          },
          starts_at: startsAt,
          custom: {
            description: meetingDescription,
            creator: creatorDetails,
            participants: [creatorDetails],
          },
        },
      });

      setCallDetail(call);
      toast.success("Meeting Created");

      return call;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const createScheduledMeeting = async () => {
    if (!client || !user) return;
    try {
      if (!values.dateTime) {
        toast.error("Please select a date and time");
        return;
      }

      const now = new Date();
      const nextValidSlot = getNextValidTimeSlot();

      if (values.dateTime < now) {
        toast.error(
          "Cannot schedule meetings in the past. Please select a future date and time."
        );
        return;
      }

      if (
        values.dateTime.toDateString() === now.toDateString() &&
        values.dateTime < nextValidSlot
      ) {
        toast.error(
          `Please select a time after ${nextValidSlot.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
        return;
      }

      await createMeeting(values.dateTime, values.description);
    } catch (error: unknown) {
      toast.error(error as string);
    }
  };

  // Create an instant meeting
  const createInstantMeeting = async () => {
    if (!client || !user) return;
    try {
      const now = new Date();
      const call = await createMeeting(now, "Instant Meeting");

      if (call) {
        router.push(`/meeting/${call.id}`);
        setMeetingState(undefined); // Close the modal
      }
    } catch (error) {
      toast.error("Failed to create Meeting");
    }
  };

  if (!client || !user) return <Loader />;

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState("isInstantMeeting")}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="via invitation link"
        className="bg-[#0E78F9]"
        handleClick={() => setMeetingState("isJoiningMeeting")}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        className="bg-[#830EF9]"
        handleClick={() => setMeetingState("isScheduleMeeting")}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Meeting Recordings"
        className="bg-[#F9A90E]"
        handleClick={() => router.push("/recordings")}
      />

      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={createScheduledMeeting}
          dialogTitle="Schedule a Meeting"
          buttonText="Schedule Meeting"
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Add a description
            </label>
            <Textarea
              className="border-none bg-[#252A41] focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={handleDateTimeChange}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-[#252A41] p-2 text-white h-10 focus:outline-none focus:ring-1 focus:ring-[#0E78F9] border-none"
              calendarClassName="bg-[#1C1F2E] border-[#252A41] text-white"
              popperClassName="react-datepicker-dark"
              wrapperClassName="w-full"
              minDate={new Date()} // This prevents selecting past dates
              {...(values.dateTime.toDateString() === new Date().toDateString()
                ? {
                    minTime: getNextValidTimeSlot(),
                    maxTime: new Date(new Date().setHours(23, 45)),
                  }
                : {
                    minTime: new Date(new Date().setHours(0, 0)),
                    maxTime: new Date(new Date().setHours(23, 45)),
                  })}
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast.success("Link Copied");
          }}
          image={"/icons/checked.svg"}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
          dialogTitle="Meeting Successfully Created"
        />
      )}

      <MeetingModal
        isOpen={meetingState === "isJoiningMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={() => router.push(values.link)}
        dialogTitle="Join Meeting"
      >
        <Input
          placeholder="Meeting link"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border-none bg-[#252A41] focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createInstantMeeting}
        dialogTitle="Start Instant Meeting"
      />
    </section>
  );
};

export default MeetingTypeList;
