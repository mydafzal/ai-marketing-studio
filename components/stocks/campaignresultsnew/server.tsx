"use server";

import { BotCard } from "@/components/stocks/message"
import { CampaignResultsActiveUIWrapper } from "./active-ui-wrapper"
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper";
import { Stock } from './'

interface CampaignResultsServerProps {
  campaignId: string;
  guideForUser?: string;
}

export default async function showCampaignResults({ 
  campaignId, 
  guideForUser 
}: CampaignResultsServerProps) {
  
  if (!campaignId) {
    return (
      <BotCard>
        <p>Invalid campaign ID. Please provide a valid campaign ID.</p>
      </BotCard>
    );
  }
  
  // Create the component that will be displayed in the sidebar
  const campaignResultsComponent = (
    <div className="flex flex-col h-full">
      <Stock campaignId={campaignId} isActive={true} />
      {guideForUser && <div className="mt-4">{guideForUser}</div>}
    </div>
  );
  
  return (
    <>
      {/* This registers the component with the active UI context */}
      <CampaignResultsActiveUIWrapper 
        campaignId={campaignId}
        guideForUser={guideForUser}
      />
      
      {/* This explicitly opens the sidebar */}
      <SidebarContentWrapper 
        content={campaignResultsComponent}
        title="Campaign Results"
        onMount={true}
      />
      
      <BotCard>
        <p>
          Campaign results for &quot;{campaignId}&quot; are now available in the sidebar. 
          You can view detailed metrics and performance data there.
        </p>
      </BotCard>
    </>
  );
}