'use client'

import React from 'react'
import { BotCard } from "@/components/stocks/message"
import { useActiveUI } from '@/components/stocks/active-ui-context'
import { Support } from '@/components/stocks/support'

interface SupportComponentProps {
  title?: string;
}

// The main component that shows both the sidebar (via Active UI) and a message in the chat
export default function SupportComponent({ 
  title = "Reeply AI Support"
}: SupportComponentProps) {
  const { setActiveUI } = useActiveUI();
  
  React.useEffect(() => {
    // Create the content to show in the sidebar
    const sidebarContent = (
      <div className="flex flex-col h-full">
        <Support title={title} />
      </div>
    );
    
    // Set the active UI to display in the sidebar
    setActiveUI(sidebarContent, 'supportComponent', 'Reeply AI Support');
    
    // Cleanup function
    return () => {
      // Optional cleanup if needed
    };
  }, [title, setActiveUI]);
  
  // Return the message to show in the chat
  return (
    <BotCard>
      <p>
        Ihave opened our support scheduling tool in the sidebar. You can book a meeting with our support team at your convenience.
      </p>
    </BotCard>
  );
}