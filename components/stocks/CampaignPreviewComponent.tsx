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
import { ComboBox } from '@/components/ui/combo-box';
import { RangeSlider } from '@/components/range-slider';
import { toast } from 'sonner';
import { cn, builQueryString } from '@/lib/utils';
import Image from 'next/image';
import { useActions } from 'ai/rsc';
import { sleep } from '@/lib/utils';
import { generateAdTemplate, generateAdsetTemplate } from '@/lib/data';
import { Adset, Chat, LeadgenFrom, Message, Session } from '@/lib/types';
import { PlacementTargeting } from '@/components/placement-targeting';
import FormBuilder from '@/components/form-builder';

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

type Country = { key: string; name: string; country_code: string };
type Region = { key: string; name: string };
type City = { key: string; name: string };

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
  adText: ''
};

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

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
        <Image
          src={image}
          alt="Ad preview"
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 448px"
          priority
        />
      </div>
      
      <div className="p-4">
        <h4 className="font-semibold mb-2">{headline}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{text}</p>
        
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
  
  // State for multi-slide navigation
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

  // Modals
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTargetingModal, setShowTargetingModal] = useState(false);
  const [showCreativeModal, setShowCreativeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [showLeadFormModal, setShowLeadFormModal] = useState(false);

  const [tempBudget, setTempBudget] = useState(campaign?.daily_budget || '');

  const [countryData, setCountryData] = useState<Country[]>([]);
  const [selectedGeoLocations, setSelectedGeoLocations] = useState<{
    country: Country | null;
    region: Region | null;
    cities: City[];
    regionData: Region[];
    cityData: City[];
  }[]>([{
    country: null,
    region: null,
    cities: [],
    regionData: [],
    cityData: []
  }]);

  const [ageMin, setAgeMin] = useState(safeConfig.targeting.ageRange.min);
  const [ageMax, setAgeMax] = useState(safeConfig.targeting.ageRange.max);
  const [isMale, setIsMale] = useState<boolean>(false);
  const [isFemale, setIsFemale] = useState<boolean>(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [tempAdText, setTempAdText] = useState(safeConfig.adText);
  const [tempImages, setTempImages] = useState<string[]>([...safeConfig.images]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [adTexts, setAdTexts] = useState<AdText[]>([]);
  const [loadingAdText, setLoadingAdText] = useState(false);

  const [previewAdText, setPreviewAdText] = useState<AdText | null>(null);

  // Additional states for special Ad Category and A/B test
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

  const handleCreateCampaign = async () => {
    if (specialAdCategory || abTestEnabled) {
      // Here you might want to do something with specialAdCategory & abTestEnabled
    }

    // The creation logic remains the same
    try {
      setCreatingCampaign(true);
      const response = await fetch('/api/fasty-bot/proxy-create-base', {
        method: 'POST',
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

  const [isCreatingCampaign, setCreatingCampaign] = useState(false);
  const [isCreatingAdset, setCreatingAdset] = useState(false);

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

  const generateAdTextForImages = async (images: string[]) => {
    setLoadingAdText(true);
    try {
      const adTemplate = generateAdTemplate(
        "Experience Innovation Today",
        "Please generate compelling ad text for a social media advertisement. The ad should have a catchy headline and engaging body text. Return in JSON format with headline and text properties. Make it persuasive and focused on benefits.",
        images[images.length - 1]
      );
      const adsetTemplate = generateAdsetTemplate();
      
      const response = await confirmCreateAd(
        campaign,
        adTemplate,
        adsetTemplate
      );

      let headline = "Experience Innovation Today";
      let text = "Discover a new way to achieve your goals with our revolutionary solution.";

      try {
        const content = response.newMessage.content;
        if (content && typeof content === 'string' && content.includes('Version')) {
          const segments = content.split('"');
          headline = segments[0]?.split(':')?.[1]?.trim() || headline;
          text = segments[1] || text;
        }
      } catch (error) {
        console.error('Error parsing AI response:', error);
      }

      const newAdText: AdText = {
        headline,
        text,
        image: images[images.length - 1],
        date: new Date().toISOString(),
        id: `ad-${Date.now()}`
      };

      setAdTexts(prev => [...prev, newAdText]);
      setPreviewAdText(newAdText);
      setShowPreviewModal(true);
      toast.success('Generated new ad text');

    } catch (error) {
      console.error('Failed to generate ad text:', error);
      toast.error('Failed to generate ad text from AI');
    } finally {
      setLoadingAdText(false);
    }
  }

  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    if (files.length > 1) {
      toast.error('You can select only 1 image at a time.');
      return;
    }

    const file = files[0];
    if (file.size >= MAX_IMAGE_SIZE) {
      toast.error('This image is too big. Please use an image smaller than 4MB.');
      return;
    }

    if (!campaign?.id) {
      toast.error('Please have a campaign selected before uploading images.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('id', campaign.id);
      formData.append('type', 'image');
      formData.append('files', file);

      toast.info('Uploading your image, please wait...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      if (data?.urls?.[0]) {
        const newImages = [...tempImages, data.urls[0]];
        setTempImages(newImages);
        toast.success('Image uploaded successfully!');

        // Generate ad text immediately after upload
        await generateAdTextForImages(newImages);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload the image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  const handleSaveCreative = () => {
    if (adTexts.length > 0) {
      const [firstAdText] = adTexts;
      onConfigUpdate({
        images: tempImages,
        adText: firstAdText.text
      });
    } else {
      onConfigUpdate({
        images: tempImages,
        adText: tempAdText
      })
    }
    setShowCreativeModal(false)
  }

  const handleShowPreview = () => {
    if (adTexts.length > 0) {
      setPreviewAdText(adTexts[adTexts.length - 1]);
      setShowPreviewModal(true);
    } else {
      toast.error('No ad creative available to preview');
    }
  };

  const getCountryList = () => {
    const params = {
      type: 'adgeolocation',
      location_types: "['country']",
      limit: 300
    };
    fetch(`/api/fasty-bot/proxy-search${builQueryString(params)}`)
      .then(response => response.json())
      .then(data => {
        setCountryData((data?.data as Country[]) || [])
      })
      .catch(error => {
        console.error('Error fetching countries:', error)
      })
  }

  const getRegionList = async (countryCode: string): Promise<Region[]> => {
    const params = {
      type: 'adgeolocation',
      location_types: "['region']",
      country_code: countryCode,
      limit: 300,
    }
    try {
      const response = await fetch(`/api/fasty-bot/proxy-search${builQueryString(params)}`)
      const data = await response.json()
      return (data.data as Region[]) || []
    } catch (error) {
      console.error('Error fetching regions:', error)
      return []
    }
  }

  const getCityList = async (regionId: string, q: string) => {
    const params = {
      type: 'adgeolocation',
      location_types: "['city']",
      region_id: regionId,
      q,
      limit: 10
    }
    try {
      const response = await fetch(`/api/fasty-bot/proxy-search${builQueryString(params)}`)
      const data = await response.json()
      const cities = data.data?.filter((e: any) => e?.type === 'city') as City[]
      return cities
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
    return []
  }

  const handleAddCountry = () => {
    setSelectedGeoLocations((prev) => [...prev, {
      country: null,
      region: null,
      cities: [],
      regionData: [],
      cityData: []
    }])
  }

  const handleRemoveCountry = (index: number) => {
    setSelectedGeoLocations((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCountrySelect = async (index: number, country: Country | null) => {
    let regionData: Region[] = []
    if (country) {
      regionData = await getRegionList(country.country_code)
    }
    setSelectedGeoLocations((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              country,
              region: null,
              cities: [],
              regionData: regionData,
              cityData: []
            }
          : item
      )
    )
  }

  const handleRegionSelect = (index: number, region: Region | null) => {
    setSelectedGeoLocations((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              region,
              cities: [],
              cityData: []
            }
          : item
      )
    )
  }

  const handleChangeKeyword = async (index: number, regionSelected: Region | null, value: string) => {
    if (regionSelected && value.length > 0) {
      setLoadingCities(true)
      const cities = await getCityList(regionSelected.key, value)
      setSelectedGeoLocations((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                cityData: cities || []
              }
            : item
        )
      )
      setLoadingCities(false)
    } else {
      setSelectedGeoLocations((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                cityData: []
              }
            : item
        )
      )
    }
  }

  const handleSelectCity = (index: number, value: string) => {
    const city = selectedGeoLocations[index]?.cityData?.find((e) => e.key === value)
    const exist = selectedGeoLocations[index]?.cities?.find((e) => e.key === value)
    if (city && !exist) {
      setSelectedGeoLocations((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                cities: [...item.cities, city],
                cityData: []
              }
            : item
        )
      )
    } else {
      setSelectedGeoLocations((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                cityData: []
              }
            : item
        )
      )
    }
  }

  const handleRemoveCity = (index: number, value: string) => {
    setSelectedGeoLocations((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              cities: item.cities.filter(city => city.key !== value)
            }
          : item
      )
    )
  }

  const handleChangeAge = (min: number, max: number) => {
    setAgeMax(max)
    setAgeMin(min)
  }

  useEffect(() => {
    if (showTargetingModal) {
      getCountryList()
    }
  }, [showTargetingModal])

  const handleSaveTargeting = () => {
    const countries = selectedGeoLocations
      .map(l => l.country?.country_code)
      .filter((c): c is string => !!c)
    const regions = selectedGeoLocations
      .map(l => l.region?.key)
      .filter((r): r is string => !!r)
    const cities = selectedGeoLocations
      .flatMap(l => l.cities)
      .map(c => c.key)

    const genders = []
    if (isMale) genders.push(1)
    if (isFemale) genders.push(2)

    onConfigUpdate({
      targeting: {
        ...safeConfig.targeting,
        ageRange: { min: ageMin, max: ageMax },
        interests: safeConfig.targeting.interests || [],
        countries,
        regions,
        cities,
        genders
      }
    })
    setShowTargetingModal(false)
  }

  // Handle Lead Form submit or integration would be done via form builder modal

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
                {/* Campaign Selection & Budget & Special Ad Category & A/B Test */}
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
                {/* Ad Set */}
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
                    <p>📍 {safeConfig.targeting.countries?.length ? safeConfig.targeting.countries.join(', ') : (safeConfig.targeting.locations?.join(', ') || 'Location not set')}</p>
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
                    Configure where your ads will appear across platforms.
                  </p>
                </div>
              </>
            )}

            {activeSlide === 3 && (
              <>
                {/* Creative & Lead Form */}
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

            {/* Action Button (only appear if all steps done) */}
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
            <Button onClick={() => {
              if (tempBudget) {
                toast.success('Budget updated (please refresh data).')
                setShowBudgetModal(false)
              } else {
                toast.error('Please enter a valid budget.')
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
          <div className="space-y-6 mt-4">
            {selectedGeoLocations.map((geoLocation, index) => (
              <Card key={index} className="bg-secondary border-border">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Location {index + 1}</Label>
                    {selectedGeoLocations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCountry(index)}
                        className="size-8 text-muted-foreground hover:text-foreground"
                      >
                        X
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select
                      value={geoLocation.country?.country_code}
                      onValueChange={value => {
                        const country = countryData.find(e => e.key === value) ?? null
                        handleCountrySelect(index, country)
                      }}
                    >
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent className="bg-secondary border-border">
                        {countryData.map((country: Country) => (
                          <SelectItem key={country.key} value={country.key}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label>Region</Label>
                    <Select
                      value={geoLocation.region?.key}
                      onValueChange={value => {
                        const region = geoLocation.regionData.find(e => e.key === value) ?? null
                        handleRegionSelect(index, region)
                      }}
                      disabled={!geoLocation.country}
                    >
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent className="bg-secondary border-border">
                        {geoLocation.regionData.map((region: Region) => (
                          <SelectItem key={region.key} value={region.key}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label>Cities</Label>
                    <div className="bg-secondary text-foreground rounded-md p-2 space-y-2">
                      <ComboBox
                        disabled={!geoLocation.region}
                        selectedOptions={geoLocation.cities.map(city => ({
                          label: city.name,
                          value: city.key
                        }))}
                        onChangeKeyword={(val: string) => handleChangeKeyword(index, geoLocation.region, val)}
                        options={geoLocation.cityData.map(city => ({
                          label: city.name,
                          value: city.key
                        }))}
                        onSelect={(value) => handleSelectCity(index, value)}
                        onRemove={(value) => handleRemoveCity(index, value)}
                      />
                      {loadingCities && <IconSpinner className="size-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={handleAddCountry}
              className="w-full bg-secondary hover:bg-secondary/90 border-border text-foreground"
            >
              <Plus className="size-4 mr-2" />
              Add Location
            </Button>

            <Card className="bg-secondary border-border">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <Label className="block mb-3">Age Range</Label>
                  <RangeSlider
                    min={18}
                    max={65}
                    step={1}
                    priceCap={2}
                    onChange={handleChangeAge}
                  />
                </div>

                <div>
                  <Label className="block mb-3">Gender</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="male"
                        checked={isMale}
                        onCheckedChange={() => setIsMale(!isMale)}
                        className="border-border data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor="male"
                        className="text-sm text-foreground"
                      >
                        Male
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="female"
                        checked={isFemale}
                        onCheckedChange={() => setIsFemale(!isFemale)}
                        className="border-border data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor="female"
                        className="text-sm text-foreground"
                      >
                        Female
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSaveTargeting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
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
                onChange={handleImageFileChange}
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
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={handleSaveCreative} 
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
            <PlacementTargeting toolCallId={'toolCallId-placement'} />
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
