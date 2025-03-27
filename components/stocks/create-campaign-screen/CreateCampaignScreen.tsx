'use client';

import React from 'react';
import { CreateCampaignForm } from './components/CreateCampaignForm';

export function CreateCampaignScreen() {
  // We now directly render the form to be used in SidebarContentWrapper
  return (
    <div className="flex flex-col h-full">
      <CreateCampaignForm />
    </div>
  );
}

export default CreateCampaignScreen;