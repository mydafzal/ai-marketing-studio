import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { getChat, getMissingKeys, getUserDetail, getSubscriptionInfo } from '@/app/actions'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/AIManager'
import { Session } from '@/lib/types'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    return {}; 
  }
  const chat = await getChat(params.id, session.user.id);
  return {
    title: chat?.title?.toString().slice(0, 50) ?? 'Chat', 
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  if (!session?.user) {
    redirect(`/login?next=/chat/${params.id}`)
  }

  const userId = session.user.id as string
  const chat = await getChat(params.id, userId)
  const chatId = chat?.id ?? params.id
  const title = chat?.title ?? ""
  const messages = chat?.messages ?? []

  if (chat && chat.userId !== session?.user?.id) {
    notFound()
  }
  
  // Check if Facebook account is connected - if not, redirect to connect page
  if (session.user.email) {
    const userDetail = await getUserDetail();
    if (userDetail.success && userDetail.user && !userDetail.user.fbMarketingApiKey) {
      redirect('/facebook-connect')
    }
    
    // Check subscription status
    const subscription = await getSubscriptionInfo();
    if (!subscription || (subscription.sub_status !== 'active' && subscription.sub_status !== 'trialing')) {
      redirect('/subscription')
    }
  }

  return (
    <AI initialAIState={{ chatId, title, messages }}>
      <Chat
        id={chatId}
        chat={chat}
        session={session}
        initialMessages={messages}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
