import { clearChats, getChats } from '@/app/actions'
import { ClearHistory } from '@/components/clear-history'
import { SidebarItems } from '@/components/sidebar-items'
import { cache } from 'react'

interface SidebarListProps {
  userId?: string
  children?: React.ReactNode
}

const loadChats = cache(async (userId?: string) => {
  return await getChats(userId)
})

export async function SidebarList({ userId }: SidebarListProps) {
  const chats = await loadChats(userId)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto px-2 pt-2">
        {chats?.length ? (
          <div className="space-y-1">
            <SidebarItems chats={chats} />
          </div>
        ) : (
          <div className="p-8 text-center mt-4">
            <p className="text-sm text-[#8A8F99]">No chat history</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end p-4 border-t border-[#2A2E3A] mt-2">
        <ClearHistory clearChats={() => clearChats().then(() => {})} isEnabled={chats?.length > 0} />
      </div>
    </div>
  )
}