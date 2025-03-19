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
  // Use SidebarContentWrapper with onMount=true to explicitly open the sidebar
  return (
    <>
      <AdCreativesActiveUIWrapper campaignId={campaignId} />
      <SidebarContentWrapper 
        content={<AdCreativesComparison campaignId={campaignId} />}
        title="Ad Creatives Performance"
        onMount={true}
      />
      <BotCard>
        <p>Campaign creative performance metrics are now displayed in the sidebar. You can analyze which ads are performing best and make adjustments as needed.</p>
      </BotCard>
    </>
  );
}