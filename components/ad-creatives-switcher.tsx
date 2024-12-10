'use client';

import React, { useState, useEffect } from 'react';
import { useActions, useUIState } from 'ai/rsc';
import { type AI } from '@/lib/chat/actions';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './stocks/video-player';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
  adset_id: string;
  creatives: Creative[];
};

const SocialPreview = ({
  platform,
  image,
  headline,
  message,
  videoId,
  objectType
}: {
  platform: 'instagram' | 'facebook'
  image: string
  headline: string
  message: string
  videoId?: string
  objectType?: string
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
        <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">
          {platform === 'instagram' ? 'Instagram' : 'Facebook'} Ad Preview
        </span>
      </div>
      
      <div className="relative aspect-square bg-zinc-100 dark:bg-black">
        {objectType === 'VIDEO' && videoId ? (
          <VideoPlayer
            className="object-cover w-full h-full"
            height="h-full"
            videoId={videoId}
          />
        ) : image ? (
          image.startsWith('data:') ? (
            <img src={image} alt="Ad preview" className="w-full h-full object-cover" />
          ) : (
            <Image
              src={image}
              alt="Ad preview"
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 448px"
            />
          )
        ) : null}
      </div>
      
      <div className="p-4">
        <h4 className="font-semibold mb-2 text-zinc-800 dark:text-zinc-200">{headline}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
        
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
  );
};

const AdCreativesSwitcher = () => {
  const { submitUserMessage } = useActions();
  const [_, setMessages] = useUIState<typeof AI>();
  const [creatives, setCreatives] = useState<AdsetWithCreatives[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  const [imagePermalinkUrl, setImagePermalinkUrl] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const getImageDetail = (imageHash: string) => {
    fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${imageHash}`)
      .then(response => response.json())
      .then(imageDetail => {
        if (editingCreative) {
          setImagePermalinkUrl(imageDetail?.permalink_url);
        }
      })
      .catch(error => {
        console.error('Error fetching image detail:', error);
      });
  };

  useEffect(() => {
    if (
      editingCreative &&
      editingCreative.object_story_spec?.link_data?.image_hash
    ) {
      getImageDetail(editingCreative.object_story_spec.link_data.image_hash);
    }
    if (!editingCreative) {
      setImagePermalinkUrl('');
    }
  }, [editingCreative]);

  useEffect(() => {
    const fetchCreatives = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/fasty-bot/proxy-get-adcreatives');
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
      
        const adsetWithCreatives: AdsetWithCreatives[] = Object.entries(groupedData).map(([adset_id, creatives]) => ({
          adset_id,
          creatives,
        }));

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
      // Find the creative in all adsets
      const creative = creatives
        .flatMap(adset => adset.creatives)
        .find(creative => creative.id === id);

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
              name: creative?.object_story_spec?.link_data?.name ?? creative?.name
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
          creatives: adset.creatives.map(c =>
            c.id === id ? { ...c, status: updatedCreative.status } : c
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
              ? {
                ...editingCreative.object_story_spec.link_data,
                message: editMessage,
                image_url: imagePermalinkUrl,
                name: editName
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
          creatives: adset.creatives.map(c =>
            c.id === editingCreative.id ? { ...c, status: updatedCreative.status } : c
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
    );
    setMessages(currentMessages => [...currentMessages, responseMessage]);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-zinc-900 dark:text-zinc-200">Loading creatives...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-zinc-900 dark:text-zinc-200">{error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-200">
      <header className="flex justify-between items-center px-6 py-6 border-b border-zinc-300 dark:border-zinc-800">
        <h1 className="text-2xl font-bold">Ad Creatives</h1>
        <Button onClick={addNewCreative} className="bg-blue-600 hover:bg-blue-700 text-white">Create New</Button>
      </header>

      <main className="flex-grow p-6 overflow-y-auto space-y-6">
        {creatives.map(adset => (
          <Card 
            key={adset.adset_id} 
            className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          >
            <CardContent className="p-6 space-y-6">
              <h4 className="font-bold text-lg">
                Adset ID: {adset.adset_id}
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                {adset.creatives.map((creative) => {
                  const message = creative.object_type === 'VIDEO'
                    ? creative.object_story_spec.video_data?.message || ''
                    : creative.object_story_spec.link_data?.message || '';
                  return (
                    <Card 
                      key={creative.id} 
                      className="border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-end gap-3">
                          <Button
                            onClick={() => togglePublish(creative.id)}
                            variant={creative.status === 'ACTIVE' ? 'destructive' : 'default'}
                            size="sm"
                            className="text-sm"
                          >
                            {creative.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEdit(creative)}
                            className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm"
                          >
                            Edit
                          </Button>
                        </div>
                        <h5 className="font-semibold">{creative.name}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <SocialPreview
                            platform="instagram"
                            image={creative.thumbnail_url || ''}
                            headline={creative.name}
                            message={message}
                            videoId={creative.object_story_spec.video_data?.video_id}
                            objectType={creative.object_type}
                          />
                          <SocialPreview
                            platform="facebook"
                            image={creative.thumbnail_url || ''}
                            headline={creative.name}
                            message={message}
                            videoId={creative.object_story_spec.video_data?.video_id}
                            objectType={creative.object_type}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      <Dialog 
        open={!!editingCreative} 
        onOpenChange={() => {
          setEditingCreative(null);
          setEditError(null);
        }}
      >
        <DialogContent className="max-h-[80%] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200">
          <DialogHeader>
            <DialogTitle>Edit Ad Creative</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingCreative?.object_type === 'VIDEO' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right">Video</label>
                <div className="col-span-3 border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-black">
                  <VideoPlayer
                    className="object-cover"
                    height="h-[200px]"
                    videoId={editingCreative?.object_story_spec?.video_data?.video_id}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right">Image</label>
                <div className="col-span-3 border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden relative w-full h-[200px] bg-gray-100 dark:bg-black">
                  <Image
                    src={imagePermalinkUrl || editingCreative?.thumbnail_url || '/placeholder.png'}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 100vw"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">Name</label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3 bg-white dark:bg-zinc-800 dark:border-zinc-700 border border-zinc-300 text-zinc-900 dark:text-zinc-200"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="message" className="text-right">Message</label>
              <Textarea
                id="message"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="col-span-3 bg-white dark:bg-zinc-800 dark:border-zinc-700 border border-zinc-300 text-zinc-900 dark:text-zinc-200"
                rows={8}
              />
            </div>
            {editError && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1"></div>
                <p className="col-span-3 text-red-500 text-sm">{editError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitEdit} disabled={isEditing} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isEditing ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </>
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
