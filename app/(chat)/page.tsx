/*
import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys } from '@/app/actions'

export const metadata = {
  title: 'Reeply AI Chatbot'
}

export default async function IndexPage() {
  const id = nanoid()
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      <Chat id={id} session={session} missingKeys={missingKeys} />
    </AI>
  )
}
*/

import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/AIManager'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys, getUserDetail } from '@/app/actions'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Reeply AI Chatbot'
}

export default async function IndexPage() {
  const id = nanoid()
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

  redirect(`/chat/${id}`)
}
