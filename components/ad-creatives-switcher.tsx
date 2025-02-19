'use client'

import React, { useState, useEffect, useContext } from 'react';
import { useActions, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/AIManager'
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './stocks/video-player'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CampaignContext } from '@/components/contexts/campaign-context'


import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";


interface Creative {
  id: number;
  name: string;
  status: string;
  object_type: 'VIDEO' | 'IMAGE' | 'SHARE';
  thumbnail_url?: string;
  video_url?: string;
  body?: string;
  object_story_spec: {
    page_id: string;
    video_data?: {
      video_id: string;
      title: string;
      message: string;
      image_url: string;
      image_hash: string;
    }
    link_data?: {
      name: string;
      message: string;
      link: string;
      image_hash: string;
    }
  }
}

type AdsetWithCreatives = {
  adset_id:string;
  creatives:Creative[];
}

interface OpenSectionsState {
  [key: string]: boolean;
}

const AdCreativesSwitcher = () => {
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [creatives, setCreatives] = useState<AdsetWithCreatives[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  const [imagePermalinkUrl, setImagePermalinkUrl] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { campaign, adset :selectedAdset } = useContext(CampaignContext)

  const [openSections, setOpenSections] = React.useState<OpenSectionsState>(() => {
    if (!selectedAdset?.id) return {};
    return { [selectedAdset.id]: true };
  });

  const toggleSection = (adsetId: string): void => {
    setOpenSections((prev: OpenSectionsState) => ({
      ...prev,
      [adsetId]: !prev[adsetId]
    }));
  };
  
  const getImageDetail = (imageHash: string) => {
    fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${imageHash}`)
      .then(response => response.json())
      .then(imageDetail => {
        if(editingCreative){
          setImagePermalinkUrl(imageDetail?.permalink_url)
        }
      })
      .catch(error => {
        console.error('Error fetching video detail:', error)
      })
  }
  useEffect(() => {
    if (
      editingCreative &&
      editingCreative.object_story_spec?.link_data?.image_hash
    ) {
      getImageDetail(editingCreative.object_story_spec?.link_data?.image_hash)
    }
    if(!editingCreative){
      setImagePermalinkUrl('');
    }
  }, [editingCreative])

  useEffect(() => {
    const fetchCreatives = async () => {
      setIsLoading(true);
      try {
        let fetchedCampaignId;
        try {
            fetchedCampaignId = await getCampaignIdFromUrl();
            console.log("Fetched Campaign ID:", fetchedCampaignId);
          } catch (error) {
              console.error("Error fetching campaign ID:", error);
          }
        const response = await fetch('/api/fasty-bot/proxy-get-adcreatives?campaignId='+fetchedCampaignId);
        if (!response.ok) {
          throw new Error('Failed to fetch creatives');
        }
        const data = await response.json();

       const groupedData: Record<string, Creative[]> = data?.data?.data.reduce((acc: Record<string, Creative[]>, item: any) => {
          const { adset_id, creative } = item;
          if (!acc[adset_id]) {
            acc[adset_id] = [];
          }
          acc[adset_id].push({
            id: creative.id,
            name: creative.name,
            thumbnail_url: creative.thumbnail_url,
            object_type: creative.object_type,
            status: creative.status,
            object_story_spec: creative.object_story_spec,
          });
          return acc;
        }, {});
      
        // Convert grouped data to the desired array format
        const adsetWithCreatives: AdsetWithCreatives[] = Object.entries(groupedData).map(([adset_id, creatives]) => ({
          adset_id,
          creatives,
        }));

        console.log(adsetWithCreatives,"Adset group")


        console.log('adcreativesdata', data)
        let list = data?.data?.data || [];
        setCreatives(adsetWithCreatives);
      } catch (err) {
        setError('Error fetching creatives. Please try again later.');
        console.error('Error fetching creatives:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatives();
  }, []);

  const togglePublish = async (id: number) => {
    try {
      const creative = creatives
      .flatMap(adset => adset.creatives) // Flatten all creatives from all adsets
      .find(creative => creative.id === id);
      console.log("Creative toggle publish", creative)
      const response = await fetch('/api/fasty-bot/proxy-update-adcreative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          name: creative?.name,
          object_story_spec: {
            ...creative?.object_story_spec,
            link_data: {
              ...creative?.object_story_spec?.link_data,
              name:creative?.object_story_spec?.link_data?.name??creative?.name

              // image_url: creative?.thumbnail_url
            }
          },
          status: creative?.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update creative status');
      }

      const updatedCreative = await response.json();

      setCreatives(prevCreatives =>
        prevCreatives.map(adset => ({
          ...adset,
          creatives: adset.creatives.map(creative =>
            creative.id === id ? { ...creative, status: updatedCreative.status } : creative
          ),
        }))
      );
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const handleEdit = (creative: Creative) => {
    setEditingCreative(creative);
    setEditName(creative.name);
    setEditMessage((creative.object_type === 'VIDEO' ? creative.object_story_spec.video_data?.message : creative.object_story_spec.link_data?.message) || '');
  };

  const handleSubmitEdit = async () => {
    if (!editingCreative) return;
    setIsEditing(true);
    setEditError(null);

    try {
      const response = await fetch('/api/fasty-bot/proxy-update-adcreative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCreative.id,
          name: editName,
          object_story_spec: {
            ...editingCreative.object_story_spec,
            video_data: editingCreative.object_story_spec.video_data 
              ? { ...editingCreative.object_story_spec.video_data, message: editMessage }
              : undefined,
            link_data: editingCreative.object_story_spec.link_data
              ? { ...editingCreative.object_story_spec.link_data, 
                message: editMessage, 
                image_url:imagePermalinkUrl,
                name:editName
              }
              : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update creative');
      }

      const updatedCreative = await response.json();

      setCreatives(prevCreatives =>
        prevCreatives.map(adset => ({
          ...adset,
          creatives: adset.creatives.map(creative =>
            creative.id === editingCreative.id ? { ...creative, status: updatedCreative.status } : creative
          ),
        }))
      );

      setEditingCreative(null);
    } catch (error) {
      console.error('Error updating creative:', error);
      setEditError('Failed to update creative. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const addNewCreative = async () => {
    const responseMessage = await submitUserMessage(
      'I want to create new ad creative',
      [],
      true
    )
    setMessages(currentMessages => [...currentMessages, responseMessage])
  }

  if (isLoading) {
    return <div className="dark:text-zinc-200">Loading creatives...</div>;
  }

  if (error) {
    return <div className="dark:text-zinc-200">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800 shadow-lg">
      <header className="flex items-center justify-between px-6 py-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">Ad Creative Selector</h1>
        </div>
        <Button onClick={addNewCreative} className="px-4">
          Create New
        </Button>
      </header>

      <main className="flex-grow p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        <div className="space-y-4 max-w-7xl mx-auto">
          {creatives.map(adset => (
            <Collapsible.Root 
            key={adset.adset_id} 
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm"
            open={openSections[adset.adset_id]}
            onOpenChange={() => toggleSection(adset.adset_id)}

            >
              <Collapsible.Trigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-t-lg transition-colors">
                  <div className="flex items-center gap-3">
                  <ChevronDown 
                      className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${
                        openSections[adset.adset_id] 
                          ? 'rotate-0' 
                          : '-rotate-90'
                      }`} 
                    />
                    <div>
                      <h4 className="font-semibold text-lg text-zinc-800 dark:text-zinc-200">
                        Adset ID: {adset.adset_id}
                      </h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {adset.creatives.length} Creatives
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                      {adset.creatives.filter(c => c.status === 'ACTIVE').length} Active
                    </span>
                  </div>
                </div>
              </Collapsible.Trigger>

              <Collapsible.Content>
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-700">
                  <div className="grid md:grid-cols-2 gap-4">
                    {adset.creatives.map(creative => (
                      <div
                        key={creative.id}
                        className="group bg-zinc-50 dark:bg-zinc-700 rounded-lg overflow-hidden transition-all hover:shadow-md"
                      >
                        <div className="relative">
                          {creative.object_type === 'IMAGE' && creative.thumbnail_url ? (
                            <img
                              src={creative.thumbnail_url}
                              alt={creative.name}
                              className="object-cover w-full h-[200px]"
                            />
                          ) : creative.object_type === 'VIDEO' ? (
                            <VideoPlayer
                              className="object-cover"
                              height="h-[200px]"
                              videoId={creative.object_story_spec?.video_data?.video_id}
                            />
                          ) : (
                            <img
                              src={creative.thumbnail_url}
                              alt={creative.name}
                              className="object-cover w-full h-[200px]"
                            />
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => togglePublish(creative.id)}
                                variant={creative.status === 'ACTIVE' ? 'destructive' : 'default'}
                                size="sm"
                                className="shadow-lg"
                              >
                                {creative.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleEdit(creative)}
                                className="shadow-lg"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h5 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">{creative.name}</h5>
                          <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3">
                            {creative.object_type === 'VIDEO' && creative.object_story_spec?.video_data?.message}
                            {creative.object_type === 'SHARE' && creative.object_story_spec?.link_data?.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          ))}
        </div>
      </main>

      <Dialog 
        open={!!editingCreative} 
        onOpenChange={() => {
          setEditingCreative(null);
          setEditError(null); 
        }}
      >
        <DialogContent className="max-h-[80%] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ad Creative</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingCreative?.object_type === 'VIDEO' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right font-medium">
                  Video
                </label>
                <div className="col-span-3">
                  <VideoPlayer
                    className="rounded-lg overflow-hidden"
                    height="h-[200px]"
                    videoId={editingCreative?.object_story_spec?.video_data?.video_id}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right font-medium">
                  Image
                </label>
                <div className="col-span-3">
                  <img
                    src={imagePermalinkUrl || editingCreative?.thumbnail_url}
                    alt=""
                    className="rounded-lg object-cover h-[200px] w-full"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right font-medium">
                Name
              </label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="message" className="text-right font-medium">
                Message
              </label>
              <Textarea
                id="message"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="col-span-3"
                rows={8}
              />
            </div>
            {editError && (
              <p className="col-start-2 col-span-3 text-red-500 text-sm">{editError}</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitEdit} disabled={isEditing}>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <span>Saving...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdCreativesSwitcher;
