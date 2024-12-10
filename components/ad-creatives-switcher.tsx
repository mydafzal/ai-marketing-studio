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
import { Pencil, Check, X, Instagram, Facebook } from 'lucide-react';
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
        <span className="font-medium text-sm">
          {platform === 'instagram' ? 'Instagram' : 'Facebook'} Ad Preview
        </span>
      </div>
      
      <div className="relative aspect-square">
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
        <h4 className="font-semibold mb-2">{headline}</h4>
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
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCreative, setEditingCreative] = useState<Creative | null>(null);
  const [imagePermalinkUrl, setImagePermalinkUrl] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const getImageDetail = (imageHash: string) => {
    fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${imageHash}`)
      .then(response => response.json())
      .then(imageDetail => {
        if(editingCreative){
          setImagePermalinkUrl(imageDetail?.permalink_url);
        }
      })
      .catch(error => {
        console.error('Error fetching image detail:', error);
      });
  };

  useEffect(() => {
    if (editingCreative?.object_story_spec?.link_data?.image_hash) {
      getImageDetail(editingCreative.object_story_spec.link_data.image_hash);
    }
    if(!editingCreative){
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
        let list = data?.data?.data || [];
        setCreatives(list.map((item: any) => ({
          id: item.creative.id,
          name: item.creative.name,
          thumbnail_url: item.creative.thumbnail_url,
          object_type: item.creative.object_type,
          status: item.creative.status,
          object_story_spec: item.creative.object_story_spec,
        })));
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
      const creative = creatives.find(c => c.id === id);
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
        prevCreatives.map(creative =>
          creative.id === id ? { ...creative, status: updatedCreative.status } : creative
        )
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
        prevCreatives.map(creative =>
          creative.id === editingCreative.id ? { ...creative, status: updatedCreative.status } : creative
        )
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

  const nextAd = () => setActiveIndex((activeIndex + 1) % creatives.length);
  const prevAd = () => setActiveIndex(activeIndex === 0 ? creatives.length - 1 : activeIndex - 1);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-zinc-200">Loading creatives...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-zinc-200">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <header className="flex justify-between items-center px-6 py-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-zinc-200">Ad Creatives</h1>
        <Button onClick={addNewCreative}>Create New</Button>
      </header>

      <main className="flex-grow p-6 overflow-y-auto">
        {creatives.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SocialPreview
                  platform="instagram"
                  image={creatives[activeIndex].thumbnail_url || ''}
                  headline={creatives[activeIndex].name}
                  message={creatives[activeIndex].object_type === 'VIDEO' 
                    ? creatives[activeIndex].object_story_spec.video_data?.message || ''
                    : creatives[activeIndex].object_story_spec.link_data?.message || ''}
                  videoId={creatives[activeIndex].object_story_spec.video_data?.video_id}
                  objectType={creatives[activeIndex].object_type}
                />
                <SocialPreview
                  platform="facebook"
                  image={creatives[activeIndex].thumbnail_url || ''}
                  headline={creatives[activeIndex].name}
                  message={creatives[activeIndex].object_type === 'VIDEO'
                    ? creatives[activeIndex].object_story_spec.video_data?.message || ''
                    : creatives[activeIndex].object_story_spec.link_data?.message || ''}
                  videoId={creatives[activeIndex].object_story_spec.video_data?.video_id}
                  objectType={creatives[activeIndex].object_type}
                />
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={prevAd}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  Previous
                </button>
                <div className="flex gap-3">
                  <Button
                    onClick={() => togglePublish(creatives[activeIndex].id)}
                    variant={creatives[activeIndex].status === 'ACTIVE' ? 'destructive' : 'default'}
                  >
                    {creatives[activeIndex].status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button onClick={() => handleEdit(creatives[activeIndex])}>Edit</Button>
                </div>
                <button
                  onClick={nextAd}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  Next
                </button>
              </div>
            </CardContent>
          </Card>
        )}
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
                <label htmlFor="message" className="text-right">Video</label>
                <div className="col-span-3">
                  <VideoPlayer
                    className="object-cover rounded-md"
                    height="h-[200px]"
                    videoId={editingCreative?.object_story_spec?.video_data?.video_id}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right">Image</label>
                <div className="col-span-3">
                  <img
                    src={imagePermalinkUrl || editingCreative?.thumbnail_url}
                    alt="Ad preview"
                    className="w-full h-[200px] object-cover rounded-lg"
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
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="message" className="text-right">Message</label>
              <Textarea
                id="message"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="col-span-3"
                rows={8}
              />
            </div>
            {editError && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-1" />
                <p className="col-span-3 text-red-500 text-sm">{editError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitEdit} disabled={isEditing}>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <span>Saving...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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