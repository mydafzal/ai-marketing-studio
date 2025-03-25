"use server";

import { BotCard } from "@/components/stocks/message";
import { AdCreativesActiveUIWrapper } from "./active-ui-wrapper";
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper";
import AdCreativesComparison from "./";

/**
 * Server component that renders the AdCreativesComparison
 * to be displayed in the side panel when called by the AI
 */
export default async function showAdCreativesComparison({ campaignId }: { campaignId: string }) {
  // Create the component that will be displayed in the sidebar
  const creativeComparisonComponent = (
    <div className="flex flex-col h-full">
      <AdCreativesComparison campaignId={campaignId} />
    </div>
  );
  
  return (
    <>
      {/* This registers the component with the active UI context */}
      <AdCreativesActiveUIWrapper campaignId={campaignId} />
      
      {/* This adds content to the sidebar and automatically opens it */}
      <SidebarContentWrapper 
        content={creativeComparisonComponent}
        title="Ad Creatives Performance"
        onMount={true}
      />
      
      <BotCard>
        <p>Campaign creative performance metrics are now displayed in the sidebar. You can analyze which ads are performing best and make adjustments as needed.</p>
      </BotCard>
    </>
  );
}