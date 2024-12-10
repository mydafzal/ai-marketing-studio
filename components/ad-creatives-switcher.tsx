'use client'

import React, { useState, useEffect, useContext } from 'react';
import { useActions, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './stocks/video-player'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import Image from 'next/image'
import { CampaignContext } from '@/components/contexts/campaign-context'

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

  const { campaign } = useContext(CampaignContext)

  const getImageDetail = (imageHash: string) => {
    fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${imageHash}`)
      .then(response => response.json())
      .then(imageDetail => {
        if (editingCreative) {
          setImagePermalinkUrl(imageDetail?.permalink_url)
        }
      })
      .catch(error => {
        console.error('Error fetching image detail:', error)
      })
  }

  useEffect(() => {
    if (
      editingCreative &&
      editingCreative.object_story_spec?.link_data?.image_hash
    ) {
      getImageDetail(editingCreative.object_story_spec?.link_data?.image_hash)
    }
    if (!editingCreative) {
      setImagePermalinkUrl('');
    }
  }, [editingCreative])

  useEffect(() => {
    const fetchCreatives = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/fasty-bot/proxy-get-adcreatives?campaignId=' + campaign?.id);
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
  }, [campaign?.id]);

  const togglePublish = async (id: number) => {
    try {
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
    )
    setMessages(currentMessages => [...currentMessages, responseMessage])
  }

  if (isLoading) {
    return <div className="text-zinc-200">Loading creatives...</div>;
  }

  if (error) {
    return <div className="text-zinc-200">{error}</div>;
  }

  return (
    <div className="space-y-6 py-4 bg-zinc-900 text-zinc-200 min-h-screen">
      <div className="flex justify-between px-4">
        <h1 className="text-2xl font-bold">Ad Creative Selector</h1>
        <Button onClick={addNewCreative} className="bg-blue-600 hover:bg-blue-700 text-white">Create New</Button>
      </div>

      <div className="space-y-6 px-4">
        {creatives.map(adset => (
          <Card key={adset.adset_id} className="border border-zinc-800 bg-zinc-900">
            <CardContent className="space-y-6 p-6">
              <h4 className="font-bold text-lg">
                Adset ID: {adset.adset_id}
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                {adset.creatives.map(creative => (
                  <Card key={creative.id} className="border border-zinc-800 bg-zinc-900 overflow-hidden">
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
                          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm"
                        >
                          Edit
                        </Button>
                      </div>
                      <h5 className="font-semibold">{creative.name}</h5>
                      <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
                        <div className="relative w-full h-64 flex items-center justify-center bg-black">
                          {creative.object_type === 'IMAGE' && creative.thumbnail_url ? (
                            <Image
                              src={creative.thumbnail_url}
                              alt={creative.name}
                              className="object-cover"
                              fill
                              sizes="(max-width: 768px) 100vw, 100vw"
                              priority={false}
                            />
                          ) : creative.object_type === 'VIDEO' ? (
                            <div className="w-full h-full">
                              <VideoPlayer
                                className="object-cover h-full w-full"
                                height="h-full"
                                videoId={creative.object_story_spec?.video_data?.video_id}
                              />
                            </div>
                          ) : (
                            <Image
                              src={creative.thumbnail_url || '/placeholder.png'}
                              alt={creative.name}
                              className="object-cover"
                              fill
                              sizes="(max-width: 768px) 100vw, 100vw"
                              priority={false}
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-300">
                        {creative.object_type === 'VIDEO' && creative.object_story_spec?.video_data?.message}
                        {creative.object_type === 'SHARE' && creative.object_story_spec?.link_data?.message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingCreative} onOpenChange={() => {
        setEditingCreative(null);
        setEditError(null);
      }}>
        <DialogContent className='max-h-[80%] overflow-y-auto bg-zinc-900 border border-zinc-800 text-zinc-200'>
          <DialogHeader>
            <DialogTitle className="text-zinc-200">Edit Ad Creative</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingCreative?.object_type === 'VIDEO' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right">Video</label>
                <div className="flex-none col-span-3 border border-zinc-700 rounded-lg overflow-hidden bg-black">
                  <VideoPlayer
                    className="object-cover"
                    height="h-[200px]"
                    videoId={
                      editingCreative?.object_story_spec?.video_data?.video_id
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right">Image</label>
                <div className="flex-none col-span-3 border border-zinc-700 rounded-lg overflow-hidden relative w-full h-[200px] bg-black">
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
                className="col-span-3 bg-zinc-800 border-zinc-700 text-zinc-200"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="message" className="text-right">Message</label>
              <Textarea
                id="message"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="col-span-3 bg-zinc-800 border-zinc-700 text-zinc-200"
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
