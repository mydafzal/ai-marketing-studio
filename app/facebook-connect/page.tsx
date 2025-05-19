import { kv } from '@vercel/kv'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserDetail } from '@/app/actions'
import { SidebarDesktop } from '@/components/sidebar-desktop'
import Link from 'next/link'
import FacebookConnect from '@/components/facebook-connect'
import { Facebook, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Reeply - Connect with Facebook'
}

export default async function FacebookConnectPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  const userEmail = session?.user?.email
  
  if (!userEmail) {
    redirect('/login')
  }
  
  // Get user details
  const userDetail = await getUserDetail()
  const user = userDetail.user
  
  if (!user) {
    redirect('/login')
  }
  
  // If Facebook is already connected, redirect to main app
  if (user.fbMarketingApiKey) {
    redirect('/')
  }
  
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      <SidebarDesktop />
      <div className="group w-full pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] relative overflow-auto bg-[#0F1117] dark:bg-[#0F1117] text-white dark:text-white flex flex-col items-center">
        <div className="w-full max-w-4xl mx-auto py-6 sm:py-12 px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-[28px] sm:text-[40px] font-bold text-white dark:text-white px-2">
              Connect with <span className="text-[#1A77F2]">Facebook</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-[#ADB0B8] dark:text-[#ADB0B8] text-[16px] sm:text-[18px] leading-[22px] sm:leading-[26px] max-w-3xl mx-auto px-2">
              To unlock the full potential of Reeply AI, connect your Facebook account.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto bg-[#1A1D29] rounded-xl border border-[#2A2E3A] p-6 sm:p-8 mb-8 sm:mb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#1A77F2]/20 flex items-center justify-center">
                <Facebook className="text-[#1A77F2] w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Why Connect with Facebook?</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A77F2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="text-[#1A77F2] w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-medium">One-Click Campaign Creation</h3>
                  <p className="text-[#ADB0B8] text-sm">Create and manage campaigns directly without switching between platforms</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A77F2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="text-[#1A77F2] w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Access Detailed Analytics</h3>
                  <p className="text-[#ADB0B8] text-sm">Get performance metrics for your campaigns in real-time</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A77F2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="text-[#1A77F2] w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Automatic Optimization</h3>
                  <p className="text-[#ADB0B8] text-sm">Our AI can optimize your campaigns based on real-time data</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A77F2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="text-[#1A77F2] w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Manage Leads Directly</h3>
                  <p className="text-[#ADB0B8] text-sm">Access and manage campaign leads from within Reeply AI</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#2A2E3A] pt-6">
              <p className="text-[#ADB0B8] text-sm mb-6">
                By connecting, you&apos;ll grant Reeply AI access to:
              </p>
              <ul className="list-disc list-inside text-[#ADB0B8] text-sm space-y-1 mb-6">
                <li>Receive your email address</li>
                <li>Manage ads for ad accounts that you have access to</li>
                <li>Access your Facebook ads and related stats</li>
                <li>Manage your business</li>
                <li>Access leads for your Pages</li>
                <li>Create and manage ads for your Page</li>
                <li>Show a list of the Pages you manage</li>
              </ul>
              
              <div className="flex flex-col items-center">
                <FacebookConnect />
                <div className="mt-4 text-center">
                  <p className="text-[#ADB0B8] text-sm">
                    You can always connect later in Settings if you prefer.
                  </p>
                  <a 
                    href="https://joyous-brow-6da.notion.site/How-to-connect-to-Facebook-1e616186aac980c0a054f5452b53be7e"
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-[#4BF29C] hover:underline mt-2 inline-block"
                  >
                    Need help? View connection guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}