"use server";

import { BotCard } from "@/components/stocks/message";
import { CreateCampaignForm } from "../components/CreateCampaignForm";
import { SidebarContentWrapper } from "@/components/sidebar-content-wrapper";

// Need to dynamically import the client component
import { CreateCampaignActiveUIWrapper } from "../components/active-ui-wrapper";

/**
 * Server component that renders the CreateCampaignScreen
 * to be displayed in the side panel when called by the AI
 */
export default async function showCreateCampaignScreen() {
  return (
    <>
      {/* This registers the component with the active UI context */}
      <CreateCampaignActiveUIWrapper />
      
      {/* This explicitly opens the sidebar */}
      <SidebarContentWrapper 
        content={<CreateCampaignForm />}
        title="Create Campaign"
        onMount={true}
      />
      
      <BotCard>
        <p>Campaign creation form is now open in the sidebar. You can create a new campaign by filling out the form.</p>
      </BotCard>
    </>
  );
}