"use client"

import React, { SetStateAction } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { usePathname } from 'next/navigation';
import { Facebook, AlertCircle } from 'lucide-react';
import FacebookConnect from "@/components/facebook-connect";
import FBAccountDropdown from "./fb-account-dropdown";
import { isFeatureToggleEnabled } from "@/lib/helpers/feature-toggle/feature-toggle-manager";
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { type User } from '@/lib/types';

type Account = {
  name: string;
  id: string;
}

type FacebookAccountSettingsProps = {
  userDetails: User | undefined;
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
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

const FacebookAccountSettings = ({
  userDetails,
  open,
  setOpen,
  getFacebookBusinessAccounts,
  getFacebookAdAccounts,
  updateFbBusinessAcc,
  updateFbAccountId,
  disconnectFacebook,
  updateOnboardingDetails,
}: FacebookAccountSettingsProps) => {
  const pathname = usePathname();
  const isChatPage = pathname.includes("/chat/");

  const [error, setError] = React.useState<string | null>(null);
  const [selectedFbBusinessAcc, setSelectedFbBusinessAcc] = React.useState<Account | undefined>();
  const [fbBusinessAccs, setFbBusinessAccs] = React.useState<Account[] | undefined>(undefined);
  const [selectedFbAdAcc, setSelectedFbAdAcc] = React.useState<Account | undefined>(undefined);
  const [fbAdAccs, setFbAdAccs] = React.useState<Account[] | undefined>(undefined);
  const [facebookConnected, setFacebookConnected] = React.useState(userDetails?.fbMarketingApiKey ? true : false);
  const [adAccountSelected, setAdAccountSelected] = React.useState(userDetails?.fbAccountId ? true : false);

  function handleClose() {
    if (isFeatureToggleEnabled("enforceUserApiKey")) {
      if (facebookConnected) {
        if (adAccountSelected) {
          setOpen(false);
        } else {
          setError("Please complete Ad Account selection before proceeding");
        }
      } else {
        setError("Please link your account before proceeding");
      }
    } else {
      setOpen(false);
    }
  }

  async function getBusinessAPICall() {
    if (userDetails?.fbMarketingApiKey) {
      const data = await getFacebookBusinessAccounts(userDetails?.fbMarketingApiKey);
      setFbBusinessAccs(data);
    }
  }

  async function getAdAccAPICall() {
    if (userDetails?.fbMarketingApiKey && selectedFbBusinessAcc) {
      const data = await getFacebookAdAccounts(userDetails?.fbMarketingApiKey, selectedFbBusinessAcc.id);
      setFbAdAccs(data);
    }
  }

  async function selectBusinessAccount(id: string) {
    if (fbBusinessAccs && userDetails) {
      setSelectedFbBusinessAcc(fbBusinessAccs.find((acc) => acc.id === id));
      await updateFbBusinessAcc(userDetails?.email, id);
    }
  }

  async function selectAdAccount(id: string) {
    if (fbAdAccs && userDetails) {
      setSelectedFbAdAcc(fbAdAccs.find((acc) => acc.id === id));
      await updateFbAccountId(userDetails?.email, id);
      setAdAccountSelected(true);
    }
  }

  async function handleDisconnectFacebook() {
    if (userDetails) {
      await disconnectFacebook(userDetails?.email);
      window.location.reload();
    }
  }

  React.useEffect(() => {
    getBusinessAPICall();
  }, []);

  React.useEffect(() => {
    if (userDetails?.fbBusinessAccId && fbBusinessAccs) {
      setSelectedFbBusinessAcc(fbBusinessAccs.find((acc) => acc.id === `${userDetails?.fbBusinessAccId}`));
    }
    if (userDetails?.fbAccountId) {
      setSelectedFbAdAcc({
        id: userDetails?.fbAccountId,
        name: userDetails?.fbAccountId.split("act_")[1]
      });
    }
  }, [fbBusinessAccs]);

  React.useEffect(() => {
    setTimeout(() => {
      setError(null);
    }, 5000);
  }, [error]);

  React.useEffect(() => {
    getAdAccAPICall();
  }, [selectedFbBusinessAcc]);

  if (!isChatPage) {
    return null;
  }

  return (
    <Dialog.Root modal={true} open={open} onOpenChange={() => null}>
      <Dialog.Trigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          onClick={() => setOpen(true)}
        >
          <div className="bg-blue-500 rounded-lg p-1">
            <Facebook className="size-4 text-white" />
          </div>
          Facebook Settings
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
                    data-[state=open]:animate-in data-[state=closed]:animate-out 
                    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
        />
        <Dialog.Content 
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-zinc-200 dark:border-zinc-800",
            "bg-white p-6 shadow-lg duration-200 dark:bg-zinc-900",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          )}
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center text-2xl font-bold text-zinc-800 dark:text-white">
              <span>Reeply AI</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 w-full text-sm rounded-lg border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="w-full text-center space-y-2">
              <Dialog.Title className="text-xl font-semibold text-zinc-800 dark:text-white">
                {facebookConnected ? "Manage Facebook Account" : "Connect Facebook Account"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-zinc-600 dark:text-zinc-400">
                {facebookConnected
                    ? "You can change your active Ads account or disconnect Facebook account"
                    : <>
                      <p className="mb-2 text-zinc-500 dark:text-zinc-300">
                        To easily create and manage campaigns, you&#39;ll need to connect with Facebook and grant Reeply AI software the following access rights:
                      </p>
                      <ul className="list-disc list-inside text-zinc-500 dark:text-zinc-300">
                        <li>Receive your email address</li>
                        <li>Manage ads for ad accounts that you have access to</li>
                        <li>Access your Facebook ads and related stats</li>
                        <li>Manage your business</li>
                        <li>Access leads for your Pages</li>
                        <li>Create and manage ads for your Page</li>
                        <li>Show a list of the Pages you manage</li>
                      </ul>
                    </>
                }
              </Dialog.Description>

            </div>

            {userDetails?.fbMarketingApiKey && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                <FBAccountDropdown
                  title="Select Business Account"
                  selectedAcccount={selectedFbBusinessAcc}
                  accounts={fbBusinessAccs}
                  handleAccountChange={selectBusinessAccount}
                />
                <FBAccountDropdown
                  title="Select Ad Account"
                  selectedAcccount={selectedFbAdAcc}
                  accounts={fbAdAccs}
                  handleAccountChange={selectAdAccount}
                />
              </div>
            )}

            <div className="pt-2">
              {facebookConnected ? (
                <Button
                  onClick={handleDisconnectFacebook}
                  variant="destructive"
                  className="gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  <Facebook className="size-4" />
                  Disconnect Facebook
                </Button>
              ) : (
                <FacebookConnect />
              )}
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              onClick={handleClose}
              className={cn(
                "absolute right-4 top-4 rounded-full p-2 opacity-70 transition-all",
                "hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                "focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
                "dark:focus:ring-zinc-200 dark:ring-offset-zinc-900",
              )}
            >
              <Cross2Icon className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FacebookAccountSettings;