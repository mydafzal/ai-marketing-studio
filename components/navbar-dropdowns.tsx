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
      try {
        // Clear any previous ad account selection when fetching new ones
        setSelectedFbAdAcc(undefined);
        
        const data = await getFacebookAdAccounts(userDetails?.fbMarketingApiKey, selectedFbBusinessAcc.id);
        setFbAdAccs(data);
        
        // After loading ad accounts, if we have a stored fbAccountId, try to find its name in the current list
        if (userDetails?.fbAccountId && data && data.length > 0) {
          // Only match exact account IDs, don't show stale accounts
          const adAccount = data.find((acc: Account) => acc.id === userDetails.fbAccountId);
          if (adAccount) {
            setSelectedFbAdAcc(adAccount);
          }
          // If not found, leave as undefined to show "Select"
        }
      } catch (error) {
        console.error('Error fetching ad accounts:', error);
        // If there's an error, ensure we don't show stale data
        setFbAdAccs([]);
        setSelectedFbAdAcc(undefined);
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
      // Set the selected account immediately for better UX
      setSelectedFbBusinessAcc(fbBusinessAccs.find((acc) => acc.id === id));
      
      // Show loading indicator
      setBusinessAccLoading(true);
      
      try {
        // Save the selection to the database
        await updateFbBusinessAcc(userDetails?.email, id);
        
        // After saving to database, refresh the page completely to ensure everything is reinitialized
        window.location.reload();
      } catch (error) {
        console.error('Error updating business account:', error);
        setBusinessAccLoading(false);
      }
      // Note: We don't need to hide the loading indicator in finally block since the page will refresh
    }
  }

  async function selectAdAccount(id: string) {
    if (fbAdAccs && userDetails) {
      // Set the selected account immediately for better UX
      setSelectedFbAdAcc(fbAdAccs.find((acc) => acc.id === id));
      
      // Show loading indicator
      setAdAccLoading(true);
      
      try {
        // Save the selection to the database
        await updateFbAccountId(userDetails?.email, id);
      } catch (error) {
        console.error('Error updating ad account:', error);
      } finally {
        // Hide loading indicator
        setAdAccLoading(false);
      }
    }
  }
  
  async function selectPage(id: string) {
    if (fbPages && userDetails) {
      // Set the selected page immediately for better UX
      const selectedPage = fbPages.find((page) => page.id === id);
      setSelectedFbPage(selectedPage);
      
      // Show loading indicator
      setFbPageLoading(true);
      
      try {
        // Save the selection to the database
        await updateFbPageId(userDetails.email, id);
        
        // When a Facebook page is selected, fetch Instagram accounts
        await getInstagramAccounts();
      } catch (error) {
        console.error('Error updating Facebook page:', error);
      } finally {
        // Hide loading indicator
        setFbPageLoading(false);
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

  // Fetch user's API token info to get saved account information first
  // Mount/initialization effect - runs once when component mounts
  useEffect(() => {
    console.log('NavbarDropdowns: Component mounted');
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
                  // Update local state with the latest values from KV store
                  if (data.account.instagramAccountId) {
                    userDetails.instagramAccountId = data.account.instagramAccountId;
                  }
                  if (data.account.fbPageId) {
                    userDetails.fbPageId = data.account.fbPageId;
                  }
                  if (data.account.fbBusinessAccId) {
                    userDetails.fbBusinessAccId = data.account.fbBusinessAccId;
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

    // Run the initialization immediately
    fetchInitialData();
    
    // Add an event listener for page visibility to refresh data when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing navbar data');
        fetchInitialData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array means this runs once on mount
  
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
      // Don't count missing Instagram account as a reason to show the connection modal
      // const hasNoInstagramAccounts = selectedFbPage && instagramAccounts && instagramAccounts.length === 0;
      
      // Show modal if any of these conditions are true (excluding Instagram)
      if (hasNoBusinessAccounts || hasNoAdAccounts || hasNoFbPages) {
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
    selectedFbPage
    // Removed instagramAccounts from dependencies
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
      // Clear selected ad account immediately when business account changes
      setSelectedFbAdAcc(undefined);
      getAdAccAPICall();
    }
  }, [selectedFbBusinessAcc]);

  // Function to refresh the page
  const refreshPage = () => {
    window.location.reload();
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
            {selectedFbPage && instagramAccounts && instagramAccounts.length === 0 && (
              <div className="text-red-500 text-xs mr-2 max-w-[200px]">
                Instagram account not found. We highly suggest you to add your Instagram account to your ads manager for best user experience on our platform.
              </div>
            )}
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
              onClick={refreshPage}
              className="bg-primary-green hover:bg-primary-green/90 text-black text-xs font-medium py-1 px-3 rounded-full transition-colors whitespace-nowrap"
            >
              Save Changes
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
            onClick={refreshPage}
            className="bg-primary-green hover:bg-primary-green/90 text-black text-xs font-medium py-1 px-2 rounded-full transition-colors whitespace-nowrap"
          >
            Save Changes
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
              {selectedFbPage && instagramAccounts && instagramAccounts.length === 0 && (
                <div className="text-red-500 text-xs mb-2">
                  Instagram account not found. We highly suggest you to add your Instagram account to your ads manager for best user experience on our platform.
                </div>
              )}
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
              onClick={refreshPage}
              className="bg-primary-green hover:bg-primary-green/90 text-black text-xs font-medium py-1 px-2 rounded-full transition-colors whitespace-nowrap"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default NavbarDropdowns