import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "@stream-io/video-react-sdk/dist/css/styles.css";
// import StreamVideoProvider from "@/Providers/StreamClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meet Platform",
  description: "A Meet Platform to share scree and video and get Insights from it",
  icons:{
    icon: '/icons/logo.svg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <ClerkProvider >

    <html lang="en" suppressHydrationWarning>

      <ClerkProvider
        appearance={{
          layout: {
            socialButtonsVariant: "iconButton",
            logoImageUrl: "/icons/meet.svg",
          },
          variables: {
            colorText: "#fff",
            colorPrimary: "#0E78F9",
            colorBackground: "#1C1F2E",
            colorInputBackground: "#252A41",
            colorInputText: "#fff",
          },
        }}
        >
      <body
      // bg-2 = 1C1F2E
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#161925]`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
              {/* {children} */}
            {/* </ThemeProvider> */}
{/* <StreamVideoProvider> */}
        {children}
         <Toaster />
{/* </StreamVideoProvider> */}
        {/* <Toaster /> */}
          </ThemeProvider>
      </body>
      </ClerkProvider>
    </html>
        // </ClerkProvider>
  );
}
