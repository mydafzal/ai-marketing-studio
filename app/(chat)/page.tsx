import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/AIManager'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys, getUserDetail } from '@/app/actions'
import { redirect } from 'next/navigation'
import { isFeatureToggleEnabled } from '@/lib/helpers/feature-toggle/feature-toggle-manager'
import { HomepageDashboard } from '@/components/homepage-dashboard'

export const metadata = {
  title: 'Reeply AI Chatbot'
}

export default async function IndexPage() {
  const session = (await auth()) as Session

  if (!session) {
    redirect('/login')
  }
  
  // Check if Facebook account is connected
  if (session.user?.email) {
    const userDetail = await getUserDetail()
    if (userDetail.success && userDetail.user && !userDetail.user.fbMarketingApiKey) {
      redirect('/facebook-connect')
    }
  }

  // Check if legacy chat mode is enabled
  const isLegacyMode = isFeatureToggleEnabled('legacyChatMode')
  
  if (isLegacyMode) {
    // Redirect to legacy chat interface
    const id = nanoid()
    redirect(`/chat/${id}`)
  }

  // Show new homepage dashboard
  return (
    <AI initialAIState={{ chatId: nanoid(), title: "", messages: [] }}>
      <div className="w-full max-w-3xl flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="pt-4 md:pt-10">
            <HomepageDashboard session={session} />
          </div>
        </div>
      </div>
    </AI>
  )
}
