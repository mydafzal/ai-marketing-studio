import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { auth } from '@/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  IconGitHub,
  IconSeparator,
  IconUser,
  IconVercel
} from '@/components/ui/icons';
import { UserMenu } from '@/components/user-menu';
import { SidebarMobile } from './sidebar-mobile';
import { SidebarToggle } from './sidebar-toggle';
import { ChatHistory } from './chat-history';
import { Session } from '@/lib/types';
import {getUserDetail,updateFbBusinessAcc, updateFbAccountId,disconnectFacebook, updateOnboardingDetails} from '@/app/actions';
import {getFacebookBusinessAccounts, getFacebookAdAccounts} from "@/app/facebook-actions";

import {type User} from '@/lib/types'
import FacebookConnect from '@/components/facebook-connect';
import FacebookAccountSettings from '@/components/facebook-account-settings'
import {isFeatureToggleEnabled} from "@/lib/helpers/feature-toggle/feature-toggle-manager";

async function UserOrLogin() {
  const session = (await auth()) as Session;

  let userDetails;

  const response = await getUserDetail();
  if (response.success){
    userDetails = response.user;
  }
  else{
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
        <IconSeparator className="size-6 text-muted-foreground/50" />
        {session?.user ? (
          <div className='flex justify-between w-full'>
            <UserMenu user={session.user} />
            <div className="flex items-center">
              <Link href="/ai-content" className={cn(buttonVariants({ variant: 'ghost' }), "ml-8")}>
                AI Content
              </Link>
              {isFeatureToggleEnabled('onboardingFeatures') &&
                <FacebookAccountSettings 
                  userDetails={userDetails}
                  getFacebookBusinessAccounts={getFacebookBusinessAccounts}
                  getFacebookAdAccounts={getFacebookAdAccounts}
                  updateFbBusinessAcc={updateFbBusinessAcc}
                  updateFbAccountId={updateFbAccountId}
                  disconnectFacebook={disconnectFacebook}
                  updateOnboardingDetails={updateOnboardingDetails}
                />
              }
            </div>
          </div>
        ) : (
          <Button variant="link" asChild className="-ml-2">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center w-full">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
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
  );
}