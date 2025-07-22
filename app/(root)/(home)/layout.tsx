import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Metadata } from "next";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Meet Platform",
  description:
    "A Meet Platform to share scree and video and get Insights from it",
  icons: {
    icon: "/icons/logo.svg",
  },
};

const HomeLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="relative">
      <Navbar />

      <div className="flex ">
        <Sidebar />

        <section className="flex min-h-screen flex-1 flex-col px-6 pb-2 pt-20 max-md:pb-10 sm:px-8">
          <div className="w-full">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default HomeLayout;
