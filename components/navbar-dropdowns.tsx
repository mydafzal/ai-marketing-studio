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
      
      // After loading ad accounts, if we have a stored fbAccountId, try to find its name
      if (userDetails?.fbAccountId && data && data.length > 0) {
        const adAccount = data.find((acc: Account) => acc.id === userDetails.fbAccountId);
        if (adAccount) {
          setSelectedFbAdAcc(adAccount);
        } else {
          // If the stored ID isn't in the list, still show it with ID as name
          setSelectedFbAdAcc({
            id: userDetails.fbAccountId,
            name: userDetails.fbAccountId.startsWith("act_") 
              ? userDetails.fbAccountId.split("act_")[1] 
              : userDetails.fbAccountId
          });
        }
      }
    }
  }

  async function getFacebookPages(businessAccountId: string) {
    try {
      console.log('Fetching Facebook pages for business account:', businessAccountId);
      console.log('Current userDetails.fbPageId:', userDetails?.fbPageId);
      
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
      console.log('Facebook pages fetched:', data);
      setFbPages(data);
      
      // If we have a stored fbPageId, find and set the corresponding page
      if (userDetails?.fbPageId && data && data.length > 0) {
        console.log('Looking for Facebook page with ID:', userDetails.fbPageId);
        
        // Log all available page IDs for debugging
        data.forEach((page: Account) => {
          console.log(`Available FB page: ${page.name}, ID: ${page.id}, Type: ${typeof page.id}`);
        });
        console.log(`userDetails.fbPageId: ${userDetails.fbPageId}, Type: ${typeof userDetails.fbPageId}`);
        
        // Convert both to strings for comparison to ensure type matching
        const pageIdToFind = String(userDetails.fbPageId);
        
        const page = data.find((page: Account) => String(page.id) === pageIdToFind);
        
        if (page) {
          console.log('Found matching Facebook page:', page);
          setSelectedFbPage(page);
          
          // When we have a selected FB page, fetch Instagram accounts
          console.log('Fetching Instagram accounts for page:', page.id);
          await getInstagramAccounts(page.id);
        } else {
          console.log('No matching Facebook page found in returned data');
          
          // As a fallback, try finding by string inclusion
          const fallbackPage = data.find((page: Account) => 
            String(page.id).includes(pageIdToFind) || pageIdToFind.includes(String(page.id))
          );
          
          if (fallbackPage) {
            console.log('Found fallback matching Facebook page:', fallbackPage);
            setSelectedFbPage(fallbackPage);
            await getInstagramAccounts(fallbackPage.id);
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      return [];
    }
  }
  
  async function getInstagramAccounts(pageId?: string) {
    try {
      console.log('Fetching Instagram accounts');
      console.log('Current userDetails.instagramAccountId:', userDetails?.instagramAccountId);
      
      const response = await fetch('/api/fasty-bot/proxy-get-instagram-pages', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Instagram accounts');
      }
      
      const data = await response.json();
      console.log('Instagram accounts fetched:', data);
      setInstagramAccounts(data);
      
      // If we have a stored Instagram account ID, find and set it
      if (userDetails?.instagramAccountId && data && data.length > 0) {
        console.log('Looking for Instagram account with ID:', userDetails.instagramAccountId);
        
        // Log all available Instagram account IDs for debugging
        data.forEach((account: Account) => {
          console.log(`Available IG account: ${account.name}, ID: ${account.id}, Type: ${typeof account.id}`);
        });
        console.log(`userDetails.instagramAccountId: ${userDetails.instagramAccountId}, Type: ${typeof userDetails.instagramAccountId}`);
        
        // Convert both to strings for comparison to ensure type matching
        const igIdToFind = String(userDetails.instagramAccountId);
        
        const igAccount = data.find((account: Account) => String(account.id) === igIdToFind);
        
        if (igAccount) {
          console.log('Found matching Instagram account:', igAccount);
          setSelectedInstagramAccount(igAccount);
        } else {
          console.log('No matching Instagram account found in returned data');
          
          // As a fallback, try finding by string inclusion
          const fallbackAccount = data.find((account: Account) => 
            String(account.id).includes(igIdToFind) || igIdToFind.includes(String(account.id))
          );
          
          if (fallbackAccount) {
            console.log('Found fallback matching Instagram account:', fallbackAccount);
            setSelectedInstagramAccount(fallbackAccount);
          }
        }
      }
      
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

  // Fetch user's API token info to get saved account information first
  useEffect(() => {
    const fetchUserTokenInfo = async () => {
      try {
        const response = await fetch('/api/kv/fetch-api-token');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.account) {
            // Store Instagram account ID in userDetails for later use
            if (data.account.instagramAccountId) {
              userDetails.instagramAccountId = data.account.instagramAccountId;
            }
            
            // Make sure we have the latest values from KV store
            if (data.account.fbPageId) {
              userDetails.fbPageId = data.account.fbPageId;
            }
            
            // After getting the latest data, trigger the business accounts fetch
            if (userDetails?.fbMarketingApiKey) {
              getBusinessAPICall();
            }
          }
        }
      } catch (error) {
        console.error('Error fetching API token info:', error);
      }
    };

    if (userDetails?.email) {
      fetchUserTokenInfo();
    } else if (userDetails?.fbMarketingApiKey) {
      // If we don't need to fetch user token info, still load business accounts
      getBusinessAPICall();
    }
  }, [userDetails?.email, userDetails?.fbMarketingApiKey]);

  // When business accounts are loaded, set the selected business account and fetch FB pages
  useEffect(() => {
    if (userDetails?.fbBusinessAccId && fbBusinessAccs && fbBusinessAccs.length > 0) {
      const businessAcc = fbBusinessAccs.find((acc) => acc.id === `${userDetails?.fbBusinessAccId}`);
      if (businessAcc) {
        setSelectedFbBusinessAcc(businessAcc);
        
        // Fetch pages for existing business account
        getFacebookPages(businessAcc.id);
      }
    }
  }, [fbBusinessAccs, userDetails?.fbBusinessAccId]);

  // When business account changes, fetch ad accounts
  useEffect(() => {
    if (selectedFbBusinessAcc) {
      getAdAccAPICall();
    }
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