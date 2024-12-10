'use client'

import React, { useState, useEffect } from 'react';
import { useActions, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './stocks/video-player'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Pencil, Check, X } from 'lucide-react'

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

  const getImageDetail = (imageHash: string) => {
    fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${imageHash}`)
      .then(response => response.json())
      .then(imageDetail => {
        if(editingCreative){
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
    if(!editingCreative){
      setImagePermalinkUrl('');
    }
  }, [editingCreative])

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
      
        // Convert grouped data to the desired array format
        const adsetWithCreatives: AdsetWithCreatives[] = Object.entries(groupedData).map(([adset_id, creatives]) => ({
          adset_id,
          creatives,
        }));

        console.log(adsetWithCreatives,"Adset group")

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
      .flatMap(adset => adset.creatives)
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
    <div className="flex flex-col h-full bg-zinc-800">
      <header className="flex justify-between px-4 py-6 border-b border-zinc-700">
        <h1 className="text-2xl font-bold text-zinc-200">Ad Creative Selector</h1>
        <Button onClick={addNewCreative}>Create New</Button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto space-y-10">
        {creatives.map(adset => (
          <div key={adset.adset_id} className="space-y-6">
            <h4 className="font-bold text-lg text-zinc-300 mb-2">
              Adset ID: {adset.adset_id}
            </h4>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {adset.creatives.map(creative => (
                <Card key={creative.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-zinc-200">{creative.name}</h5>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => togglePublish(creative.id)}
                          variant={creative.status === 'ACTIVE' ? 'destructive' : 'default'}
                          size="sm"
                        >
                          {creative.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button size="sm" onClick={() => handleEdit(creative)}>
                          <Pencil size={14} /> Edit
                        </Button>
                      </div>
                    </div>
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      {creative.object_type === 'IMAGE' && creative.thumbnail_url ? (
                        <Image
                          src={creative.thumbnail_url}
                          alt={creative.name}
                          fill
                          className="object-cover"
                        />
                      ) : creative.object_type === 'VIDEO' ? (
                        <VideoPlayer
                          className="object-cover"
                          height="h-full"
                          videoId={creative.object_story_spec?.video_data?.video_id}
                        />
                      ) : (
                        <Image
                          src={creative.thumbnail_url || ''}
                          alt={creative.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm whitespace-pre-wrap">
                      {creative.object_type === 'VIDEO' && creative.object_story_spec?.video_data?.message}
                      {creative.object_type === 'SHARE' && creative.object_story_spec?.link_data?.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </main>

      <Dialog open={!!editingCreative} onOpenChange={() => {
        setEditingCreative(null);
        setEditError(null); 
      }}>
        <DialogContent className='max-h-[80%] overflow-y-auto bg-zinc-900 text-zinc-200 border border-zinc-700'>
          <DialogHeader>
            <DialogTitle>Edit Ad Creative</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingCreative?.object_type === 'VIDEO' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right text-zinc-300">
                  Video
                </label>
                <div className="flex-none col-span-3">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <VideoPlayer
                      className="object-cover rounded-md"
                      height="h-[200px]"
                      videoId={
                        editingCreative?.object_story_spec?.video_data?.video_id
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="message" className="text-right text-zinc-300">
                  Image
                </label>
                <div className="flex-none col-span-3">
                  <div className="relative w-full h-[200px] bg-black rounded-lg overflow-hidden">
                    <Image
                      src={imagePermalinkUrl || editingCreative?.thumbnail_url || ''}
                      alt=""
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-zinc-300">
                Name
              </label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="message" className="text-right text-zinc-300">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-1"></div>
              {editError && (
                <p className="col-span-3 text-red-500 text-sm">{editError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitEdit} disabled={isEditing}>
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
