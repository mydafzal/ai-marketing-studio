"use server";

import { BotCard } from "@/components/stocks/message"
import { ConnectCampaignActiveUIWrapper } from "./active-ui-wrapper"
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper";
import ConnectCampaign from "./";

interface ConnectCampaignServerProps {
  connectingUiProps?: {
    campaignName: string
    success: boolean
  }
}

/**
 * Server component that renders the Campaign Connection UI
 * to be displayed in the side panel when called by the AI
 * NOTE: This component is NOT directly used by the UI magic module,
 * which instead calls the ActiveUIWrapper + returns JSX directly.
 * This is kept for potential future direct server component usage.
 */
export default async function showCampaignConnection({ 
  connectingUiProps 
}: ConnectCampaignServerProps) {
  
  // Create the component that will be displayed in the sidebar
  const campaignConnectionComponent = (
    <div className="flex flex-col h-full">
      <ConnectCampaign connectingUiProps={connectingUiProps} />
    </div>
  );
  
  return (
    <>
      {/* This registers the component with the active UI context */}
      <ConnectCampaignActiveUIWrapper connectingUiProps={connectingUiProps} />
      
      {/* This adds content to the sidebar and automatically opens it */}
      <SidebarContentWrapper 
        content={campaignConnectionComponent}
        title="Connect Campaign"
        onMount={true}
      />
      
      <BotCard>
        <p>
          You can select from available campaigns in the sidebar. 
          Choose an existing campaign to connect to this chat or create a new one.
        </p>
      </BotCard>
    </>
  );
}