"use client"

import React, { useEffect, useContext, useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Target, 
  DollarSign, 
  Image as ImageIcon, 
  Check,
  Plus,
  AlertCircle,
  Pencil,
  X,
  Instagram,
  Facebook,
  Eye
} from 'lucide-react';
import { CampaignContext } from '@/components/contexts/campaign-context';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { IconSpinner } from '@/components/ui/icons';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn, sleep } from '@/lib/utils';
import Image from 'next/image';
import { useActions } from 'ai/rsc';
import { Adset, LeadgenFrom } from '@/lib/types';
import { PlacementTargeting } from '@/components/placement-targeting';
import FormBuilder from '@/components/form-builder';
import GeographicalLocation from '@/components/geographical-location';

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

interface FbCampaign {
  id: string;
  name: string;
  status: string;
  created_time: string;
  daily_budget: string;
}

interface AdsetData {
  id: string;
  name: string;
  status?: string;
  created_time?: string;
}

interface AdText {
  headline: string;
  text: string;
  image: string;
  fbAdId?: string;
  date?: string;
  id?: string;
}

const specialCategories = [
  { value: 'NONE', label: 'None' },
  { value: 'RECRUITING', label: 'Recruiting Campaigns' },
  { value: 'REAL_ESTATE', label: 'Real Estate Campaigns' },
  { value: 'CREDIT', label: 'Credit Campaigns' },
  { value: 'POLITICAL', label: 'Political Campaigns' }
];

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

const SocialPreview = ({
  platform,
  image,
  headline,
  text,
}: {
  platform: 'instagram' | 'facebook'
  image: string
  headline: string
  text: string
}) => {
  return (
    <div className={cn(
      "w-full rounded-lg overflow-hidden",
      "bg-white dark:bg-zinc-800",
      platform === 'instagram' ? "instagram-preview" : "facebook-preview"
    )}>
      <div className="p-3 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-700">
        {platform === 'instagram' ? (
          <Instagram className="size-5 text-pink-600" />
        ) : (
          <Facebook className="size-5 text-blue-600" />
        )}
        <span className="font-medium text-sm">
          {platform === 'instagram' ? 'Instagram' : 'Facebook'} Ad Preview
        </span>
      </div>
      
      <div className="relative aspect-square">
        {image ? (
          <Image
            src={image}
            alt="Ad preview"
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
        ) : (
          <div className="bg-zinc-300 dark:bg-zinc-700 w-full h-full" />
        )}
      </div>
      
      <div className="p-4">
        <h4 className="font-semibold mb-2">{headline || 'No Headline'}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{text || 'No ad text set yet.'}</p>
        
        <button className={cn(
          "w-full mt-4 py-2 rounded-lg text-center text-sm font-medium",
          platform === 'instagram' 
            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
            : "bg-blue-600 text-white"
        )}>
          Learn More
        </button>
      </div>
    </div>
  )
}

