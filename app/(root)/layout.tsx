import React, { ReactNode } from 'react'
import StreamVideoProvider from '@/Providers/StreamClientProvider'
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: "Meet Platform",
  description: "A Meet Platform to share scree and video and get Insights from it",
  icons:{
    icon: '/icons/logo.svg'
  }
};

const RootLayout = ({children}: {children : ReactNode}) => {
  return (
    <main>
        <StreamVideoProvider>
        {children}
        </StreamVideoProvider>
    </main>
  )
}

export default RootLayout