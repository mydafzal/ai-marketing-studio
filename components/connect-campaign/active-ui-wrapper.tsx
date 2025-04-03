'use client';

import { useEffect } from 'react';
import { useActiveUI } from '@/components/stocks/active-ui-context';
import { ConnectCampaign } from '@/components/connect-campaign';

interface ConnectCampaignActiveUIWrapperProps {
  connectingUiProps?: {
    campaignName: string;
    success: boolean;
  };
}

export function ConnectCampaignActiveUIWrapper({ 
  connectingUiProps
}: ConnectCampaignActiveUIWrapperProps) {
  const { setActiveUI } = useActiveUI();
  
  useEffect(() => {
    // Create the content to show in the sidebar
    const sidebarContent = (
      <div className="flex flex-col h-full">
        <ConnectCampaign connectingUiProps={connectingUiProps} />
      </div>
    );
    
    // Set this component as the active UI - following BudgetSetter pattern
    setActiveUI(sidebarContent, 'connectCampaign', 'Connect Campaign');
    
    // Cleanup function - not really needed as the context handles this
    return () => {
      // Optional cleanup if needed
    };
  }, [setActiveUI, connectingUiProps]);
  
  return null;
}