"use client"

import React, { useState, useEffect } from 'react'
import FBAccountDropdown from './fb-account-dropdown'
import { cn } from '@/lib/utils'

type Account = {
  name: string;
  id: string;
  profile_picture_url?: string;
}

type NavbarDropdownsProps = {
  userDetails: any;
  getFacebookBusinessAccounts: (encryptedAccessToken: string) => Promise<any>;
  getFacebookAdAccounts: (encryptedAccessToken: string, business_acc_id: string) => Promise<any>;
  updateFbBusinessAcc: (email: string, accountId: string) => Promise<any>;
  updateFbAccountId: (email: string, fbAccountId: string) => Promise<any>;
  updateFbPageId: (email: string, pageId: string) => Promise<any>;
}

const NavbarDropdowns = ({
  userDetails,
  getFacebookBusinessAccounts,
  getFacebookAdAccounts,
  updateFbBusinessAcc,
  updateFbAccountId,
  updateFbPageId,
}: NavbarDropdownsProps) => {
  const [selectedFbBusinessAcc, setSelectedFbBusinessAcc] = useState<Account | undefined>();
  const [fbBusinessAccs, setFbBusinessAccs] = useState<Account[] | undefined>(undefined);
  const [selectedFbAdAcc, setSelectedFbAdAcc] = useState<Account | undefined>(undefined);
  const [fbAdAccs, setFbAdAccs] = useState<Account[] | undefined>(undefined);
  const [selectedFbPage, setSelectedFbPage] = useState<Account | undefined>(undefined);
  const [fbPages, setFbPages] = useState<Account[] | undefined>(undefined);
  const [instagramAccounts, setInstagramAccounts] = useState<Account[] | undefined>(undefined);
  const [selectedInstagramAccount, setSelectedInstagramAccount] = useState<Account | undefined>(undefined);

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

  async function getFacebookPages(businessAccountId: string) {
    try {
      const response = await fetch('/api/fasty-bot/proxy-get-facebook-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessAccountId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Facebook pages');
      }
      
      const data = await response.json();
      setFbPages(data);
      return data;
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      return [];
    }
  }
  
  async function getInstagramAccounts() {
    try {
      const response = await fetch('/api/fasty-bot/proxy-get-instagram-pages', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Instagram accounts');
      }
      
      const data = await response.json();
      setInstagramAccounts(data);
      return data;
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error);
      return [];
    }
  }

  async function selectBusinessAccount(id: string) {
    if (fbBusinessAccs && userDetails) {
      setSelectedFbBusinessAcc(fbBusinessAccs.find((acc) => acc.id === id));
      await updateFbBusinessAcc(userDetails?.email, id);
      
      // Reset page and Instagram selection when business account changes
      setSelectedFbPage(undefined);
      setSelectedInstagramAccount(undefined);
      setInstagramAccounts(undefined);
      
      // Fetch pages for the selected business account
      await getFacebookPages(id);
    }
  }

  async function selectAdAccount(id: string) {
    if (fbAdAccs && userDetails) {
      setSelectedFbAdAcc(fbAdAccs.find((acc) => acc.id === id));
      await updateFbAccountId(userDetails?.email, id);
    }
  }
  
  async function selectPage(id: string) {
    if (fbPages && userDetails) {
      const selectedPage = fbPages.find((page) => page.id === id);
      setSelectedFbPage(selectedPage);
      await updateFbPageId(userDetails.email, id);
      
      // When a Facebook page is selected, fetch Instagram accounts
      await getInstagramAccounts();
    }
  }
  
  async function selectInstagramAccount(id: string) {
    if (instagramAccounts && userDetails && selectedFbPage) {
      const selectedAccount = instagramAccounts.find((account) => account.id === id);
      setSelectedInstagramAccount(selectedAccount);
      
      try {
        const response = await fetch('/api/kv/update-instagram-account-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userDetails.email,
            instagramAccountId: id,
            fbPageId: selectedFbPage.id
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update Instagram account ID');
        }
      } catch (error) {
        console.error('Error updating Instagram account ID:', error);
      }
    }
  }

  useEffect(() => {
    getBusinessAPICall();
  }, [userDetails]);

  useEffect(() => {
    if (userDetails?.fbBusinessAccId && fbBusinessAccs) {
      const businessAcc = fbBusinessAccs.find((acc) => acc.id === `${userDetails?.fbBusinessAccId}`);
      setSelectedFbBusinessAcc(businessAcc);
      
      // Fetch pages for existing business account
      if (businessAcc && !fbPages) {
        getFacebookPages(businessAcc.id);
      }
    }
    if (userDetails?.fbAccountId) {
      setSelectedFbAdAcc({
        id: userDetails?.fbAccountId,
        name: userDetails?.fbAccountId.split("act_")[1]
      });
    }
  }, [fbBusinessAccs, userDetails]);
  
  // Set selected page when fbPages changes
  useEffect(() => {
    if (userDetails?.fbPageId && fbPages && fbPages.length > 0) {
      const page = fbPages.find((page) => page.id === userDetails.fbPageId);
      if (page) {
        setSelectedFbPage(page);
      }
    }
  }, [fbPages, userDetails?.fbPageId]);

  useEffect(() => {
    getAdAccAPICall();
  }, [selectedFbBusinessAcc]);

  return (
    <div className="flex items-center justify-center space-x-6 px-6 py-2 bg-dark-bg border-b border-border-dark w-full">
      <div className="flex items-center">
        <span className="text-xs text-zinc-400 mr-2">Business:</span>
        <FBAccountDropdown
          title=""
          selectedAcccount={selectedFbBusinessAcc}
          accounts={fbBusinessAccs}
          handleAccountChange={selectBusinessAccount}
          compact={true}
          darkMode={true}
        />
      </div>
      
      <div className="flex items-center">
        <span className="text-xs text-zinc-400 mr-2">Ad Account:</span>
        <FBAccountDropdown
          title=""
          selectedAcccount={selectedFbAdAcc}
          accounts={fbAdAccs}
          handleAccountChange={selectAdAccount}
          compact={true}
          darkMode={true}
        />
      </div>
      
      <div className="flex items-center">
        <span className="text-xs text-zinc-400 mr-2">FB Page:</span>
        <FBAccountDropdown
          title=""
          selectedAcccount={selectedFbPage}
          accounts={fbPages}
          handleAccountChange={selectPage}
          compact={true}
          darkMode={true}
        />
      </div>
      
      <div className="flex items-center">
        <span className="text-xs text-zinc-400 mr-2">IG Account:</span>
        <FBAccountDropdown
          title=""
          selectedAcccount={selectedInstagramAccount}
          accounts={instagramAccounts}
          handleAccountChange={selectInstagramAccount}
          compact={true}
          darkMode={true}
        />
      </div>
    </div>
  )
}

export default NavbarDropdowns