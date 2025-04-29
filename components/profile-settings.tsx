'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Settings, User } from 'lucide-react'
import { type User as UserType } from '@/lib/types'
import Onboarding from './onboarding'
import FacebookAccountSettings from '@/components/facebook-account-settings'
import { cn } from '@/lib/utils'

type ProfileSettingsProps = {
  userDetails: UserType | undefined
  getFacebookBusinessAccounts: (encryptedAccessToken: string) => Promise<any>
  getFacebookAdAccounts: (
    encryptedAccessToken: string,
    business_acc_id: string
  ) => Promise<any>
  updateFbBusinessAcc: (email: string, accountId: string) => Promise<any>
  updateFbAccountId: (email: string, fbAccountId: string) => Promise<any>
  updateFbPageId: (email: string, pageId: string) => Promise<any>
  disconnectFacebook: (email: string) => Promise<any>
  updateOnboardingDetails: (
    email: string,
    details: {
      first_name: string
      last_name: string
      company_name: string
      company_description: string
      website_link: string
      privacy_policy_link: string
      preferred_language: string
      goal: string
      company_segment: string
    }
  ) => Promise<any>
}

export default function ProfileSettings({
  userDetails,
  getFacebookBusinessAccounts,
  getFacebookAdAccounts,
  updateFbBusinessAcc,
  updateFbAccountId,
  updateFbPageId,
  disconnectFacebook,
  updateOnboardingDetails
}: ProfileSettingsProps) {
  const [openOnboarding, setOpenOnboarding] = React.useState<boolean>(
    userDetails?.defaultExtraDetails ? false : true
  )
  const [openFacebookSettings, setOpenFacebookSettings] =
    React.useState<boolean>(false)
  const [dropdownOpen, setDropdownOpen] =
    React.useState<boolean>(openOnboarding)

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-9 rounded-full border border-zinc-200 dark:border-zinc-800',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300',
              'transition-colors'
            )}
          >
            <Settings className="size-4 text-zinc-600 dark:text-zinc-400" />
            <span className="sr-only">Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={8}
          align="end"
          className={cn(
            'w-[280px] p-2',
            'border border-zinc-200 dark:border-zinc-800',
            'bg-white dark:bg-zinc-950',
            'rounded-lg shadow-lg'
          )}
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <User className="size-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {userDetails?.first_name} {userDetails?.last_name}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {userDetails?.email}
              </span>
            </div>
          </div>

          <DropdownMenuSeparator className="my-2 bg-zinc-200 dark:bg-zinc-800" />

          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-3 py-2">
            Account Settings
          </div>

          <button
            className="inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            type="button"
            onClick={() => (window.location.href = '/subscription')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.6667 2.91699H2.33341C1.68908 2.91699 1.16675 3.43933 1.16675 4.08366V9.91699C1.16675 10.5613 1.68908 11.0837 2.33341 11.0837H11.6667C12.3111 11.0837 12.8334 10.5613 12.8334 9.91699V4.08366C12.8334 3.43933 12.3111 2.91699 11.6667 2.91699Z"
                stroke="black"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M1.16675 5.83301H12.8334"
                stroke="black"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Billing
          </button>
          
          <button
            className="inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            type="button"
            onClick={() => setOpenFacebookSettings(true)}
          >
            <div className="bg-black dark:bg-white rounded-full size-6 flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                className="text-white dark:text-black"
              >
                <path 
                  fill="currentColor" 
                  d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" 
                />
              </svg>
            </div>
            Facebook Settings
          </button>

          <Onboarding
            userDetails={userDetails}
            open={openOnboarding}
            setOpen={setOpenOnboarding}
            updateOnboardingDetails={updateOnboardingDetails}
          />

          <FacebookAccountSettings
            userDetails={userDetails}
            open={openFacebookSettings}
            setOpen={setOpenFacebookSettings}
            getFacebookBusinessAccounts={getFacebookBusinessAccounts}
            getFacebookAdAccounts={getFacebookAdAccounts}
            updateFbBusinessAcc={updateFbBusinessAcc}
            updateFbAccountId={updateFbAccountId}
            updateFbPageId={updateFbPageId}
            disconnectFacebook={disconnectFacebook}
            updateOnboardingDetails={updateOnboardingDetails}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
