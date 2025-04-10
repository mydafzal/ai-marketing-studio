import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconGitHub,
  IconSeparator,
  IconUser,
  IconVercel
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { Session } from '@/lib/types'
import { getUserDetail, updateFbBusinessAcc, updateFbAccountId, updateFbPageId, disconnectFacebook, updateOnboardingDetails } from '@/app/actions'
import { getFacebookBusinessAccounts, getFacebookAdAccounts } from '@/app/facebook-actions'
import { type User } from '@/lib/types'
import FacebookConnect from '@/components/facebook-connect'
import FacebookAccountSettings from '@/components/facebook-account-settings'
import { isFeatureToggleEnabled } from '@/lib/helpers/feature-toggle/feature-toggle-manager'
import ProfileSettings from '@/components/profile-settings'
import { ThemeToggle } from './theme-toggle'

async function UserOrLogin() {
  const session = (await auth()) as Session

  let userDetails

  const response = await getUserDetail()
  if (response.success) {
    userDetails = response.user
  } else {
    console.log(response.error)
  }

  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
        <Link href="/new" rel="nofollow">
          <img
            src="/Reeply-logo-schwarz.png"
            alt="Reeply Logo"
            className="mr-2 dark:hidden"
            style={{ width: '80px', height: 'auto' }}
          />
          <img
            src="/logo-white.png"
            alt="Reeply Logo"
            className="hidden mr-2 dark:block"
            style={{ width: '80px', height: 'auto' }}
          />
        </Link>
      )}
      <div className="flex items-center w-full">
        <IconSeparator className="size-6 text-border-dark" />
        {session?.user ? (
          <div className="flex justify-between w-full">
            <UserMenu user={session.user} />
            <div className="flex items-center">
              <Link href="/" className={cn(buttonVariants({ variant: 'ghost' }), 'ml-8 text-text-white hover:text-primary-green hover:bg-dark-bg')}>
                AI Marketer
              </Link>
              <Link
                href="/ai-content"
                className={cn(buttonVariants({ variant: 'ghost' }), 'ml-8 text-text-white hover:text-primary-green hover:bg-dark-bg')}
              >
                AI Creatives Generator
              </Link>

              {/* <Link
                href="/content-folder"
                className={cn(buttonVariants({ variant: 'ghost' }), 'ml-8')}
              >
                Content Library
              </Link>*/}
              
              {/* Theme toggle removed */}
              
              <ProfileSettings
                userDetails={userDetails}
                getFacebookBusinessAccounts={getFacebookBusinessAccounts}
                getFacebookAdAccounts={getFacebookAdAccounts}
                updateFbBusinessAcc={updateFbBusinessAcc}
                updateFbAccountId={updateFbAccountId}
                updateFbPageId={updateFbPageId}
                disconnectFacebook={disconnectFacebook}
                updateOnboardingDetails={updateOnboardingDetails}
              />
            </div>
          </div>
        ) : (
          <Link href="/login" className={cn(buttonVariants({ variant: 'link' }), '-ml-2 text-primary-green hover:text-primary-green/90')}>
            Login
          </Link>
        )}
      </div>
    </>
  )
}

export async function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b border-border-dark shrink-0 bg-dark-bg backdrop-blur-xl">
      <div className="flex items-center w-full">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          {/* @ts-ignore */}
          <UserOrLogin />
        </React.Suspense>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <a
          target="_blank"
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }))}
          style={{ display: 'none' }}
        >
          <span className="ml-2">New Chat</span>
        </a>
        <a
          href="https://vercel.com/templates/Next.js/nextjs-ai-chatbot"
          target="_blank"
          className={cn(buttonVariants())}
          style={{ display: 'none' }}
        >
          <IconUser className="mr-2" />
          <span className="block">My Account</span>
        </a>
      </div>
    </header>
  )
}