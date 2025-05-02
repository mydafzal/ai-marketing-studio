import React from 'react'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { redirect } from 'next/navigation'
import { getUserDetail } from '@/app/actions'
import dynamic from 'next/dynamic'

// Use dynamic imports with ssr: false for client components
const ClientCampaignConnect = dynamic(
  () => import('@/components/connect-campaign/client-page-wrapper').then(mod => mod.ClientCampaignConnect),
  { ssr: false }
)

export default async function CampaignConnectPage() {
  const session = await auth() as Session

  if (!session?.user) {
    redirect('/login')
  }

  const response = await getUserDetail()
  if (!response.success) {
    return <div>Error loading user details</div>
  }

  const userDetails = response.user

  // Check if Facebook is connected
  if (!userDetails.fbMarketingApiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-dark-bg text-text-white p-4">
        <div className="max-w-md w-full bg-[#1A1D29] rounded-lg border border-[#2A2E3A] p-6">
          <h1 className="text-xl font-semibold mb-4">Facebook Account Not Connected</h1>
          <p className="text-[#ADB0B8] mb-6">
            To connect to Facebook campaigns, you need to connect your Facebook account first.
          </p>
          <a 
            href="/facebook-connect" 
            className="block w-full py-2 px-4 bg-[#4BF29C] hover:bg-[#3AD889] text-black font-medium text-center rounded-lg transition-colors"
          >
            Connect Facebook Account
          </a>
        </div>
      </div>
    )
  }

  // If Facebook is connected, show the campaign connect UI
  return (
    <div className="flex flex-col py-6 px-4 md:px-8 min-h-[calc(100vh-64px)] bg-dark-bg">
      <h1 className="text-2xl font-bold text-white mb-6">Campaign Connect</h1>
      <div className="w-full mx-auto px-4">
        <ClientCampaignConnect />
      </div>
    </div>
  )
}