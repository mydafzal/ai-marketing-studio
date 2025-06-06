import { SidebarDesktop } from '@/components/sidebar-desktop'
import { isFeatureToggleEnabled } from '@/lib/helpers/feature-toggle/feature-toggle-manager'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  const isLegacyMode = isFeatureToggleEnabled('legacyChatMode')
  
  // For homepage dashboard (non-legacy mode), use full screen layout
  if (!isLegacyMode) {
    return (
      <div className="relative h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
        <SidebarDesktop />
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    )
  }
  
  // For legacy chat mode, use the original sidebar layout
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
      <SidebarDesktop />
      {children}
    </div>
  )
}