function AdTextItem({
  index,
  adText,
  acceptText,
  updateText
}: {
  index: number
  adText: AdText
  acceptText?: (idx: number, adText: AdText) => Promise<void>
  updateText?: (idx: number, adText: AdText, newAdText: AdText) => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [textEdit, setTextEdit] = useState(adText.text)
  const [headlineEdit, setHeadlineEdit] = useState(adText.headline)
  const hasFbAd = !!adText.fbAdId

  const handleAccept = async () => {
    setIsUpdating(true)
    await sleep(1000)
    if (acceptText) {
      await acceptText(index, adText)
    }
    setIsUpdating(false)
    toast.success('Ad text added to your campaign successfully!')
  }

  const handleSave = async () => {
    setIsUpdating(true)
    await sleep(1000)
    if (updateText) {
      updateText(index, adText, { ...adText, text: textEdit, headline: headlineEdit })
    }
    setIsEditing(false)
    setIsUpdating(false)
    toast.success('Ad text updated successfully!')
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardContent className="p-6">
        {hasFbAd && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-blue-900/20 text-blue-200 rounded-lg border border-blue-800">
            <AlertCircle className="size-5 shrink-0" />
            <span className="text-sm">
              Ad already created with ID: {adText.fbAdId}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SocialPreview
            platform="instagram"
            image={adText.image as string}
            headline={isEditing ? headlineEdit : adText.headline}
            text={isEditing ? textEdit : adText.text}
          />
          <SocialPreview
            platform="facebook"
            image={adText.image as string}
            headline={isEditing ? headlineEdit : adText.headline}
            text={isEditing ? textEdit : adText.text}
          />
        </div>

        {!hasFbAd && isEditing && (
          <div className="mt-6 space-y-4">
            <input
              value={headlineEdit}
              onChange={e => setHeadlineEdit(e.target.value)}
              className={cn(
                "w-full text-center font-semibold p-2",
                "bg-zinc-800 border border-zinc-700 rounded-lg",
                "text-zinc-200 placeholder:text-zinc-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              placeholder="Enter headline"
            />
            
            <textarea
              className={cn(
                "w-full min-h-[120px] p-3",
                "bg-zinc-800 border border-zinc-700 rounded-lg",
                "text-zinc-200 placeholder:text-zinc-400 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              value={textEdit}
              onChange={e => setTextEdit(e.target.value)}
              placeholder="Enter ad text"
            />
          </div>
        )}

        {!hasFbAd && (
          <div className="flex justify-end gap-3 mt-6">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setTextEdit(adText.text)
                    setHeadlineEdit(adText.headline)
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 h-10",
                    "text-zinc-200 text-sm font-medium rounded-lg",
                    "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700",
                    "transition-colors duration-200"
                  )}
                >
                  <X className="size-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className={cn(
                    "flex items-center gap-2 px-4 h-10",
                    "text-white text-sm font-medium rounded-lg",
                    "bg-blue-600 hover:bg-blue-700",
                    "transition-colors duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isUpdating ? (
                    <IconSpinner className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 h-10",
                    "text-zinc-200 text-sm font-medium rounded-lg",
                    "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700",
                    "transition-colors duration-200"
                  )}
                >
                  <Pencil className="size-4" />
                  Edit
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isUpdating}
                  className={cn(
                    "flex items-center gap-2 px-4 h-10",
                    "text-white text-sm font-medium rounded-lg",
                    "bg-blue-600 hover:bg-blue-700",
                    "transition-colors duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isUpdating ? (
                    <IconSpinner className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Accept
                </button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
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

  // Callback when demographic data updates from geolocation
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
  };

  // Callback when placement updates from placement-targeting
  const handlePlacementUpdate = (placementData: { facebook_positions: string[], instagram_positions: string[] }) => {
    // Update config with new placements based on updatedAdset in placement-targeting
    onConfigUpdate({
      placements: {
        facebook: placementData.facebook_positions || [],
        instagram: placementData.instagram_positions || []
      }
    });
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

                {/* Special Ad Category */}
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
                      {specialCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* A/B Test Toggle */}
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
            )}

            {activeSlide === 2 && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Target className="size-5 text-purple-400" />
                      <h3 className="font-medium">Ad Set</h3>
                    </div>
                  </div>
                  {campaign ? (
                    <>
                      <Select
                        value={adset?.id}
                        onValueChange={(value) => {
                          const selectedAdset = adsets.find(a => a.id === value);
                          if (selectedAdset) setAdset(selectedAdset);
                        }}
                      >
                        <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                          <SelectValue placeholder="Select an ad set" />
                        </SelectTrigger>
                        <SelectContent className="bg-secondary border-border">
                          {adsets.map((as: AdsetData) => (
                            <SelectItem key={as.id} value={as.id}>
                              <div className="flex flex-col">
                                <span>{as.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {as.status} {as.created_time && ` • ${format(new Date(as.created_time), 'MMM d, yyyy')}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCreatingAdset}
                        onClick={handleCreateAdset}
                        className="w-full mt-2"
                      >
                        {isCreatingAdset ? (
                          <IconSpinner className="size-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="size-4 mr-2" />
                        )}
                        Create New Ad Set
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">Please select a campaign first</p>
                  )}
                </div>

                {/* Targeting */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Target className="size-5 text-purple-400" />
                      <h3 className="font-medium">Targeting</h3>
                    </div>
                    <button
                      onClick={() => setShowTargetingModal(true)}
                      className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
                    >
                      <Edit2 className="size-4" />
                    </button>
                  </div>
                  <div className="space-y-1 text-muted-foreground text-sm">
                    <p>📍 {safeConfig.targeting.locations?.length
                      ? safeConfig.targeting.locations.join(', ')
                      : 'Location not set'}</p>
                    <p>👥 Age {safeConfig.targeting.ageRange.min}-{safeConfig.targeting.ageRange.max}</p>
                    {safeConfig.targeting.interests.length > 0 ? (
                      <p>🎯 Interests: {safeConfig.targeting.interests.join(', ')}</p>
                    ) : (
                      <p>Interests not set</p>
                    )}
                  </div>
                </div>

                {/* Placement Targeting */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Instagram className="size-5 text-pink-600" />
                      <Facebook className="size-5 text-blue-600" />
                      <h3 className="font-medium">Ad Placement</h3>
                    </div>
                    <button
                      onClick={() => setShowPlacementModal(true)}
                      className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
                    >
                      <Edit2 className="size-4" />
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {safeConfig.placements
                      ? `Facebook: ${safeConfig.placements.facebook?.join(', ') || 'None'} | Instagram: ${safeConfig.placements.instagram?.join(', ') || 'None'}`
                      : 'No placements selected'}
                  </p>
                </div>
              </>
            )}

            {activeSlide === 3 && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="size-5 text-orange-400" />
                      <h3 className="font-medium">Creative</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleShowPreview}
                        className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
                        disabled={adTexts.length === 0}
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        onClick={() => setShowCreativeModal(true)}
                        className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
                      >
                        <Edit2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      {safeConfig.images.length > 0 ? `${safeConfig.images.length} images selected` : 'No images uploaded'}
                    </p>
                    {safeConfig.adText && (
                      <p>
                        Ad Text: {safeConfig.adText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lead Form */}
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Target className="size-5 text-purple-400" />
                      <h3 className="font-medium">Lead Form</h3>
                    </div>
                    <button
                      onClick={() => setShowLeadFormModal(true)}
                      className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
                    >
                      <Edit2 className="size-4" />
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Configure the lead form to capture user information.
                  </p>
                </div>
              </>
            )}

            {activeSlide === 3 && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                disabled={!campaign || !adset}
              >
                <Check className="size-4 mr-2" /> Launch Campaign
              </Button>
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
