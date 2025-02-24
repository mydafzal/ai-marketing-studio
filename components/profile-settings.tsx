"use client"

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Settings, User } from 'lucide-react'
import { type User as UserType } from '@/lib/types'
import Onboarding from "./onboarding"
import FacebookAccountSettings from '@/components/facebook-account-settings'
import { cn } from '@/lib/utils'
import ManageSubscription from './manage-subscriptions'

type ProfileSettingsProps = {
  userDetails: UserType | undefined;
  getFacebookBusinessAccounts: (encryptedAccessToken: string) => Promise<any>;
  getFacebookAdAccounts: (encryptedAccessToken: string, business_acc_id: string) => Promise<any>;
  updateFbBusinessAcc: (email: string, accountId: string) => Promise<any>;
  updateFbAccountId: (email: string, fbAccountId: string) => Promise<any>;
  disconnectFacebook: (email: string) => Promise<any>;
  updateOnboardingDetails: (email: string, details: {
    first_name: string;
    last_name: string;
    company_name: string;
    company_description: string;
    website_link: string;
    privacy_policy_link: string;
    preferred_language: string;
    goal: string;
  }) => Promise<any>;
}

export default function ProfileSettings({
  userDetails,
  getFacebookBusinessAccounts,
  getFacebookAdAccounts,
  updateFbBusinessAcc,
  updateFbAccountId,
  disconnectFacebook,
  updateOnboardingDetails }: ProfileSettingsProps) {
  const [openOnboarding, setOpenOnboarding] = React.useState<boolean>(userDetails?.defaultExtraDetails ? false : true)
  const [openFacebookSettings, setOpenFacebookSettings] = React.useState<boolean>(false)
  const [dropdownOpen, setDropdownOpen] = React.useState<boolean>(openOnboarding);

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-9 rounded-full border border-zinc-200 dark:border-zinc-800",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              "focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300",
              "transition-colors"
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
            "w-[280px] p-2",
            "border border-zinc-200 dark:border-zinc-800",
            "bg-white dark:bg-zinc-950",
            "rounded-lg shadow-lg"
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

          <ManageSubscription />

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
            disconnectFacebook={disconnectFacebook}
            updateOnboardingDetails={updateOnboardingDetails}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}