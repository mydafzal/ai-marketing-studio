"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Search, 
  Upload,
  MapPin 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { IconSpinner } from '@/components/ui/icons';
import { toast } from 'sonner';
import { nanoid } from '@/lib/utils';
import { saveChat } from '@/app/actions';
import { Message, Chat } from '@/lib/types';
import CampaignAutomation from '@/components/campaign-automation';

interface CampaignChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignChoiceModal({ isOpen, onClose }: CampaignChoiceModalProps) {
  const [step, setStep] = useState<'choice' | 'new-campaign'>("choice");
  const [isLoading, setIsLoading] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const router = useRouter();
  
  // Form states for new campaign
  const [objective, setObjective] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [automationConfig, setAutomationConfig] = useState<{
    objective: string;
    location: string;
    imageUrl: string;
  } | null>(null);

  const handleExistingCampaign = () => {
    router.push('/');
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Image size should be less than 4MB');
        return;
      }
      setImage(file);
    }
  };

  const handleNewCampaignSubmit = async () => {
    if (!objective || !location || !image) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create new chat id
      const chatId = nanoid();
      const campaignName = `${objective.split(' ').slice(0, 3).join(' ')} - ${location}`;

      console.log('Starting campaign creation:', {
        chatId,
        campaignName,
        objective,
        location
      });

      // 2. Create campaign and adset via /api/fasty-bot/proxy-create-base
      const createBaseResponse = await fetch('/api/fasty-bot/proxy-create-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaign_name: campaignName
        })
      });
      const createBaseData = await createBaseResponse.json();
      
      if (!createBaseData.success || !createBaseData.data?.campaign?.id || !createBaseData.data?.adset?.id) {
        console.error('Base creation failed:', createBaseData);
        throw new Error('Failed to create campaign and adset');
      }

      const fbCampaignId = createBaseData.data.campaign.id;
      const fbAdsetId = createBaseData.data.adset.id;

      console.log('Campaign and adset created:', {
        fbCampaignId,
        fbAdsetId
      });

      // 3. Upload the image to the created campaign
      const formData = new FormData();
      formData.append('id', fbCampaignId);
      formData.append('type', 'image');
      formData.append('files', image);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        console.error('Image upload failed:', uploadResponse);
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const uploadedImageUrls = uploadData.urls || [];
      const imageUrl = uploadedImageUrls[0] || '';

      console.log('Image uploaded successfully:', imageUrl);

      // 4. Save the chat with fbCampaignId and fbAdsetId
      const chat: Chat = {
        id: chatId,
        title: campaignName.substring(0, 100),
        userId: '', // handled by server
        createdAt: new Date(),
        messages: [], // No system messages needed for automation
        path: `/chat/${chatId}`,
        fbCampaignId,
        fbAdsetId
      };

      await saveChat(chat);
      console.log('Chat saved successfully:', chat);

      // 5. Set up automation config
      setAutomationConfig({
        objective,
        location,
        imageUrl
      });
      setShowAutomation(true);

      // 6. Wait for automation to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 7. Redirect to new chat
      router.push(`/chat/${chatId}`);
      toast.success('Campaign created! AI will now configure it automatically.');
      
      // 8. Close modal after successful creation
      onClose();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign. Please try again.');
      setShowAutomation(false);
      setAutomationConfig(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      setShowAutomation(false);
      setAutomationConfig(null);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {step === 'choice' ? 'What would you like to do?' : 'Create New Campaign'}
          </DialogTitle>
        </DialogHeader>

        {step === 'choice' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Button
              onClick={() => setStep('new-campaign')}
              className="h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <PlusCircle className="size-8 text-blue-500" />
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">Create New Campaign</span>
            </Button>

            <Button
              onClick={handleExistingCampaign}
              className="h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <Search className="size-8 text-purple-500" />
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">Analyze Existing Campaign</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-900 dark:text-zinc-100">Campaign Objective</Label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="What do you want to achieve with this campaign? (e.g., generate leads, recruit employees)"
                className="min-h-[100px] bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-900 dark:text-zinc-100">Target Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 size-4 text-zinc-500" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter target location (e.g., Berlin, Germany)"
                  className="pl-10 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-900 dark:text-zinc-100">Campaign Image</Label>
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
                <Button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="w-full h-24 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="size-6 text-zinc-500" />
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {image ? image.name : 'Click to upload image'}
                    </span>
                  </div>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Maximum file size: 4MB. Recommended size: 1080x1080px
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('choice')}
                className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              >
                Back
              </Button>
              <Button
                onClick={handleNewCampaignSubmit}
                disabled={!objective || !location || !image || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <IconSpinner className="size-4 mr-2 animate-spin" />
                ) : null}
                Create Campaign
              </Button>
            </div>
          </div>
        )}

        {showAutomation && automationConfig && (
          <CampaignAutomation 
            initialObjective={automationConfig.objective}
            initialLocation={automationConfig.location}
            uploadedImageUrl={automationConfig.imageUrl}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}