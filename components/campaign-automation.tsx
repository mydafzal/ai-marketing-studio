"use client"

import React, { useEffect, useContext, useState } from 'react';
import { CampaignContext } from '@/components/contexts/campaign-context';
import { useActions } from 'ai/rsc';
import { toast } from 'sonner';
import { setDailyCampaignBudget } from '@/lib/api/fasty-bot/set-daily-campaign-budget';
import { createCampaignAd } from '@/lib/api/fasty-bot/create-ad';
import { updateAdset } from '@/lib/api/fasty-bot/update-adset';
import { createLeadgenForm } from '@/lib/api/fasty-bot/create-leadgen-form';
import { Adset } from '@/lib/types';
import { generateAdTemplate } from '@/lib/data';

interface CampaignAutomationProps {
  initialObjective: string;
  initialLocation: string;
  uploadedImageUrl: string;
}

const CampaignAutomation: React.FC<CampaignAutomationProps> = ({ 
  initialObjective,
  initialLocation,
  uploadedImageUrl
}) => {
  const { campaign, adset, setAdset, getCampaignList } = useContext(CampaignContext);
  const [automationComplete, setAutomationComplete] = useState(false);
  const [budgetSet, setBudgetSet] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<'initializing' | 'budget' | 'targeting' | 'creative' | 'complete'>('initializing');

  // Helper function to dispatch events with delay
  const dispatchConfigUpdate = (detail: any) => {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('campaignConfigured', { detail }));
    }, 500);
  };

  // Set up automation steps for initial configuration
  useEffect(() => {
    const setBudgetAutomatically = async () => {
      console.log('Starting budget automation:', {
        campaignId: campaign?.id,
        budgetSet,
        campaignStatus: campaign?.status,
        automationStatus
      });

      if (!campaign?.id || budgetSet || campaign?.status !== 'ACTIVE') {
        console.log('Budget automation skipped:', {
          campaignId: campaign?.id,
          budgetSet,
          campaignStatus: campaign?.status
        });
        return;
      }

      setAutomationStatus('budget');

      try {
        // 1. Set budget to €30
        const updateSuccess = await setDailyCampaignBudget(campaign.id, 30);
        console.log('Budget update response:', updateSuccess);
        
        if (updateSuccess) {
          // 2. Update campaign list to reflect new budget
          await getCampaignList();
          
          // 3. Dispatch event to update preview
          dispatchConfigUpdate({ budget: 30 });
          
          setBudgetSet(true);
          toast.success('Budget automatically set to €30/day');
        } else {
          console.error('Budget update failed with falsy response');
          toast.error('Failed to set automatic budget');
        }
      } catch (error) {
        console.error('Detailed budget error:', error);
        toast.error('Failed to set automatic budget');
      }
    };

    // Add a small delay before starting automation
    const timer = setTimeout(() => {
      setBudgetAutomatically();
    }, 1000);

    return () => clearTimeout(timer);
  }, [campaign?.id, campaign?.status, budgetSet, getCampaignList]);

  // Handle targeting setup after budget is set
  useEffect(() => {
    const setTargetingAutomatically = async () => {
      console.log('Starting targeting automation:', {
        adsetId: adset?.id,
        budgetSet,
        automationComplete,
        automationStatus
      });

      if (!adset?.id || !budgetSet || automationComplete) {
        console.log('Targeting automation skipped:', {
          adsetId: adset?.id,
          budgetSet,
          automationComplete
        });
        return;
      }

      setAutomationStatus('targeting');

      try {
        // Set up targeting configuration
        const targetingUpdate = {
          age_min: 25,
          age_max: 45,
          geo_locations: {
            countries: [initialLocation.split(',')[1]?.trim() || 'US']
          },
          flexible_spec: [
            {
              interests: [
                { id: '6003139266461', name: 'Online advertising' },
                { id: '6003277229371', name: 'Digital marketing' }
              ]
            }
          ],
          facebook_positions: ['feed', 'story', 'facebook_reels'],
          instagram_positions: ['stream', 'story', 'explore', 'reels'],
          publisher_platforms: ['facebook', 'instagram']
        };

        console.log('Applying targeting update:', targetingUpdate);

        const updatedAdset = await updateAdset(adset.id, {
          targeting: targetingUpdate,
          daily_budget: 3000, // 30 EUR in cents
          bid_amount: 500
        });

        console.log('Adset update response:', updatedAdset);

        if (updatedAdset.success) {
          setAdset(updatedAdset.data);
          setAutomationStatus('creative');
          
          // Update preview panel with targeting info
          dispatchConfigUpdate({
            targeting: {
              locations: [initialLocation],
              ageRange: { min: 25, max: 45 },
              interests: ['Online advertising', 'Digital marketing']
            },
            placements: {
              facebook: ['Facebook Feed', 'Facebook Story', 'Facebook Reels'],
              instagram: ['Instagram Feed', 'Instagram Stories', 'Instagram Explore', 'Instagram Reels']
            }
          });

          // Automatically create ad with uploaded image
          const adTemplate = generateAdTemplate(
            `${initialObjective.split(' ').slice(0, 3).join(' ')}`,
            `Discover ${initialObjective}. Connect with us today to learn more about opportunities in ${initialLocation}.`,
            uploadedImageUrl
          );

          console.log('Creating ad with template:', adTemplate);

          const adResponse = await createCampaignAd(
            campaign!.id,
            adTemplate,
            updatedAdset.data
          );

          console.log('Ad creation response:', adResponse);

          if (adResponse) {
            // Update preview with creative
            dispatchConfigUpdate({
              images: [uploadedImageUrl],
              adText: `Discover ${initialObjective}. Connect with us today!`
            });

            // Automatically create lead form
            const leadFormPayload = {
              page_id: "119021011189054",
              name: `Lead Form ${Date.now()}`,
              questions: [
                { key: 'full_name', type: 'FULL_NAME' },
                { key: 'email', type: 'EMAIL' },
                { key: 'phone', type: 'PHONE' }
              ],
              privacy_policy: {
                url: "https://www.example.com/privacy",
                link_text: "Privacy Policy"
              },
              context_card: {
                title: initialObjective.split(' ').slice(0, 5).join(' '),
                style: "PARAGRAPH_STYLE",
                content: `We're excited about your interest in ${initialObjective}. Fill out this form to get started.`
              },
              thank_you_page: {
                title: "Thank You",
                button_type: 'NONE',
                body: "Thanks for your interest! We'll be in touch soon."
              },
              locale: 'en_US',
              status: "ACTIVE"
            };

            console.log('Creating lead form with payload:', leadFormPayload);

            const formResponse = await createLeadgenForm(leadFormPayload);
            console.log('Lead form creation response:', formResponse);
            
            if (formResponse) {
              setAutomationStatus('complete');
              toast.success('Campaign setup completed successfully!');
              setAutomationComplete(true);

              // Final preview update
              dispatchConfigUpdate({
                status: 'complete',
                leadForm: {
                  created: true,
                  fields: ['Full Name', 'Email', 'Phone']
                }
              });
            }
          }
        } else {
          console.error('Adset update failed:', updatedAdset);
          toast.error('Failed to update campaign targeting');
        }
      } catch (error) {
        console.error('Detailed targeting error:', {
          error,
          adsetId: adset?.id,
          campaignId: campaign?.id
        });
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to complete campaign setup');
        } else {
          toast.error('Failed to complete campaign setup');
        }
      }
    };

    setTargetingAutomatically();
  }, [adset?.id, budgetSet, automationComplete, campaign, initialLocation, initialObjective, uploadedImageUrl, setAdset]);

  // Optional: Add a cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup any subscriptions or timers if needed
      console.log('Campaign automation component unmounting');
    };
  }, []);

  // For debugging: Show current automation status
  console.log('Current automation status:', {
    automationStatus,
    budgetSet,
    automationComplete,
    campaignId: campaign?.id,
    adsetId: adset?.id
  });

  // Return null as this is a background automation component
  return null;
};

export default CampaignAutomation;