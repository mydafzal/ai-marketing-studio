"use client";

import React from 'react';
import { Target, DollarSign, Plus, Edit2 } from 'lucide-react'; // Added Edit2 here
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { IconSpinner } from '@/components/ui/icons';
import { toast } from 'sonner';
import { FbCampaign } from './CampaignPreviewPanel'; 
import { format } from 'date-fns';

interface CampaignSlideProps {
  campaign: FbCampaign | undefined;
  campaigns: FbCampaign[];
  setCampaignId: (id: string) => void;
  isCreatingCampaign: boolean;
  handleCreateCampaign: () => Promise<void>;
  specialAdCategory: string;
  setSpecialAdCategory: (val: string) => void;
  abTestEnabled: boolean;
  setAbTestEnabled: (val: boolean) => void;
  safeConfig: any; // or the CampaignConfig interface
  tempBudget: string;
  setTempBudget: (val: string) => void;
  setShowBudgetModal: (val: boolean) => void;
}

export function CampaignSlide({
  campaign,
  campaigns,
  setCampaignId,
  isCreatingCampaign,
  handleCreateCampaign,
  specialAdCategory,
  setSpecialAdCategory,
  abTestEnabled,
  setAbTestEnabled,
  safeConfig,
  tempBudget,
  setTempBudget,
  setShowBudgetModal
}: CampaignSlideProps) {

  return (
    <>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-blue-400" />
            <h3 className="font-medium">Campaign</h3>
          </div>
        </div>
        <Select
          value={campaign?.id}
          onValueChange={(value) => setCampaignId(value)}
        >
          <SelectTrigger className="w-full bg-secondary border-border text-foreground">
            <SelectValue placeholder="Select a campaign" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-border">
            {campaigns.map((camp: FbCampaign) => (
              <SelectItem key={camp.id} value={camp.id}>
                <div className="flex flex-col">
                  <span>{camp.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {camp.status} • {format(new Date(camp.created_time), 'MMM d, yyyy')}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          disabled={isCreatingCampaign}
          onClick={handleCreateCampaign}
          className="w-full mt-2"
        >
          {isCreatingCampaign ? (
            <IconSpinner className="size-4 mr-2 animate-spin" />
          ) : (
            <Plus className="size-4 mr-2" />
          )}
          Create New Campaign
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="size-5 text-green-400" />
            <h3 className="font-medium">Daily Budget</h3>
          </div>
          <button
            onClick={() => {
              setTempBudget(campaign?.daily_budget || '');
              toast.info('Open budget modal');
              setShowBudgetModal(true);
            }}
            className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
          >
            <Edit2 className="size-4" />
          </button>
        </div>
        <p className="text-muted-foreground">
          {campaign?.daily_budget ? `€${campaign.daily_budget}/day` : 'Not set yet'}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Special Ad Category
        </Label>
        <Select
          value={specialAdCategory || 'NONE'}
          onValueChange={val => setSpecialAdCategory(val)}
        >
          <SelectTrigger className="w-full bg-secondary border-border text-foreground">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-border">
            <SelectItem value="NONE">None</SelectItem>
            <SelectItem value="RECRUITING">Recruiting Campaigns</SelectItem>
            <SelectItem value="REAL_ESTATE">Real Estate Campaigns</SelectItem>
            <SelectItem value="CREDIT">Credit Campaigns</SelectItem>
            <SelectItem value="POLITICAL">Political Campaigns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="abTest"
          checked={abTestEnabled}
          onCheckedChange={() => setAbTestEnabled(!abTestEnabled)}
        />
        <Label htmlFor="abTest" className="text-sm font-medium">
          Enable A/B Testing
        </Label>
      </div>
    </>
  );
}
