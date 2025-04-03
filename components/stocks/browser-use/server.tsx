"use server";

import { BrowserUse } from "./browser-use"
import { BotCard } from "@/components/stocks/message"
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper"

/**
 * Server component that renders the BrowserUse component
 * to be displayed in the side panel when called by the AI
 */
export default async function showBrowserUse({ researchQuery = "" }: { researchQuery?: string }) {
  // Create the component that will be displayed in the sidebar
  const browserUseComponent = (
    <div className="flex flex-col h-full relative">
      <BrowserUse defaultPrompt={researchQuery} />
    </div>
  );
  
  return (
    <>
      {/* This adds content to the sidebar and automatically opens it */}
      <SidebarContentWrapper 
        content={browserUseComponent}
        title="AI Browser Research"
        onMount={true}
      />
      
      <BotCard>
        <p>The AI browser research agent is now active in the sidebar. You can watch the agent browse the web in real-time and use the "Expand View" button for a larger display. Research results will be sent to this chat when complete.</p>
      </BotCard>
    </>
  );
}