"use server";

import { BotCard } from "@/components/stocks/message"
import { SupportActiveUIWrapper } from "./active-ui-wrapper"
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper";
import { Support } from '@/components/stocks/support'

interface SupportServerProps {
  title?: string;
}

/**
 * Server component that renders the Support Component
 * to be displayed in the side panel when called by the AI
 */
export default async function showSupportComponent({ 
  title = "Reeply AI Support"
}: SupportServerProps) {
  // Create the support component that will be displayed in the sidebar
  const supportComponent = (
    <div className="flex flex-col h-full">
      <Support title={title} />
    </div>
  );
  
  return (
    <>
      {/* This registers the component with the active UI context */}
      <SupportActiveUIWrapper 
        title={title}
      />
      
      {/* This explicitly opens the sidebar */}
      <SidebarContentWrapper 
        content={supportComponent}
        title="Reeply AI Support"
        onMount={true}
      />
      
      <BotCard>
        <p>
          I have opened our support scheduling tool in the sidebar. You can book a meeting with our support team at your convenience.
        </p>
      </BotCard>
    </>
  );
}