import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Meet Platform",
  description: "A Meet Platform to share scree and video and get Insights from it",
  icons:{
    icon: '/icons/logo.svg'
  }
};

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return <div className="flex justify-center items-center relative min-h-screen">{children}</div>;
};

export default AuthLayout;
