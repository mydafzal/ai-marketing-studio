"use client"

import React, { useEffect, useContext, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Check,
  Plus
} from 'lucide-react';
import { CampaignContext } from '@/components/contexts/campaign-context';
import { IconSpinner } from '@/components/ui/icons';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { sleep } from '@/lib/utils';
import { useActions, useAIState, useUIState } from 'ai/rsc';
import { Adset } from '@/lib/types';
import FormBuilder from '@/components/form-builder';
import GeographicalLocation from '@/components/geographical-location';
import { type AI } from '@/lib/chat/actions';
import { PlacementTargeting } from '@/components/placement-targeting'; 
import { AdTextItem } from './AdTextItem';
import { CreativeSlide } from './CreativeSlide';
import { CampaignSlide } from './CampaignSlide';
import { AdSetSlide } from './AdSetSlide';
import { SocialPreview } from './SocialPreview';

export interface FbCampaign {
  id: string;
  name: string;
  status: string;
  created_time: string;
  daily_budget: string;
}

interface CampaignConfig {
  type: string;
  budget: number;
  targeting: {
    locations: string[];
    ageRange: { min: number; max: number };
    interests: string[];
    countries?: string[];
    regions?: string[];
    cities?: string[];
    genders?: number[];
  };
  images: string[];
  adText: string;
  placements?: {
    facebook: string[];
    instagram: string[];
  };
}

const defaultConfig: CampaignConfig = {
  type: '',
  budget: 0,
  targeting: {
    locations: [],
    ageRange: { min: 18, max: 65 },
    interests: []
  },
  images: [],
  adText: '',
  placements: {
    facebook: [],
    instagram: []
  }
};

interface AdText {
  headline: string;
  text: string;
  image: string;
  fbAdId?: string;
  date?: string;
  id?: string;
}

