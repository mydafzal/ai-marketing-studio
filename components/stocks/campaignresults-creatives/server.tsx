import { BotCard } from "@/components/stocks/message";
import { AdCreativesActiveUIWrapper } from "./active-ui-wrapper";

/**
 * Server component that renders the AdCreativesComparison
 * to be displayed in the side panel when called by the AI
 */
export default function showAdCreativesComparison({ campaignId }: { campaignId: string }) {
  return (
    <>
      <AdCreativesActiveUIWrapper campaignId={campaignId} />
      <BotCard>
        <p>Campaign creative performance metrics are now displayed in the sidebar. You can analyze which ads are performing best and make adjustments as needed.</p>
      </BotCard>
    </>
  );
}