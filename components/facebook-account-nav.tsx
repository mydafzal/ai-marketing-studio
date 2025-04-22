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
      console.log('Selecting business account:', id);
      const selectedAcc = fbBusinessAccs.find((acc) => acc.id === id);
      if (selectedAcc) {
        console.log('Found business account to select:', selectedAcc);
        // Set UI state first for better UX
        setSelectedFbBusinessAcc(selectedAcc);
        
        try {
          console.log('Updating business account in database...');
          const result = await updateFbBusinessAcc(userDetails.email, id);
          console.log('Business account update result:', result);
          
          if (!result.success) {
            console.error('Server returned error for business account update:', result.error);
            throw new Error(result.error || 'Unknown error updating business account');
          }
          
          // Verify that the database update was successful by checking the returned ID
          if (result.newId !== id) {
            console.warn(`Business account ID mismatch: expected ${id}, got ${result.newId}`);
          }
          
          // Reset page and Instagram selection when business account changes
          setSelectedFbPage(undefined);
          setSelectedInstagramAccount(undefined);
          setInstagramAccounts(undefined);
          
          // Fetch pages for the selected business account
          console.log('Fetching pages for newly selected business account');
          await getFacebookPages(id);
          
          return result;
        } catch (error) {
          console.error('Error updating business account ID in database:', error);
          // Revert UI state on error
          if (userDetails.fbBusinessAccId) {
            const originalAcc = fbBusinessAccs.find(acc => acc.id === userDetails.fbBusinessAccId);
            if (originalAcc) {
              setSelectedFbBusinessAcc(originalAcc);
            }
          }
          throw error; // Re-throw to propagate to the UI
        }
      } else {
        const error = new Error(`Could not find business account with ID: ${id}`);
        console.error(error);
        throw error;
      }
    } else {
      const error = new Error('Cannot select business account - missing user data or business accounts');
      console.error('Cannot select business account - missing data:', { 
        hasFbBusinessAccs: !!fbBusinessAccs, 
        hasUserDetails: !!userDetails 
      });
      throw error;
    }
  }

  async function selectAdAccount(id: string) {
    if (fbAdAccs && userDetails) {
      console.log('Selecting ad account:', id);
      const selectedAcc = fbAdAccs.find((acc) => acc.id === id);
      if (selectedAcc) {
        console.log('Found ad account to select:', selectedAcc);
        setSelectedFbAdAcc(selectedAcc);
        
        try {
          console.log('Updating ad account in database...');
          const result = await updateFbAccountId(userDetails.email, id);
          console.log('Ad account update result:', result);
        } catch (error) {
          console.error('Error updating ad account ID in database:', error);
        }
      } else {
        console.error('Could not find ad account with ID:', id);
      }
    } else {
      console.error('Cannot select ad account - missing data:', { 
        hasFbAdAccs: !!fbAdAccs, 
        hasUserDetails: !!userDetails 
      });
    }
  }
  
  async function selectPage(id: string) {
    if (fbPages && userDetails) {
      console.log('Selecting Facebook page:', id);
      const selectedPage = fbPages.find((page) => page.id === id);
      if (selectedPage) {
        console.log('Found page to select:', selectedPage);
        setSelectedFbPage(selectedPage);
        
        try {
          console.log('Updating page ID in database...');
          const result = await updateFbPageId(userDetails.email, id);
          console.log('Page update result:', result);
          
          if (result.success) {
            console.log('Page ID updated successfully, fetching Instagram accounts');
            // When a Facebook page is selected, fetch Instagram accounts
            await getInstagramAccounts();
          } else {
            console.error('Failed to update page ID in database:', result);
          }
        } catch (error) {
          console.error('Exception updating page ID:', error);
        }
      } else {
        console.error('Could not find page with ID:', id);
      }
    } else {
      console.error('Cannot select page - missing data:', { 
        hasFbPages: !!fbPages, 
        hasUserDetails: !!userDetails 
      });
    }
  }
  
  async function selectInstagramAccount(id: string) {
    if (instagramAccounts && userDetails && selectedFbPage) {
      console.log('Selecting Instagram account:', id);
      const selectedAccount = instagramAccounts.find((account) => account.id === id);
      if (selectedAccount) {
        console.log('Found Instagram account to select:', selectedAccount);
        setSelectedInstagramAccount(selectedAccount);
        
        try {
          console.log('Updating Instagram account ID in database...');
          console.log('Data being sent:', {
            email: userDetails.email,
            instagramAccountId: id,
            fbPageId: selectedFbPage.id
          });
          
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
            console.error('Server returned an error:', errorData);
            throw new Error(errorData.error || 'Failed to update Instagram account ID');
          }
          
          const result = await response.json();
          console.log('Instagram account update result:', result);
        } catch (error) {
          console.error('Error updating Instagram account ID:', error);
        }
      } else {
        console.error('Could not find Instagram account with ID:', id);
      }
    } else {
      console.error('Cannot select Instagram account - missing data:', { 
        hasInstagramAccounts: !!instagramAccounts, 
        hasUserDetails: !!userDetails,
        hasSelectedFbPage: !!selectedFbPage
      });
    }
  }

  // State to track save status
  const [saveStatus, setSaveStatus] = useState<{
    type: 'business' | 'ad' | 'page' | 'instagram' | null;
    status: 'saving' | 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, status: null, message: null });

  // Function to show save status
  const showSaveStatus = (type: 'business' | 'ad' | 'page' | 'instagram', status: 'saving' | 'success' | 'error', message: string = '') => {
    setSaveStatus({ type, status, message });
    
    // Clear status after 3 seconds
    setTimeout(() => {
      setSaveStatus({ type: null, status: null, message: null });
    }, 3000);
  };
  
  // Function to refresh the component's state from the server
  const refreshUserDetails = async () => {
    try {
      if (!userDetails?.email) return;
      
      // Manual state refresh - fetch latest user data to confirm updates
      console.log('Refreshing user details from server...');
      
      // This is a direct fetch to get the most current user data
      const response = await fetch(`/api/admin/fetch-client-by-email?email=${encodeURIComponent(userDetails.email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Refreshed user details:', result);
        
        if (result.success && result.data) {
          const refreshedData = result.data;
          
          // Check if business account ID has changed
          if (refreshedData.fbBusinessAccId !== userDetails.fbBusinessAccId) {
            console.log('Business account ID change detected:', {
              current: userDetails.fbBusinessAccId,
              new: refreshedData.fbBusinessAccId
            });
            
            // Show a refresh notification before reloading
            showSaveStatus('business', 'saving', 'Refreshing page...');
            
            // Create and show a toast-like notification
            const notification = document.createElement('div');
            notification.innerHTML = `
              <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                font-size: 16px;
                z-index: 9999;
                text-align: center;
              ">
                <div style="margin-bottom: 8px;">Refreshing page to update account changes</div>
                <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite;"></div>
              </div>
              <style>
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              </style>
            `;
            document.body.appendChild(notification);
            
            // Force a page refresh to get the updated state from the server
            setTimeout(() => {
              window.location.reload();
            }, 1500); // Wait 1.5s for the refresh notification to be visible
          } else {
            console.log('No changes detected in business account ID');
          }
        }
      } else {
        console.error('Failed to fetch user details:', await response.text());
      }
    } catch (error) {
      console.error('Error refreshing user details:', error);
    }
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800 h-12 px-4 shadow-sm">
      <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center">
        <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-zinc-200 py-1 px-2 bg-white dark:bg-zinc-900 shadow-sm rounded-full mx-auto border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center relative" data-business-account-container>
            <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">Business Account</span>
            <FBAccountDropdown
              title="Business"
              selectedAcccount={selectedFbBusinessAcc}
              accounts={fbBusinessAccs}
              handleAccountChange={(id) => {
                console.log('Business account selected with ID:', id);
                showSaveStatus('business', 'saving', 'Updating business account...');
                selectBusinessAccount(id)
                  .then((result) => {
                    console.log('Business account update result:', result);
                    showSaveStatus('business', 'success', 'Business account updated - refreshing page soon');
                    
                    // Show a note about the page refreshing soon
                    const infoMessage = document.createElement('div');
                    infoMessage.style.cssText = `
                      position: absolute;
                      top: 30px;
                      left: 0;
                      width: 100%;
                      padding: 4px 8px;
                      background-color: rgba(255, 247, 223, 0.95);
                      border: 1px solid #f0d48a;
                      border-radius: 4px;
                      font-size: 11px;
                      z-index: 50;
                      text-align: center;
                      color: #a05e03;
                    `;
                    infoMessage.innerText = 'Page will refresh to apply changes';
                    
                    // Add the message to the UI
                    const container = document.querySelector('[data-business-account-container]');
                    if (container) {
                      container.appendChild(infoMessage);
                    }
                    
                    // Trigger a refresh to ensure the changes were applied
                    setTimeout(() => {
                      refreshUserDetails();
                    }, 1500); // Wait longer to ensure changes have propagated and user has seen the message
                  })
                  .catch((error) => {
                    console.error('Error updating business account:', error);
                    showSaveStatus('business', 'error', 'Failed to update business account');
                  });
              }}
              className="nav-bar m-0"
            />
            {saveStatus.type === 'business' && saveStatus.status && (
              <div className={`absolute -top-6 -right-2 text-[10px] font-medium py-1 px-2 rounded-md ${
                saveStatus.status === 'saving' ? 'bg-yellow-100 text-yellow-800' :
                saveStatus.status === 'success' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {saveStatus.message}
              </div>
            )}
          </div>
          
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
          
          <div className="flex items-center relative">
            <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">Ad Account</span>
            <FBAccountDropdown
              title="Ads"
              selectedAcccount={selectedFbAdAcc}
              accounts={fbAdAccs}
              handleAccountChange={(id) => {
                showSaveStatus('ad', 'saving', 'Updating ad account...');
                selectAdAccount(id)
                  .then(() => showSaveStatus('ad', 'success', 'Ad account updated'))
                  .catch(() => showSaveStatus('ad', 'error', 'Failed to update ad account'));
              }}
              className="nav-bar m-0"
            />
            {saveStatus.type === 'ad' && saveStatus.status && (
              <div className={`absolute -top-6 -right-2 text-[10px] font-medium py-1 px-2 rounded-md ${
                saveStatus.status === 'saving' ? 'bg-yellow-100 text-yellow-800' :
                saveStatus.status === 'success' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {saveStatus.message}
              </div>
            )}
          </div>
          
          {fbPages && (
            <>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
              <div className="flex items-center relative">
                <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">FB Page</span>
                <FBAccountDropdown
                  title="Page"
                  selectedAcccount={selectedFbPage}
                  accounts={fbPages}
                  handleAccountChange={(id) => {
                    showSaveStatus('page', 'saving', 'Updating page...');
                    selectPage(id)
                      .then(() => showSaveStatus('page', 'success', 'Page updated'))
                      .catch(() => showSaveStatus('page', 'error', 'Failed to update page'));
                  }}
                  className="nav-bar m-0"
                />
                {saveStatus.type === 'page' && saveStatus.status && (
                  <div className={`absolute -top-6 -right-2 text-[10px] font-medium py-1 px-2 rounded-md ${
                    saveStatus.status === 'saving' ? 'bg-yellow-100 text-yellow-800' :
                    saveStatus.status === 'success' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {saveStatus.message}
                  </div>
                )}
              </div>
            </>
          )}
          
          {selectedFbPage && (
            <>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
              <div className="flex items-center relative">
                <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">Instagram Account</span>
                <FBAccountDropdown
                  title="Instagram"
                  selectedAcccount={selectedInstagramAccount}
                  accounts={instagramAccounts || []}
                  handleAccountChange={(id) => {
                    showSaveStatus('instagram', 'saving', 'Updating Instagram account...');
                    selectInstagramAccount(id)
                      .then(() => showSaveStatus('instagram', 'success', 'Instagram account updated'))
                      .catch(() => showSaveStatus('instagram', 'error', 'Failed to update Instagram account'));
                  }}
                  className="nav-bar m-0"
                />
                {saveStatus.type === 'instagram' && saveStatus.status && (
                  <div className={`absolute -top-6 -right-2 text-[10px] font-medium py-1 px-2 rounded-md ${
                    saveStatus.status === 'saving' ? 'bg-yellow-100 text-yellow-800' :
                    saveStatus.status === 'success' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {saveStatus.message}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FacebookAccountNav