export function CampaignPreviewPanel({ 
  userInfo,
  config = defaultConfig,
  onConfigUpdate 
}: { 
  userInfo?: string;
  config?: CampaignConfig;
  onConfigUpdate: (config: Partial<CampaignConfig>) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [activeSlide, setActiveSlide] = useState(1); // 1 = Campaign, 2 = Ad Set, 3 = Creative & Lead Form
  const safeConfig = { ...defaultConfig, ...config };

  const { 
    campaign,
    campaigns,
    adset,
    adsets,
    setId: setCampaignId,
    setAdset,
    getCampaignList,
    fetchAdsets
  } = useContext(CampaignContext);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTargetingModal, setShowTargetingModal] = useState(false);
  const [showCreativeModal, setShowCreativeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [showLeadFormModal, setShowLeadFormModal] = useState(false);

  const [tempBudget, setTempBudget] = useState(campaign?.daily_budget || '');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [adTexts, setAdTexts] = useState<AdText[]>([]);
  const [loadingAdText, setLoadingAdText] = useState(false);
  const [previewAdText, setPreviewAdText] = useState<AdText | null>(null);

  const [specialAdCategory, setSpecialAdCategory] = useState('NONE');
  const [abTestEnabled, setAbTestEnabled] = useState(false);

  const { confirmCreateAd } = useActions();

  useEffect(() => {
    if (!userInfo) return;
    const newConfig: Partial<CampaignConfig> = {
      targeting: { ...safeConfig.targeting }
    };

    const locationMatch = userInfo?.match(/location:\s*([^,.]+)/i);
    if (locationMatch) {
      newConfig.targeting!.locations = [locationMatch[1].trim()];
    }

    const interestsMatch = userInfo?.match(/interests:\s*([^,.]+)/i);
    if (interestsMatch) {
      newConfig.targeting!.interests = interestsMatch[1].split(',').map(i => i.trim());
    }

    const ageMatch = userInfo?.match(/age range:\s*(\d+)-(\d+)/i);
    if (ageMatch) {
      newConfig.targeting!.ageRange = {
        min: parseInt(ageMatch[1]),
        max: parseInt(ageMatch[2])
      };
    }

    onConfigUpdate(newConfig);
  }, [userInfo, safeConfig.targeting, onConfigUpdate]);

  const [isCreatingCampaign, setCreatingCampaign] = useState(false);
  const [isCreatingAdset, setCreatingAdset] = useState(false);

  const handleCreateCampaign = async () => {
    try {
      setCreatingCampaign(true);
      const response = await fetch('/api/fasty-bot/proxy-create-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (data.success && data.data.campaign.id) {
        setCampaignId(data.data.campaign.id);
        await getCampaignList();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleCreateAdset = async () => {
    if (!campaign?.id) return;
    
    setCreatingAdset(true);
    try {
      const response = await fetch('/api/fasty-bot/create-adset', {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: campaign.id,
          daily_budget: campaign.daily_budget || 100
        })
      });
      const data = await response.json();
      if (data.success && data.id) {
        setAdset(data);
        await fetchAdsets();
      }
    } catch (error) {
      console.error('Error creating adset:', error);
    } finally {
      setCreatingAdset(false);
    }
  };

  const handleShowPreview = () => {
    if (adTexts.length > 0) {
      setPreviewAdText(adTexts[adTexts.length - 1]);
      toast.info('Previewing last ad text & image');
      setShowPreviewModal(true);
    } else {
      toast.error('No ad creative available to preview');
    }
  };

  const handleDemographicDataUpdate = (demographicData: any) => {
    let locations: string[] = [];
    if (demographicData.cities && demographicData.cities.length > 0) {
      locations = demographicData.cities.map((city: { name: string }) => city.name);
    } else if (demographicData.regions && demographicData.regions.length > 0) {
      locations = demographicData.regions.map((region: { name: string }) => region.name);
    } else if (demographicData.countries && demographicData.countries.length > 0) {
      locations = demographicData.countries.map((country: { name: string }) => country.name);
    }

    const age_min = demographicData.age_min ?? safeConfig.targeting.ageRange.min;
    const age_max = demographicData.age_max ?? safeConfig.targeting.ageRange.max;
    const genders = demographicData.genders ?? safeConfig.targeting.genders ?? [];

    onConfigUpdate({
      targeting: {
        ...safeConfig.targeting,
        locations: locations.length > 0 ? locations : safeConfig.targeting.locations,
        ageRange: { min: age_min, max: age_max },
        genders
      }
    });
    toast.success('Targeting updated successfully!');
  };

  const handlePlacementUpdate = (placementData: { facebook_positions: string[], instagram_positions: string[] }) => {
    onConfigUpdate({
      placements: {
        facebook: placementData.facebook_positions || [],
        instagram: placementData.instagram_positions || []
      }
    });
    // Show success message and close modal
    toast.success('Placement targeting updated successfully!');
    setShowPlacementModal(false);
  };

  return (
    <div className="fixed right-4 top-20 w-96 z-50 transition-all duration-300 ease-in-out">
      <Card className="bg-background text-foreground border-border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-xl font-semibold">Campaign Preview</h2>
            <p className="text-sm text-muted-foreground">Live configuration</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="size-6" /> : <ChevronDown className="size-6" />}
          </button>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-6">

            {/* Slide Navigation */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button 
                variant={activeSlide === 1 ? "default" : "outline"}
                onClick={() => setActiveSlide(1)}
              >
                Campaign
              </Button>
              <Button 
                variant={activeSlide === 2 ? "default" : "outline"}
                onClick={() => setActiveSlide(2)}
                disabled={!campaign}
              >
                Ad Set
              </Button>
              <Button 
                variant={activeSlide === 3 ? "default" : "outline"}
                onClick={() => setActiveSlide(3)}
                disabled={!adset}
              >
                Creative & Lead Form
              </Button>
            </div>

            {activeSlide === 1 && (
              <>
                <CampaignSlide
                  campaign={campaign ?? undefined} // Ensure we pass undefined if campaign is null
                  campaigns={campaigns}
                  setCampaignId={setCampaignId}
                  isCreatingCampaign={isCreatingCampaign}
                  handleCreateCampaign={handleCreateCampaign}
                  specialAdCategory={specialAdCategory}
                  setSpecialAdCategory={setSpecialAdCategory}
                  abTestEnabled={abTestEnabled}
                  setAbTestEnabled={setAbTestEnabled}
                  safeConfig={safeConfig}
                  tempBudget={tempBudget}
                  setTempBudget={setTempBudget}
                  setShowBudgetModal={setShowBudgetModal}
                />
              </>
            )}

            {activeSlide === 2 && (
              <>
                <AdSetSlide
                  campaign={campaign}
                  adsets={adsets}
                  adset={adset}
                  setAdset={setAdset}
                  fetchAdsets={fetchAdsets}
                  isCreatingAdset={isCreatingAdset}
                  handleCreateAdset={handleCreateAdset}
                  safeConfig={safeConfig}
                  setShowTargetingModal={setShowTargetingModal}
                  setShowPlacementModal={setShowPlacementModal}
                />
              </>
            )}

            {activeSlide === 3 && (
              <>
                <CreativeSlide
                  safeConfig={safeConfig}
                  adTexts={adTexts}
                  handleShowPreview={handleShowPreview}
                  setShowCreativeModal={setShowCreativeModal}
                  setShowLeadFormModal={setShowLeadFormModal}
                />
                {adTexts.length > 0 && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                    disabled={!campaign || !adset}
                  >
                    <Check className="size-4 mr-2" /> Launch Campaign
                  </Button>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Budget Modal */}
      <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
        <DialogContent className="bg-background text-foreground border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Daily Budget</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set your desired daily spend for this campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              type="number"
              value={tempBudget}
              onChange={(e) => setTempBudget(e.target.value)}
              placeholder="Enter daily budget in EUR"
            />
            <Button onClick={async () => {
              if (!tempBudget || !campaign?.id) {
                toast.error('Please enter a valid budget.');
                return;
              }

              try {
                const updateSuccess = await (await fetch(`/api/fasty-bot/set-daily-budget`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json'},
                  body: JSON.stringify({ campaignId: campaign.id, budget: Number(tempBudget) })
                })).json();

                if (updateSuccess.success) {
                  onConfigUpdate({ budget: Number(tempBudget) });
                  await getCampaignList();
                  toast.success('Budget updated successfully');
                  setShowBudgetModal(false);
                } else {
                  toast.error('Failed to update budget');
                }
              } catch (error) {
                console.error('Error updating budget:', error);
                toast.error('Failed to update budget');
              }
            }}>Save</Button>
          </div>
          <DialogClose asChild>
            <Button variant="outline" className="absolute top-3 right-3 size-4">X</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Targeting Modal */}
      <Dialog open={showTargetingModal} onOpenChange={setShowTargetingModal}>
        <DialogContent className="bg-background text-foreground border-border max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Targeting</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update locations, age range, and other demographic targeting.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <GeographicalLocation 
              toolCallId="toolCallId-location" 
              isReadOnly={false}
              onDemographicDataUpdate={handleDemographicDataUpdate}
            />
          </div>
          <DialogClose asChild>
            <Button variant="outline" className="absolute top-3 right-3 size-4">X</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Creative Modal */}
      <Dialog open={showCreativeModal} onOpenChange={setShowCreativeModal}>
        <DialogContent className="bg-background text-foreground border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Creative</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload images and get AI-generated ad text for your campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <IconSpinner className="size-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="size-4 mr-2" />
                )}
                Upload Image
              </Button>
              <input
                ref={imageInputRef}
                style={{ display: 'none' }}
                type="file"
                accept="image/png, image/jpeg"
                onChange={() => {
                  toast.info('Image upload logic goes here.');
                }}
              />

              {loadingAdText && (
                <div className="flex items-center justify-center p-4 text-muted-foreground space-x-2">
                  <IconSpinner className="size-4 animate-spin" />
                  <span>Generating ad text from AI...</span>
                </div>
              )}

              {adTexts.length > 0 && (
                <div className="space-y-6">
                  {adTexts.map((adText, index) => (
                    <AdTextItem
                      key={`${adText.date}-${index}`}
                      index={index}
                      adText={adText}
                      updateText={(idx, oldText, newText) => {
                        setAdTexts(prev => 
                          prev.map((text, i) => 
                            i === idx ? newText : text
                          )
                        );
                        onConfigUpdate({ adText: newText.text });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={() => {
                toast.info('Saving changes to creative...');
                setShowCreativeModal(false);
              }} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </div>
          <DialogClose asChild>
            <Button variant="outline" className="absolute top-3 right-3 size-4">
              X
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="bg-background text-foreground border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle>Ad Preview</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preview how your ad will look on different platforms
            </DialogDescription>
          </DialogHeader>
          
          {previewAdText && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <SocialPreview
                platform="instagram"
                image={previewAdText.image}
                headline={previewAdText.headline}
                text={previewAdText.text}
              />
              <SocialPreview
                platform="facebook"
                image={previewAdText.image}
                headline={previewAdText.headline}
                text={previewAdText.text}
              />
            </div>
          )}
          
          <DialogClose asChild>
            <Button variant="outline" className="absolute top-3 right-3 size-4">
              X
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Placement Modal */}
      <Dialog open={showPlacementModal} onOpenChange={setShowPlacementModal}>
        <DialogContent className="bg-background text-foreground border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle>Ad Placement</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose where your ads will appear across platforms.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <PlacementTargeting 
              toolCallId={'toolCallId-placement'}
              onPlacementUpdate={handlePlacementUpdate}
            />
          </div>
          <DialogClose asChild>
            <Button variant="outline" className="absolute top-3 right-3 size-4">
              X
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Lead Form Modal */}
      <Dialog open={showLeadFormModal} onOpenChange={setShowLeadFormModal}>
        <DialogContent className="bg-background text-foreground border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle>Lead Form</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure your lead form fields and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <FormBuilder toolCallId={'toolCallId-form'} />
          </div>
          <DialogClose asChild>
            <Button variant="outline" className="absolute top-3 right-3 size-4">
              X
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CampaignPreviewPanel;
