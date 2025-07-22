"use client";

import MeetingTypeList from "@/components/MeetingTypeList";

// Function to get the next 15-minute time slot
const getNextMeetingTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundUpMinutes = Math.ceil(minutes / 15) * 15;
  
  const nextSlot = new Date(now);
  nextSlot.setMinutes(roundUpMinutes);
  nextSlot.setSeconds(0);
  nextSlot.setMilliseconds(0);
  
  // If we're at the end of an hour (minutes > 45), move to the next hour
  if (minutes > 45) {
    nextSlot.setHours(now.getHours() + 1);
    nextSlot.setMinutes(0);
  }
  
  return nextSlot.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Home = () => {
  const now = new Date();

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(
    now
  );

  // Get the next available meeting time
  const nextMeetingTime = getNextMeetingTime();

  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <div className="h-[303px] w-full rounded-[20px] bg-[url(/images/hero-background.png)] bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <h2 className="bg-white/25 backdrop-blur-sm max-w-[273px] rounded py-2 text-center text-base font-normal">
            Upcoming Meeting at: {nextMeetingTime}
          </h2>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold lg:text-7xl">{time}</h1>
            <p className="text-lg font-medium text-sky-1 lg:text-2xl">{date}</p>
          </div>
        </div>
      </div>

      <MeetingTypeList />
    </section>
  );
};

export default Home;