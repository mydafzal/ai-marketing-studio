'use client'

import React, { useState, useEffect } from 'react';
import { useActions, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button';
import { VideoPlayer } from './stocks/video-player'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { sleep, cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Check, X, AlertCircle, Instagram, Facebook } from 'lucide-react'
import Image from 'next/image'

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

interface SocialPreviewProps {
  platform: 'instagram' | 'facebook'
  image: string
  headline: string
  text: string
}

const SocialPreview = ({
  platform,
  image,
  headline,
  text,
}: SocialPreviewProps) => {
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
          className="object-cover size-full"
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

function CreativeItem({
  creative,
  togglePublish,
  submitEdit
}: {
  creative: Creative,
  togglePublish: (id: number) => Promise<void>,
  submitEdit: (id: number, name: string, message: string, imageUrl?: string) => Promise<boolean>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editName, setEditName] = useState(creative.name)
  const [editMessage, setEditMessage] = useState(
    creative.object_type === 'VIDEO'
      ? creative.object_story_spec.video_data?.message || ''
      : creative.object_story_spec.link_data?.message || ''
  )
  const [editError, setEditError] = useState<string | null>(null)
  const [imagePermalinkUrl, setImagePermalinkUrl] = useState<string>('')

  const imageHash = creative.object_type === 'VIDEO'
    ? creative.object_story_spec.video_data?.image_hash
    : creative.object_story_spec.link_data?.image_hash

  const imageUrl = imagePermalinkUrl || creative.thumbnail_url || '/placeholder-image.png'

  const handleEdit = () => {
    setIsEditing(true)
    setEditError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditName(creative.name)
    setEditMessage(
      creative.object_type === 'VIDEO'
        ? creative.object_story_spec.video_data?.message || ''
        : creative.object_story_spec.link_data?.message || ''
    )
    setEditError(null)
  }

  const handleSave = async () => {
    setIsUpdating(true)
    setEditError(null)
    await sleep(1000)

    const success = await submitEdit(creative.id, editName, editMessage, imagePermalinkUrl)
    setIsUpdating(false)
    if (success) {
      toast.success('Ad text updated successfully!')
      setIsEditing(false)
    } else {
      setEditError('Failed to update creative. Please try again.')
    }
  }

  const handlePublishToggle = async () => {
    setIsUpdating(true)
    await togglePublish(creative.id)
    setIsUpdating(false)
  }

  const fetchImageDetail = async (hash: string) => {
    try {
      const response = await fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${hash}`)
      const imageDetail = await response.json()
      setImagePermalinkUrl(imageDetail?.permalink_url || '')
    } catch (error) {
      console.error('Error fetching image detail:', error)
    }
  }

  useEffect(() => {
    if (imageHash) {
      fetchImageDetail(imageHash)
    } else {
      setImagePermalinkUrl('')
    }
  }, [imageHash])

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardContent className="p-6">
        {creative.status === 'ACTIVE' && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-blue-900/20 text-blue-200 rounded-lg border border-blue-800">
            <AlertCircle className="size-5 shrink-0" />
            <span className="text-sm">
              This ad is currently active.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SocialPreview
            platform="instagram"
            image={imageUrl}
            headline={isEditing ? editName : creative.name}
            text={isEditing ? editMessage : (creative.object_type === 'VIDEO'
              ? creative.object_story_spec.video_data?.message || ''
              : creative.object_story_spec.link_data?.message || '')}
          />
          <SocialPreview
            platform="facebook"
            image={imageUrl}
            headline={isEditing ? editName : creative.name}
            text={isEditing ? editMessage : (creative.object_type === 'VIDEO'
              ? creative.object_story_spec.video_data?.message || ''
              : creative.object_story_spec.link_data?.message || '')}
          />
        </div>

        {isEditing && (
          <div className="mt-6 space-y-4">
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
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
              value={editMessage}
              onChange={e => setEditMessage(e.target.value)}
              placeholder="Enter ad text"
            />
            {editError && <p className="text-red-500 text-sm">{editError}</p>}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
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
                  <div className="flex items-center gap-2">
                    <span>Saving...</span>
                    <div className="animate-spin rounded-full size-4 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <>
                    <Check className="size-4" />
                    Save your Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
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
                onClick={handlePublishToggle}
                disabled={isUpdating}
                className={cn(
                  "flex items-center gap-2 px-4 h-10",
                  "text-white text-sm font-medium rounded-lg",
                  creative.status === 'ACTIVE' ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
                  "transition-colors duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <span>Updating...</span>
                    <div className="animate-spin rounded-full size-4 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <>
                    <Check className="size-4" />
                    {creative.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const AdCreativesSwitcher = () => {
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [creatives, setCreatives] = useState<AdsetWithCreatives[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addNewCreative = async () => {
    const responseMessage = await submitUserMessage(
      'I want to create new ad creative',
      [],
      true
    )
    setMessages(currentMessages => [...currentMessages, responseMessage])
  }

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

  useEffect(() => {
    fetchCreatives();
  }, []);

  const togglePublish = async (id: number) => {
    const creative = creatives
      .flatMap(adset => adset.creatives)
      .find(creative => creative.id === id);

    if (!creative) return;

    try {
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
            // Removing image_url since it's not part of type
            link_data: creative?.object_story_spec?.link_data
              ? {
                  ...creative?.object_story_spec?.link_data,
                  name: creative?.object_story_spec?.link_data?.name ?? creative?.name
                }
              : undefined
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

      toast.success('Creative status updated successfully!')
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update creative status.')
    }
  };

  const submitEdit = async (id: number, name: string, message: string, imageUrl?: string): Promise<boolean> => {
    const creative = creatives
      .flatMap(adset => adset.creatives)
      .find(c => c.id === id);

    if (!creative) return false;

    let updatedObjectSpec = { ...creative.object_story_spec };

    if (creative.object_type === 'VIDEO' && updatedObjectSpec.video_data) {
      updatedObjectSpec.video_data = {
        ...updatedObjectSpec.video_data,
        message,
        title: name
        // no image_url because it's not in the type
      }
    } else if (creative.object_type !== 'VIDEO' && updatedObjectSpec.link_data) {
      updatedObjectSpec.link_data = {
        ...updatedObjectSpec.link_data,
        message,
        name
        // no image_url because it's not in the type
      }
    }

    try {
      const response = await fetch('/api/fasty-bot/proxy-update-adcreative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          name,
          object_story_spec: updatedObjectSpec,
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
            c.id === id ? { ...c, name, status: updatedCreative.status, object_story_spec: updatedObjectSpec } : c
          ),
        }))
      );

      return true;
    } catch (error) {
      console.error('Error updating creative:', error);
      return false;
    }
  };

  if (isLoading) {
    return <div className="dark:text-zinc-200">Loading creatives...</div>;
  }

  if (error) {
    return <div className="dark:text-zinc-200">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800 shadow-lg">
      <header className="flex justify-between px-4 py-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">Ad Creative Selector</h1>
        <Button onClick={addNewCreative}>Create New</Button>
      </header>

      <main className="grow p-4 overflow-y-auto">
        <div className="space-y-8">
          {creatives.map(adset => (
            <div key={adset.adset_id}>
              <h4 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-2">
                Adset ID: {adset.adset_id}
              </h4>
              <div className="grid gap-6">
                {adset.creatives.map(creative => (
                  <CreativeItem
                    key={creative.id}
                    creative={creative}
                    togglePublish={togglePublish}
                    submitEdit={submitEdit}
                  />
                ))}
              </div>
              <hr className='mt-8' />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdCreativesSwitcher;
