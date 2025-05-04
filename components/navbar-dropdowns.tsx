"use client"

import React, { useState, useEffect } from 'react'
import FBAccountDropdown from './fb-account-dropdown'
import { AccountConnectionModal } from './account-not-connected-screen'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Account = {
  name: string;
  id: string;
  profile_picture_url?: string;
}

// Small loading spinner component
const Spinner = () => (
  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
    <div className="w-3 h-3 border-t-2 border-blue-500 rounded-full animate-spin"></div>
  </div>
)

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
  
  // Loading states
  const [businessAccLoading, setBusinessAccLoading] = useState(false);
  const [adAccLoading, setAdAccLoading] = useState(false);
  const [fbPageLoading, setFbPageLoading] = useState(false);
  const [igAccountLoading, setIgAccountLoading] = useState(false);
  
  // Move this useState hook before any conditional returns to fix the ESLint error
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

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
      
      // Set loading indicator
      setIgAccountLoading(true);
      
      // First reset previous selection and data
      setSelectedInstagramAccount(undefined);
      
      const response = await fetch('/api/fasty-bot/proxy-get-instagram-pages', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Instagram accounts');
      }
      
      const data = await response.json();
      console.log('Instagram accounts fetched:', data);
      
      // Check if we received valid data
      if (!Array.isArray(data)) {
        console.warn('Instagram accounts data is not an array:', data);
        setInstagramAccounts([]);
        setIgAccountLoading(false);
        return [];
      }
      
      // Set the Instagram accounts data
      setInstagramAccounts(data);
      
      // If we have a stored Instagram account ID and valid data, find and set it
      if (userDetails?.instagramAccountId && data.length > 0) {
        console.log('Looking for Instagram account with ID:', userDetails.instagramAccountId);
        
        // Log all available Instagram account IDs for debugging
        data.forEach((account: Account) => {
          console.log(`Available IG account: ${account.name}, ID: ${account.id}, Type: ${typeof account.id}`);
        });
        
        // Convert userDetails.instagramAccountId to string and trim it
        const igIdToFind = String(userDetails.instagramAccountId).trim();
        
        // First try exact match
        let matchedAccount = data.find((account: Account) => 
          String(account.id).trim() === igIdToFind
        );
        
        // If exact match found, use it
        if (matchedAccount) {
          console.log('Found matching Instagram account:', matchedAccount);
          setSelectedInstagramAccount(matchedAccount);
        } 
        // Otherwise try partial match as fallback
        else {
          console.log('No exact Instagram account match, trying partial match...');
          
          // Try partial matching
          matchedAccount = data.find((account: Account) => 
            String(account.id).includes(igIdToFind) || igIdToFind.includes(String(account.id))
          );
          
          if (matchedAccount) {
            console.log('Found fallback matching Instagram account:', matchedAccount);
            setSelectedInstagramAccount(matchedAccount);
          } else {
            console.log('No matching Instagram account found at all');
          }
        }
      } else {
        console.log('No Instagram account ID in userDetails or no accounts fetched');
      }
      
      setIgAccountLoading(false);
      return data;
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error);
      setInstagramAccounts([]);
      setIgAccountLoading(false);
      return [];
    }
  }

  async function selectBusinessAccount(id: string) {
    if (fbBusinessAccs && userDetails) {
      // Force reset userDetails values immediately to prevent stale UI
      if (userDetails.fbAccountId) {
        userDetails.fbAccountId = "";
      }
      if (userDetails.fbPageId) {
        userDetails.fbPageId = "";
      }
      if (userDetails.instagramAccountId) {
        userDetails.instagramAccountId = "";
      }
      
      // Reset UI selections immediately to prevent interaction with stale data
      setSelectedFbAdAcc(undefined);
      setSelectedFbPage(undefined);
      setSelectedInstagramAccount(undefined);
      setInstagramAccounts(undefined);
      // CRITICAL: Clear the old ad accounts and pages data immediately to prevent stale displays
      setFbAdAccs([]);
      setFbPages([]);
      
      // Set the selected account immediately for better UX
      setSelectedFbBusinessAcc(fbBusinessAccs.find((acc) => acc.id === id));
      
      // Show loading indicators for all dependent dropdowns
      setBusinessAccLoading(true);
      setAdAccLoading(true);
      setFbPageLoading(true);
      setIgAccountLoading(true);
      
      try {
        // Perform all database updates in parallel
        await Promise.all([
          // Save the selection to the database
          updateFbBusinessAcc(userDetails?.email, id),
          
          // Remove fbAccountId entirely from database
          updateFbAccountId(userDetails?.email, ""),
          
          // Remove fbPageId entirely from database
          updateFbPageId(userDetails?.email, ""),
          
          // Remove Instagram account ID
          fetch('/api/kv/update-instagram-account-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userDetails.email,
              instagramAccountId: "",
              fbPageId: "" 
            })
          }).then(response => {
            if (!response.ok) {
              return response.json().then(errorData => {
                console.error('Error clearing Instagram account ID:', errorData.error);
              });
            }
          }).catch(error => {
            console.error('Error calling Instagram account ID update API:', error);
          })
        ]);
        
        // Now get new ad account data
        if (userDetails?.fbMarketingApiKey && id) {
          setAdAccLoading(true);
          try {
            const data = await getFacebookAdAccounts(userDetails.fbMarketingApiKey, id);
            setFbAdAccs(data || []); // Ensure it's an array even if null
            setAdAccLoading(false);
          } catch (error) {
            console.error('Error fetching ad accounts:', error);
            setFbAdAccs([]);
            setAdAccLoading(false);
          }
        }
        
        // Fetch pages for the selected business account
        if (id) {
          setFbPageLoading(true);
          try {
            const pages = await getFacebookPages(id);
            // Make sure we have valid data
            if (Array.isArray(pages) && pages.length > 0) {
              setFbPages(pages);
            } else {
              setFbPages([]);
            }
          } catch (error) {
            console.error('Error fetching Facebook pages:', error);
            setFbPages([]);
          } finally {
            setFbPageLoading(false);
          }
        }
        
      } catch (error) {
        console.error('Error updating business account:', error);
        // Ensure dropdowns don't show stale data on error
        setFbAdAccs([]);
        setFbPages([]);
      } finally {
        // Hide loading indicators regardless of success/failure
        setBusinessAccLoading(false);
        setAdAccLoading(false);
        setFbPageLoading(false);
        setIgAccountLoading(false);
      }
    }
  }

  async function selectAdAccount(id: string) {
    if (fbAdAccs && userDetails) {
      // Force reset userDetails values immediately to prevent stale UI
      if (userDetails.fbPageId) {
        userDetails.fbPageId = "";
      }
      if (userDetails.instagramAccountId) {
        userDetails.instagramAccountId = "";
      }
      
      // Reset dependent selections immediately to prevent interaction with stale data
      setSelectedFbPage(undefined);
      setSelectedInstagramAccount(undefined);
      setInstagramAccounts(undefined);
      setFbPages([]);
      
      // Set the selected account immediately for better UX
      setSelectedFbAdAcc(fbAdAccs.find((acc) => acc.id === id));
      
      // Show loading indicators for all dependent dropdowns
      setAdAccLoading(true);
      setFbPageLoading(true);
      setIgAccountLoading(true);
      
      try {
        // Perform database updates in parallel
        await Promise.all([
          // Save the selection to the database
          updateFbAccountId(userDetails?.email, id),
          
          // Remove fbPageId when Ad Account changes
          updateFbPageId(userDetails?.email, ""),
          
          // Remove Instagram account ID
          fetch('/api/kv/update-instagram-account-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userDetails.email,
              instagramAccountId: "",
              fbPageId: ""
            })
          }).then(response => {
            if (!response.ok) {
              return response.json().then(errorData => {
                console.error('Error clearing Instagram account ID:', errorData.error);
              });
            }
          }).catch(error => {
            console.error('Error calling Instagram account ID update API:', error);
          })
        ]);
        
        // Fetch pages for the current business account
        if (selectedFbBusinessAcc?.id) {
          try {
            const pages = await getFacebookPages(selectedFbBusinessAcc.id);
            if (Array.isArray(pages) && pages.length > 0) {
              setFbPages(pages);
            } else {
              setFbPages([]);
            }
          } catch (error) {
            console.error('Error fetching Facebook pages:', error);
            setFbPages([]);
          } finally {
            setFbPageLoading(false);
          }
        } else {
          setFbPages([]);
          setFbPageLoading(false);
        }
      } catch (error) {
        console.error('Error updating ad account:', error);
        // Ensure dropdowns don't show stale data on error
        setFbPages([]);
      } finally {
        // Hide loading indicators
        setAdAccLoading(false);
        setFbPageLoading(false);
        setIgAccountLoading(false);
      }
    }
  }
  
  async function selectPage(id: string) {
    if (fbPages && userDetails) {
      // Force reset Instagram ID in userDetails to prevent stale UI
      if (userDetails.instagramAccountId) {
        userDetails.instagramAccountId = "";
      }
      
      // Reset Instagram selection immediately
      setSelectedInstagramAccount(undefined);
      setInstagramAccounts([]);
      
      // Set the selected page immediately for better UX
      const selectedPage = fbPages.find((page) => page.id === id);
      setSelectedFbPage(selectedPage);
      
      // Show loading indicators
      setFbPageLoading(true);
      setIgAccountLoading(true);
      
      try {
        // Perform database updates in parallel
        await Promise.all([
          // Save the selection to the database
          updateFbPageId(userDetails.email, id),
          
          // Clear previous Instagram account when changing FB Page
          fetch('/api/kv/update-instagram-account-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userDetails.email,
              instagramAccountId: "",
              fbPageId: id // Pass the new fbPageId, but clear the Instagram ID
            })
          }).then(response => {
            if (!response.ok) {
              return response.json().then(errorData => {
                console.error('Error clearing Instagram account ID:', errorData.error);
              });
            }
          }).catch(error => {
            console.error('Error calling Instagram account ID update API:', error);
          })
        ]);
        
        // When a Facebook page is selected, fetch Instagram accounts
        try {
          await getInstagramAccounts(id);
        } catch (error) {
          console.error('Error fetching Instagram accounts:', error);
          setInstagramAccounts([]);
        } finally {
          setIgAccountLoading(false);
        }
      } catch (error) {
        console.error('Error updating Facebook page:', error);
        setInstagramAccounts([]);
      } finally {
        // Hide loading indicators
        setFbPageLoading(false);
        setIgAccountLoading(false);
      }
    }
  }
  
  async function selectInstagramAccount(id: string) {
    if (instagramAccounts && userDetails && selectedFbPage) {
      // Set the selected account immediately for better UX
      const selectedAccount = instagramAccounts.find((account) => account.id === id);
      setSelectedInstagramAccount(selectedAccount);
      
      // Show loading indicator
      setIgAccountLoading(true);
      
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
      } finally {
        // Hide loading indicator
        setIgAccountLoading(false);
      }
    }
  }

  // Fetch user's API token info to get saved account information
  // Will run when component mounts or userDetails changes
  useEffect(() => {
    console.log('NavbarDropdowns: Component mounted or userDetails changed');
    const fetchInitialData = async () => {
      try {
        // Track loading state
        setBusinessAccLoading(true);
        
        // Run both data fetching operations in parallel
        const promises = [];
        
        // 1. Start API token info fetch
        if (userDetails?.email) {
          promises.push(
            fetch('/api/kv/fetch-api-token')
              .then(response => response.ok ? response.json() : null)
              .then(data => {
                if (data?.success && data?.account) {
                  // Create a new object to avoid mutating props, which can cause issues
                  const updatedDetails = {...userDetails};
                  
                  // Update local state with the latest values from KV store
                  if (data.account.instagramAccountId) {
                    updatedDetails.instagramAccountId = data.account.instagramAccountId;
                  }
                  if (data.account.fbPageId) {
                    updatedDetails.fbPageId = data.account.fbPageId;
                  }
                  if (data.account.fbBusinessAccId) {
                    updatedDetails.fbBusinessAccId = data.account.fbBusinessAccId;
                  }
                  
                  return data.account;
                }
                return null;
              })
          );
        }
        
        // 2. Start business accounts fetch in parallel
        if (userDetails?.fbMarketingApiKey) {
          promises.push(getBusinessAPICall());
        }
        
        // Wait for all promises to resolve
        await Promise.all(promises);
      } catch (error) {
        console.error('Error initializing navbar data:', error);
      } finally {
        setBusinessAccLoading(false);
      }
    };

    // Only run the initialization if we have the key
    if (userDetails?.fbMarketingApiKey) {
      fetchInitialData();
    }
    
    // Add an event listener for page visibility to refresh data when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userDetails?.fbMarketingApiKey) {
        console.log('Page became visible, refreshing navbar data');
        fetchInitialData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userDetails?.email, userDetails?.fbMarketingApiKey, userDetails?.fbBusinessAccId]); // Run when these dependencies change
  
  // Effect that runs when userDetails change
  useEffect(() => {
    console.log('NavbarDropdowns: userDetails changed');
    if (userDetails?.fbMarketingApiKey) {
      getBusinessAPICall();
    }
  }, [userDetails?.email, userDetails?.fbMarketingApiKey]);
  
  // Check if we should show the connection modal
  useEffect(() => {
    // First, make sure Facebook is connected
    if (userDetails?.fbMarketingApiKey) {
      // Check all dropdown items for any that might have no fetchable results
      const hasNoBusinessAccounts = fbBusinessAccs && fbBusinessAccs.length === 0;
      const hasNoAdAccounts = selectedFbBusinessAcc && fbAdAccs && fbAdAccs.length === 0;
      const hasNoFbPages = selectedFbBusinessAcc && fbPages && fbPages.length === 0;
      const hasNoInstagramAccounts = selectedFbPage && instagramAccounts && instagramAccounts.length === 0;
      
      // Show modal if any of these conditions are true
      if (hasNoBusinessAccounts || hasNoAdAccounts || hasNoFbPages || hasNoInstagramAccounts) {
        setShowConnectionModal(true);
      } else {
        setShowConnectionModal(false);
      }
    } else {
      // Facebook not connected, don't show modal
      setShowConnectionModal(false);
    }
  }, [
    userDetails?.fbMarketingApiKey, 
    fbBusinessAccs, 
    selectedFbBusinessAcc, 
    fbAdAccs,
    fbPages,
    selectedFbPage, 
    instagramAccounts
  ]);

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

  // Function to handle save changes - refreshes the page
  const handleSaveChanges = () => {
    // Show loading indicators - gives visual feedback that something is happening
    setBusinessAccLoading(true);
    setAdAccLoading(true);
    setFbPageLoading(true);
    setIgAccountLoading(true);
    
    // Use setTimeout to ensure the loading state is shown before reload
    setTimeout(() => {
      // Refresh the page
      window.location.reload();
    }, 200);
  };

  // Only render the navigation area if there's a valid Facebook Marketing API key
  if (!userDetails?.fbMarketingApiKey) {
    return null;
  }
  
  return (
    <>
      {/* Connection Modal */}
      <AccountConnectionModal 
        isOpen={showConnectionModal} 
        onClose={() => setShowConnectionModal(false)} 
      />
      {/* Desktop View - Standard Horizontal Layout */}
      <div className="hidden md:block">
        <div className="flex flex-nowrap items-center justify-center space-x-4 lg:space-x-6 px-6 py-2 bg-dark-bg border-b border-border-dark w-full">
          <div className="flex items-center relative">
            <span className="text-xs text-zinc-400 mr-2 whitespace-nowrap">Business:</span>
            {businessAccLoading && <Spinner />}
            <FBAccountDropdown
              title=""
              selectedAcccount={selectedFbBusinessAcc}
              accounts={fbBusinessAccs}
              handleAccountChange={selectBusinessAccount}
              compact={true}
              darkMode={true}
            />
          </div>
          
          <div className="flex items-center relative">
            <span className="text-xs text-zinc-400 mr-2 whitespace-nowrap">Ad Acc:</span>
            {adAccLoading && <Spinner />}
            <FBAccountDropdown
              title=""
              selectedAcccount={selectedFbAdAcc}
              accounts={fbAdAccs}
              handleAccountChange={selectAdAccount}
              compact={true}
              darkMode={true}
            />
          </div>
          
          <div className="flex items-center relative">
            <span className="text-xs text-zinc-400 mr-2 whitespace-nowrap">FB Page:</span>
            {fbPageLoading && <Spinner />}
            <FBAccountDropdown
              title=""
              selectedAcccount={selectedFbPage}
              accounts={fbPages}
              handleAccountChange={selectPage}
              compact={true}
              darkMode={true}
            />
          </div>
          
          <div className="flex items-center relative">
            <span className="text-xs text-zinc-400 mr-2 whitespace-nowrap">IG Acc:</span>
            {igAccountLoading && <Spinner />}
            <FBAccountDropdown
              title=""
              selectedAcccount={selectedInstagramAccount}
              accounts={instagramAccounts}
              handleAccountChange={selectInstagramAccount}
              compact={true}
              darkMode={true}
            />
          </div>
          
          {/* Refresh & Save Changes buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleSaveChanges}
              className="bg-primary-green hover:bg-primary-green/90 text-black text-xs font-medium py-1 px-3 rounded-full transition-colors whitespace-nowrap"
              disabled={businessAccLoading || adAccLoading || fbPageLoading || igAccountLoading}
            >
              {(businessAccLoading || adAccLoading || fbPageLoading || igAccountLoading) ? 'Refreshing...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile View - Dropdown Menu */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-dark-bg border-b border-border-dark w-full">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-between space-x-2 text-white"
          >
            <span className="text-sm font-medium relative">
              {selectedFbBusinessAcc ? `Business: ${selectedFbBusinessAcc.name}` : 'Select Accounts'}
              {!selectedFbBusinessAcc && (
                <span className="absolute inset-0 animate-pulse-green rounded-full ring-2 ring-[#4BF29C] shadow-[0_0_8px_2px_rgba(75,242,156,0.7)] ring-offset-1 ring-offset-[#1a1a1a]"></span>
              )}
            </span>
            <svg 
              className={`w-4 h-4 text-zinc-400 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Save Changes Button */}
          <button
            onClick={handleSaveChanges}
            className="bg-primary-green hover:bg-primary-green/90 text-black text-xs font-medium py-1 px-2 rounded-full transition-colors whitespace-nowrap"
            disabled={businessAccLoading || adAccLoading || fbPageLoading || igAccountLoading}
          >
            {(businessAccLoading || adAccLoading || fbPageLoading || igAccountLoading) ? 'Refreshing...' : 'Save Changes'}
          </button>
        </div>
        
        {/* Expandable Mobile Menu Panel */}
        <div className={`${mobileMenuOpen ? 'max-h-[500px]' : 'max-h-0'} transition-all duration-300 overflow-hidden bg-[#1A1D29] border-b border-border-dark`}>
          <div className="p-4 pb-8 flex flex-col space-y-6">
            {/* Business Account */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <span className="text-sm text-zinc-400">Business Account</span>
                {businessAccLoading && <Spinner />}
              </div>
              <FBAccountDropdown
                title=""
                selectedAcccount={selectedFbBusinessAcc}
                accounts={fbBusinessAccs}
                handleAccountChange={selectBusinessAccount}
                compact={false}
                darkMode={true}
              />
            </div>
            
            {/* Ad Account */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <span className="text-sm text-zinc-400">Ad Account</span>
                {adAccLoading && <Spinner />}
              </div>
              <FBAccountDropdown
                title=""
                selectedAcccount={selectedFbAdAcc}
                accounts={fbAdAccs}
                handleAccountChange={selectAdAccount}
                compact={false}
                darkMode={true}
              />
            </div>
            
            {/* Facebook Page */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <span className="text-sm text-zinc-400">Facebook Page</span>
                {fbPageLoading && <Spinner />}
              </div>
              <FBAccountDropdown
                title=""
                selectedAcccount={selectedFbPage}
                accounts={fbPages}
                handleAccountChange={selectPage}
                compact={false}
                darkMode={true}
              />
            </div>
            
            {/* Instagram Account */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <span className="text-sm text-zinc-400">Instagram Account</span>
                {igAccountLoading && <Spinner />}
              </div>
              <FBAccountDropdown
                title=""
                selectedAcccount={selectedInstagramAccount}
                accounts={instagramAccounts}
                handleAccountChange={selectInstagramAccount}
                compact={false}
                darkMode={true}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Keep the original component with overflow and horizontal scrolling for fallback */}
      <div className="overflow-x-auto md:hidden hidden">
        <div className="flex flex-nowrap items-center justify-start space-x-2 px-2 py-2 bg-dark-bg border-b border-border-dark w-full min-w-max">
          <div className="flex items-center relative">
            <span className="text-xs text-zinc-400 mr-1 whitespace-nowrap">Business:</span>
            {businessAccLoading && <Spinner />}
            <FBAccountDropdown
              title=""
              selectedAcccount={selectedFbBusinessAcc}
              accounts={fbBusinessAccs}
              handleAccountChange={selectBusinessAccount}
              compact={true}
              darkMode={true}
            />
          </div>
          
          <div className="flex items-center relative">
            <span className="text-xs text-zinc-400 mr-1 whitespace-nowrap">Ad Acc:</span>
            {adAccLoading && <Spinner />}
            <FBAccountDropdown
              title=""
              selectedAcccount={selectedFbAdAcc}
              accounts={fbAdAccs}
              handleAccountChange={selectAdAccount}
              compact={true}
              darkMode={true}
            />
          </div>
          
          <div className="flex items-center relative">
            <span className="text-xs text-zinc-400 mr-1 whitespace-nowrap">FB Page:</span>
            {fbPageLoading && <Spinner />}
            <FBAccountDropdown
              title=""
              selectedAcccount={selectedFbPage}
              accounts={fbPages}
              handleAccountChange={selectPage}
              compact={true}
              darkMode={true}
            />
          </div>
          
          <div className="flex items-center relative">
            <span className="text-xs text-zinc-400 mr-1 whitespace-nowrap">IG Acc:</span>
            {igAccountLoading && <Spinner />}
            <FBAccountDropdown
              title=""
              selectedAcccount={selectedInstagramAccount}
              accounts={instagramAccounts}
              handleAccountChange={selectInstagramAccount}
              compact={true}
              darkMode={true}
            />
          </div>
          
          {/* Refresh & Save Changes buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleSaveChanges}
              className="bg-primary-green hover:bg-primary-green/90 text-black text-xs font-medium py-1 px-2 rounded-full transition-colors whitespace-nowrap"
              disabled={businessAccLoading || adAccLoading || fbPageLoading || igAccountLoading}
            >
              {(businessAccLoading || adAccLoading || fbPageLoading || igAccountLoading) ? 'Refreshing...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default NavbarDropdowns