"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Search, 
  Upload,
  MapPin 
} from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { IconSpinner } from '@/components/ui/icons';
import { toast } from 'sonner';
import { nanoid } from '@/lib/utils';
import { saveChat } from '@/app/actions';
import { Message, Chat } from '@/lib/types';

interface CampaignChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignChoiceModal({ isOpen, onClose }: CampaignChoiceModalProps) {
  const [step, setStep] = useState<'choice' | 'new-campaign'>("choice");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Form states for new campaign
  const [objective, setObjective] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<File | null>(null);

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

      // 2. Create campaign and adset via /api/fasty-bot/proxy-create-base
      const createBaseResponse = await fetch('/api/fasty-bot/proxy-create-base', {
        method: 'POST',
        body: JSON.stringify({
          campaign_name: campaignName
        })
      });
      const createBaseData = await createBaseResponse.json();

      if (!createBaseData.ok || !createBaseData.campaign?.id || !createBaseData.adset?.id) {
        throw new Error('Failed to create campaign and adset');
      }

      const fbCampaignId = createBaseData.campaign.id;
      const fbAdsetId = createBaseData.adset.id;

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
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const uploadedImageUrls = uploadData.urls || [];
      const imageUrl = uploadedImageUrls[0] || '';

      // 4. Insert system message that instructs AI to fully configure the campaign preview
      // We create a system message and a user message. The system message gives the AI full instructions;
      // The user message is a simple "please do as system instructed" message to trigger the assistant.
      
      const now = new Date().toISOString();
      const systemContent = `
You are Reeply AI, the user's assistant in configuring a Facebook campaign. The user has provided:
- Objective: ${objective}
- Location: ${location}
- An uploaded image: ${imageUrl}

You have already created a campaign and an adset (IDs are connected to the chat).
Now, autonomously configure the entire campaign preview as follows:
1. Set a daily budget (e.g., €30/day) using showAdBudgetUI. Confirm when done.
2. Configure geographical targeting and age range with showGeographicalLocationUI. Use ${location} as the primary location and choose a suitable age range (e.g., 25-45).
3. Set relevant interest filters with showSuggestedFilters (e.g. if objective is lead gen, pick interests relevant to the user's business).
4. Configure placements with showPlacementTargetingUI, including Instagram Stories, Reels, Facebook Feeds, Stories, and Instagram Explore.
5. Use the uploaded image and showSuggestionAdText to generate a headline and body text. Add them to the ad preview.
6. Set up a lead form with showFormBuilder (use a placeholder privacy policy URL like https://www.example.com/privacy).
7. After all steps are done, the campaign preview should show everything set. The user should only need to click 'Launch Campaign' if they approve.

Do not ask the user any more questions. Proceed step-by-step, calling the tools in the correct order to configure everything autonomously.
      `;

      const systemMessage: Message = {
        id: nanoid(),
        role: 'system',
        content: systemContent,
        timestamp: now
      };

      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content: "I've provided my objective, location, and image. Please follow the system instructions and fully configure the campaign preview now.",
        timestamp: now
      };

      // 5. Save the chat with fbCampaignId and fbAdsetId
      const chat: Chat = {
        id: chatId,
        title: campaignName.substring(0, 100),
        userId: '', // handled by server
        createdAt: new Date(),
        messages: [systemMessage, userMessage],
        path: `/chat/${chatId}`,
        fbCampaignId,
        fbAdsetId
      };

      await saveChat(chat);

      // 6. Redirect to new chat
      router.push(`/chat/${chatId}`);
      onClose();
      
      toast.success('Campaign created successfully! The AI will now configure the preview.');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


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
      </DialogContent>
    </Dialog>
  );
}
