'use client'

import { Sidebar } from '@/components/sidebar'
import { ChatHistory } from '@/components/chat-history'
import useAccountStore from '@/app/store/useAccountStore'

export default function SidebarContent({ userId }: { userId: string }) {
  const { isFbAccountConnected } = useAccountStore() //  Zustand store is now inside a client component

  if (!isFbAccountConnected) {
    return null // ✅ Return null if Facebook is not connected
  }

  return (
    <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r border-[#2A2E3A] duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      <ChatHistory userId={userId} />
    </Sidebar>
  )
}
