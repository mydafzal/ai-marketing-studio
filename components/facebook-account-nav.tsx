'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import FBAccountDropdown from './fb-account-dropdown'
import { type User } from '@/lib/types'

type Account = {
  name: string
  id: string
  profile_picture_url?: string
}

type FacebookAccountNavProps = {
  userDetails: User | undefined
  getFacebookBusinessAccounts: (encryptedAccessToken: string) => Promise<any>
  getFacebookAdAccounts: (encryptedAccessToken: string, business_acc_id: string) => Promise<any>
  updateFbBusinessAcc: (email: string, accountId: string) => Promise<any>
  updateFbAccountId: (email: string, fbAccountId: string) => Promise<any>
  updateFbPageId: (email: string, pageId: string) => Promise<any>
}

const FacebookAccountNav = ({
  userDetails,
  getFacebookBusinessAccounts,
  getFacebookAdAccounts,
  updateFbBusinessAcc,
  updateFbAccountId,
  updateFbPageId,
}: FacebookAccountNavProps) => {
  const pathname = usePathname()
  const isChatPage = pathname.includes('/chat/')

  // Skip rendering if not on chat page
  if (!isChatPage || !userDetails?.fbMarketingApiKey) {
    return null
  }

  const [selectedFbBusinessAcc, setSelectedFbBusinessAcc] = useState<Account | undefined>()
  const [fbBusinessAccs, setFbBusinessAccs] = useState<Account[] | undefined>(undefined)
  const [selectedFbAdAcc, setSelectedFbAdAcc] = useState<Account | undefined>(undefined)
  const [fbAdAccs, setFbAdAccs] = useState<Account[] | undefined>(undefined)
  const [selectedFbPage, setSelectedFbPage] = useState<Account | undefined>(undefined)
  const [fbPages, setFbPages] = useState<Account[] | undefined>(undefined)
  const [instagramAccounts, setInstagramAccounts] = useState<Account[] | undefined>(undefined)
  const [selectedInstagramAccount, setSelectedInstagramAccount] = useState<Account | undefined>(undefined)

  // Function to initialize all accounts based on user details
  async function initializeAccounts() {
    console.log('Initializing all accounts from user details:', userDetails);
    
    if (!userDetails) return;
    
    // First get business accounts
    if (userDetails.fbMarketingApiKey) {
      const businessAccounts = await getFacebookBusinessAccounts(userDetails.fbMarketingApiKey);
      setFbBusinessAccs(businessAccounts);
      console.log('Fetched business accounts:', businessAccounts);
      
      // Find and set selected business account
      if (userDetails.fbBusinessAccId) {
        const selectedBusiness = businessAccounts.find(acc => String(acc.id) === String(userDetails.fbBusinessAccId));
        if (selectedBusiness) {
          console.log('Setting selected business account:', selectedBusiness);
          setSelectedFbBusinessAcc(selectedBusiness);
          
          // Next get ad accounts for this business
          if (userDetails.fbMarketingApiKey) {
            const adAccounts = await getFacebookAdAccounts(userDetails.fbMarketingApiKey, selectedBusiness.id);
            setFbAdAccs(adAccounts);
            console.log('Fetched ad accounts:', adAccounts);
            
            // Find and set selected ad account
            if (userDetails.fbAccountId) {
              const selectedAd = adAccounts.find(acc => String(acc.id) === String(userDetails.fbAccountId));
              if (selectedAd) {
                console.log('Setting selected ad account:', selectedAd);
                setSelectedFbAdAcc(selectedAd);
              }
            }
          }
          
          // Next get pages for this business
          const pages = await getFacebookPages(selectedBusiness.id);
          // The getFacebookPages function handles page selection and Instagram account fetching
        }
      }
    }
  }

  // Fetch business accounts on component mount
  useEffect(() => {
    if (userDetails?.fbMarketingApiKey) {
      initializeAccounts();
    }
  }, [userDetails])

  // Set selected business account from user details when fbBusinessAccs data is available
  useEffect(() => {
    console.log('User details loaded:', userDetails);
    if (userDetails) {
      console.log('Business account ID:', userDetails.fbBusinessAccId);
      console.log('Ad account ID:', userDetails.fbAccountId);
      console.log('Page ID:', userDetails.fbPageId);
      console.log('Instagram pairing:', userDetails.instagramFbPagePairing);
    }
    
    if (userDetails?.fbBusinessAccId && fbBusinessAccs) {
      console.log('Business accounts available:', fbBusinessAccs.map(acc => ({ id: acc.id, name: acc.name })));
      const businessAcc = fbBusinessAccs.find((acc) => acc.id === `${userDetails?.fbBusinessAccId}`)
      console.log('Selected business account:', businessAcc || 'Not found');
      setSelectedFbBusinessAcc(businessAcc)
      
      // Fetch pages for existing business account
      if (businessAcc && !fbPages) {
        console.log('Fetching pages for business account:', businessAcc.id);
        getFacebookPages(businessAcc.id)
      }
    }
    
    // Keep existing simple setting for initial render
    if (userDetails?.fbAccountId && !fbAdAccs) {
      console.log('Setting initial ad account ID:', userDetails.fbAccountId);
      setSelectedFbAdAcc({
        id: userDetails?.fbAccountId,
        name: userDetails?.fbAccountId.split("act_")[1] || "Loading..."
      })
    }
  }, [fbBusinessAccs, userDetails, fbPages, fbAdAccs])
  
  // We've moved the page selection logic to getFacebookPages function for immediate selection
  // This useEffect is a backup in case the selection in getFacebookPages doesn't work
  useEffect(() => {
    if (userDetails?.fbPageId && fbPages && fbPages.length > 0 && !selectedFbPage) {
      console.log('Backup effect: trying to find page with ID:', userDetails.fbPageId);
      console.log('Current fbPages:', fbPages.map(page => ({ id: page.id, name: page.name })));
      
      // First try exact match
      let page = fbPages.find((page) => page.id === userDetails.fbPageId);
      
      // If not found, try with string conversion (in case of type mismatch)
      if (!page) {
        console.log('Trying string comparison for FB page ID match');
        page = fbPages.find((page) => String(page.id) === String(userDetails.fbPageId));
      }
      
      if (page) {
        console.log('Backup effect: found page to select:', page);
        setSelectedFbPage(page);
        
        // Fetch Instagram accounts if we have a selected page but no Instagram accounts yet
        if (!instagramAccounts) {
          console.log('Backup effect: fetching Instagram accounts for page:', page.id);
          getInstagramAccounts();
        }
      } else {
        console.log('Backup effect: could not find page with ID:', userDetails.fbPageId);
        console.log('Available page IDs:', fbPages.map((page) => page.id));
      }
    } else {
      console.log('Backup effect conditions not met:',
        'userDetails?.fbPageId:', !!userDetails?.fbPageId,
        'fbPages:', !!fbPages,
        'fbPages.length > 0:', fbPages ? fbPages.length > 0 : false,
        '!selectedFbPage:', !selectedFbPage
      );
    }
  }, [fbPages, userDetails?.fbPageId, instagramAccounts, selectedFbPage])

  // Fetch ad accounts when business account changes
  useEffect(() => {
    async function getAdAccAPICall() {
      if (userDetails?.fbMarketingApiKey && selectedFbBusinessAcc) {
        const data = await getFacebookAdAccounts(userDetails?.fbMarketingApiKey, selectedFbBusinessAcc.id)
        setFbAdAccs(data)
      }
    }
    getAdAccAPICall()
  }, [selectedFbBusinessAcc, userDetails])
  
  // Update ad account with proper name when fbAdAccs is loaded
  useEffect(() => {
    if (userDetails?.fbAccountId && fbAdAccs && fbAdAccs.length > 0) {
      const adAccount = fbAdAccs.find(acc => acc.id === userDetails.fbAccountId)
      if (adAccount) {
        setSelectedFbAdAcc(adAccount)
      }
    }
  }, [fbAdAccs, userDetails?.fbAccountId])

  async function getFacebookPages(businessAccountId: string) {
    try {
      console.log('Get Facebook pages for business account:', businessAccountId);
      const response = await fetch('/api/fasty-bot/proxy-get-facebook-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessAccountId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response from get FB pages:', errorData);
        throw new Error(errorData.error || 'Failed to fetch Facebook pages')
      }
      
      // Get raw text first to see exact response
      const responseText = await response.text();
      console.log('Raw Facebook pages response:', responseText);
      
      // Parse JSON after logging the raw text
      const data = JSON.parse(responseText);
      console.log('Parsed Facebook Pages:', data);
      
      if (Array.isArray(data)) {
        setFbPages(data);
        
        // Log all pages with their IDs for debugging
        console.log('Page IDs in response:', data.map(page => ({ id: page.id, name: page.name })));
        
        // If user has a selected page ID, find and set it here when pages are first fetched
        if (userDetails?.fbPageId) {
          console.log('Looking for page with ID:', userDetails.fbPageId);
          
          // First try exact match
          let page = data.find((page: Account) => page.id === userDetails.fbPageId);
          
          // If not found, try with string conversion (in case of type mismatch)
          if (!page) {
            page = data.find((page: Account) => String(page.id) === String(userDetails.fbPageId));
            console.log('Trying string comparison for page ID match');
          }
          
          if (page) {
            console.log('Found page to autoselect:', page);
            setSelectedFbPage(page);
            
            // Also fetch Instagram accounts if page is found and selected
            console.log('Fetching Instagram accounts for page:', page.id);
            getInstagramAccounts();
          } else {
            console.log('Page with ID not found in response:', userDetails.fbPageId);
            console.log('Available page IDs:', data.map((page: Account) => page.id));
          }
        } else {
          console.log('No page ID in user details to select');
        }
      } else {
        console.error('Facebook pages response is not an array:', data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      return [];
    }
  }
  
  async function getInstagramAccounts() {
    try {
      console.log('Fetching Instagram accounts');
      const response = await fetch('/api/fasty-bot/proxy-get-instagram-pages', {
        method: 'GET',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response from Instagram accounts fetch:', errorData);
        throw new Error(errorData.error || 'Failed to fetch Instagram accounts')
      }
      
      // Get raw text first to see exact response
      const responseText = await response.text();
      console.log('Raw Instagram accounts response:', responseText);
      
      // Parse JSON after logging the raw text
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed Instagram Accounts:', data);
      } catch (parseError) {
        console.error('Error parsing Instagram accounts response:', parseError);
        data = [];
      }
      
      // Always set the accounts even if empty, so the dropdown knows whether to display
      if (Array.isArray(data)) {
        setInstagramAccounts(data);
        
        // Log all Instagram accounts with their IDs for debugging
        console.log('Instagram account IDs in response:', data.map((acc: Account) => ({ id: acc.id, name: acc.name })));
        
        // Check if we have an Instagram account ID stored in the user data
        if (userDetails?.instagramFbPagePairing && userDetails?.fbPageId) {
          console.log('Instagram pairing found:', userDetails.instagramFbPagePairing);
          
          try {
            // Format is "instagramId.fbPageId"
            const pairingString = String(userDetails.instagramFbPagePairing);
            const parts = pairingString.split('.');
            console.log('Instagram pairing parts:', parts);
            
            if (parts.length === 2) {
              const instagramId = parts[0];
              const pairedPageId = parts[1];
              
              console.log('Extracted Instagram ID:', instagramId);
              console.log('Paired Page ID:', pairedPageId);
              console.log('Current Page ID:', userDetails.fbPageId);
              
              // Compare as strings to handle potential type differences
              if (String(pairedPageId) === String(userDetails.fbPageId)) {
                console.log('Page IDs match, looking for Instagram account with ID:', instagramId);
                
                // Log full detailed comparison for debugging
                console.log('Instagram data type:', typeof data);
                console.log('Instagram data structure sample:', data.length > 0 ? data[0] : 'No accounts');
                console.log('Instagram id value format:', data.length > 0 ? typeof data[0].id : 'N/A');
                console.log('Looking for exact match on:', instagramId, 'type:', typeof instagramId);
                console.log('All available IDs:', data.map(acc => acc.id));
                
                // First try exact match
                let instagramAccount = data.find((acc: Account) => acc.id === instagramId);
                
                // If not found, try with string conversion (in case of type mismatch)
                if (!instagramAccount) {
                  console.log('No exact match found, trying string comparison');
                  instagramAccount = data.find((acc: Account) => String(acc.id) === String(instagramId));
                  // Try case insensitive comparison as well
                  if (!instagramAccount) {
                    console.log('Trying case-insensitive comparison');
                    instagramAccount = data.find((acc: Account) => 
                      String(acc.id).toLowerCase() === String(instagramId).toLowerCase());
                  }
                }
                
                if (instagramAccount) {
                  console.log('Found Instagram account to autoselect:', instagramAccount);
                  setSelectedInstagramAccount(instagramAccount);
                } else {
                  console.log('Could not find Instagram account with ID:', instagramId);
                  console.log('Available Instagram account IDs:', data.map((acc: Account) => acc.id));
                  
                  // Additional attempt: Try searching through various potential ID formatting
                  console.log('Trying additional Instagram ID matching methods');
                  
                  // Sometimes Instagram IDs have different formats in different APIs
                  // Try matching just by digits if it's a numeric ID
                  const numericInstagramId = String(instagramId).replace(/\D/g, '');
                  const numericMatch = data.find((acc: Account) => 
                    String(acc.id).replace(/\D/g, '') === numericInstagramId);
                  
                  if (numericMatch) {
                    console.log('Found Instagram account by numeric ID match:', numericMatch);
                    setSelectedInstagramAccount(numericMatch);
                  } else {
                    // If all else fails and we have accounts, select the first one
                    if (data.length > 0) {
                      console.log('No matching Instagram account found, using first account as fallback:', data[0]);
                      setSelectedInstagramAccount(data[0]);
                    }
                  }
                }
              } else {
                console.log(`Instagram pairing page ID (${pairedPageId}) doesn't match current page ID (${userDetails.fbPageId})`);
                console.log('Type comparison:', typeof pairedPageId, typeof userDetails.fbPageId);
              }
            } else {
              console.log('Instagram pairing format invalid - should be "instagramId.fbPageId"');
            }
          } catch (error) {
            console.error('Error parsing Instagram account pairing:', error);
          }
        } else {
          console.log('No Instagram pairing found in user details');
        }
      } else {
        console.error('Instagram accounts response is not an array:', data);
        setInstagramAccounts([]);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error);
      // Return empty array but still set state to empty array
      const emptyArray: Account[] = [];
      setInstagramAccounts(emptyArray);
      return emptyArray;
    }
  }

  async function selectBusinessAccount(id: string) {
    if (fbBusinessAccs && userDetails) {
      setSelectedFbBusinessAcc(fbBusinessAccs.find((acc) => acc.id === id))
      await updateFbBusinessAcc(userDetails?.email, id)
      
      // Reset page and Instagram selection when business account changes
      setSelectedFbPage(undefined)
      setSelectedInstagramAccount(undefined)
      setInstagramAccounts(undefined)
      
      // Fetch pages for the selected business account
      await getFacebookPages(id)
    }
  }

  async function selectAdAccount(id: string) {
    if (fbAdAccs && userDetails) {
      setSelectedFbAdAcc(fbAdAccs.find((acc) => acc.id === id))
      await updateFbAccountId(userDetails?.email, id)
    }
  }
  
  async function selectPage(id: string) {
    if (fbPages && userDetails) {
      const selectedPage = fbPages.find((page) => page.id === id)
      setSelectedFbPage(selectedPage)
      
      try {
        const result = await updateFbPageId(userDetails.email, id)
        
        if (result.success) {
          // When a Facebook page is selected, fetch Instagram accounts
          await getInstagramAccounts()
        }
      } catch (error) {
        console.error('Exception updating page ID:', error)
      }
    }
  }
  
  async function selectInstagramAccount(id: string) {
    if (instagramAccounts && userDetails && selectedFbPage) {
      const selectedAccount = instagramAccounts.find((account) => account.id === id)
      setSelectedInstagramAccount(selectedAccount)
      
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
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update Instagram account ID')
        }
      } catch (error) {
        console.error('Error updating Instagram account ID:', error)
      }
    }
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800 h-12 px-4 shadow-sm">
      <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center">
        <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-zinc-200 py-1 px-2 bg-white dark:bg-zinc-900 shadow-sm rounded-full mx-auto border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center">
            <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">Business Account</span>
            <FBAccountDropdown
              title="Business"
              selectedAcccount={selectedFbBusinessAcc}
              accounts={fbBusinessAccs}
              handleAccountChange={selectBusinessAccount}
              className="nav-bar m-0"
            />
          </div>
          
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
          
          <div className="flex items-center">
            <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">Ad Account</span>
            <FBAccountDropdown
              title="Ads"
              selectedAcccount={selectedFbAdAcc}
              accounts={fbAdAccs}
              handleAccountChange={selectAdAccount}
              className="nav-bar m-0"
            />
          </div>
          
          {fbPages && (
            <>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
              <div className="flex items-center">
                <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">FB Page</span>
                <FBAccountDropdown
                  title="Page"
                  selectedAcccount={selectedFbPage}
                  accounts={fbPages}
                  handleAccountChange={selectPage}
                  className="nav-bar m-0"
                />
              </div>
            </>
          )}
          
          {selectedFbPage && (
            <>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
              <div className="flex items-center">
                <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">Instagram Account</span>
                <FBAccountDropdown
                  title="Instagram"
                  selectedAcccount={selectedInstagramAccount}
                  accounts={instagramAccounts || []}
                  handleAccountChange={selectInstagramAccount}
                  className="nav-bar m-0"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FacebookAccountNav