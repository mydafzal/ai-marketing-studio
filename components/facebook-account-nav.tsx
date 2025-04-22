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

  // Fetch business accounts on component mount
  useEffect(() => {
    async function getBusinessAPICall() {
      if (userDetails?.fbMarketingApiKey) {
        const data = await getFacebookBusinessAccounts(userDetails?.fbMarketingApiKey)
        setFbBusinessAccs(data)
      }
    }
    getBusinessAPICall()
  }, [userDetails])

  // Set selected business account from user details when fbBusinessAccs data is available
  useEffect(() => {
    if (userDetails?.fbBusinessAccId && fbBusinessAccs) {
      const businessAcc = fbBusinessAccs.find((acc) => acc.id === `${userDetails?.fbBusinessAccId}`)
      setSelectedFbBusinessAcc(businessAcc)
      
      // Fetch pages for existing business account
      if (businessAcc && !fbPages) {
        getFacebookPages(businessAcc.id)
      }
    }
    
    if (userDetails?.fbAccountId) {
      setSelectedFbAdAcc({
        id: userDetails?.fbAccountId,
        name: userDetails?.fbAccountId.split("act_")[1]
      })
    }
  }, [fbBusinessAccs, userDetails])
  
  // Set selected page when fbPages changes
  useEffect(() => {
    if (userDetails?.fbPageId && fbPages && fbPages.length > 0) {
      const page = fbPages.find((page) => page.id === userDetails.fbPageId)
      if (page) {
        setSelectedFbPage(page)
      }
    }
  }, [fbPages, userDetails?.fbPageId])

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
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch Facebook pages')
      }
      
      const data = await response.json()
      setFbPages(data)
      return data
    } catch (error) {
      console.error('Error fetching Facebook pages:', error)
      return []
    }
  }
  
  async function getInstagramAccounts() {
    try {
      const response = await fetch('/api/fasty-bot/proxy-get-instagram-pages', {
        method: 'GET',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch Instagram accounts')
      }
      
      const data = await response.json()
      setInstagramAccounts(data)
      return data
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error)
      return []
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
          
          {instagramAccounts && (
            <>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
              <div className="flex items-center">
                <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium tracking-wide mr-2 whitespace-nowrap">Instagram Account</span>
                <FBAccountDropdown
                  title="Instagram"
                  selectedAcccount={selectedInstagramAccount}
                  accounts={instagramAccounts}
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