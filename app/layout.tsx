import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/toaster'
import { auth } from '@/auth'

import { getUser } from '@/app/login/actions'
import AnalyticsSetup from '@/components/analytics-setup'

export const metadata = {
  metadataBase: process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : undefined,
  title: {
    default: 'Reeply AI Chatbot',
    template: `Reeply AI Chatbot`
  },
  description: 'An AI-powered chatbot built to support your digital marketing campaigns!',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png'
  }
}

export const viewport = {
  themeColor: '#0A0C14'
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await auth()
  const user = session?.user?.email ? await getUser(session.user.email) : null

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={cn(
          'font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <Toaster />
        <Providers
          attribute="class"
        >
          <div className="flex flex-col min-h-screen bg-[#0A0C14]">
            <Header />
            <main className="flex flex-col flex-1 bg-[#0A0C14]">{children}</main>
          </div>
          <TailwindIndicator />
        </Providers>
        {user && <AnalyticsSetup user={{ email: user.email, name: user.name }} />}
      </body>
    </html>
  )
}