import { SidebarDesktop } from '@/components/sidebar-desktop'
import { FacebookAccountNavServer } from '@/components/facebook-account-nav-server'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <>
      <FacebookAccountNavServer />
      <div className="relative flex h-[calc(100vh_-_theme(spacing.32))] overflow-hidden mt-16">
        <SidebarDesktop />
        {children}
      </div>
    </>
  )
}
