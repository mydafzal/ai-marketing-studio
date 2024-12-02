// /*
// import { nanoid } from '@/lib/utils'
// import { Chat } from '@/components/chat'
// import { AI } from '@/lib/chat/actions'
// import { auth } from '@/auth'
// import { Session } from '@/lib/types'
// import { getMissingKeys } from '@/app/actions'

// export const metadata = {
//   title: 'Reeply AI Chatbot'
// }

// export default async function IndexPage() {
//   const id = nanoid()
//   const session = (await auth()) as Session
//   const missingKeys = await getMissingKeys()

//   return (
//     <AI initialAIState={{ chatId: id, messages: [] }}>
//       <Chat id={id} session={session} missingKeys={missingKeys} />
//     </AI>
//   )
// }
// */
import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys } from '@/app/actions'
import { redirect } from 'next/navigation'
import  { useState } from "react";

import { SidebarDesktop } from '@/components/sidebar-desktop'
import { Subscription } from '@/components/subscription/subscription'


export const metadata = {
  title: 'Reeply AI Chatbot'
}

export default async function IndexPage() {

  
    return (
        <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
        <SidebarDesktop />
        <Subscription />
        
       
      </div>
  )
}
