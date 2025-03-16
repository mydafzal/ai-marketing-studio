import { BotCard } from "@/components/stocks/message";
import { CreateCampaignScreen } from "@/components/stocks/create-campaign-screen";

/**
 * Server component that renders the CreateCampaignScreen
 * to be displayed in the side panel when called by the AI
 */
export default function showCreateCampaignScreen() {
  return (
    <BotCard>
      <CreateCampaignScreen />
    </BotCard>
  );
}