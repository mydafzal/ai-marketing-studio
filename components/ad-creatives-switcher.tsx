'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getVideoDetail } from '@/lib/api/fasty-bot/get-video-detail';

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

const AdCreativesSwitcher = () => {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatives = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/fasty-bot/proxy-get-adcreatives');
        if (!response.ok) {
          throw new Error('Failed to fetch creatives');
        }
        const data = await response.json();
        console.log('adcreativesdata', data)
        let list = data?.data?.data || [];
        list = await Promise.all(list.map((creative: Creative) => {
          return new Promise<Creative>((resolve) => {
            if (creative.object_type === 'VIDEO' && creative.object_story_spec?.video_data?.video_id) {
              fetch(`/api/fasty-bot/proxy-get-video-detail?video_id=${creative.object_story_spec.video_data.video_id}`)
                .then(response => response.json())
                .then(videoDetail => {
                  console.log('videoDetail', videoDetail);
                  if (videoDetail && videoDetail.source) {
                    resolve({ ...creative, video_url: videoDetail.source });
                  } else {
                    resolve(creative);
                  }
                })
                .catch(error => {
                  console.error('Error fetching video detail:', error);
                  resolve(creative);
                });
            } else {
              resolve(creative);
            }
          });
        }))
        setCreatives(list);
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
      const creative = creatives.find(creative => creative.id === id);
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
              image_url: creative?.thumbnail_url || 'https://www.facebook.com/ads/image/?d=AQKlXBT_7410ub7p5O0BZCMS3irwdH3qhNvsrvo4qS0HydMRyYFNNlCqAHPZblzhNXYINGgEj9Y27FDuQBIMfg4dbUsLfbt6q_K7lIvOO3loD6hm-LoEGbXxcn2GlqwrL_Px8T4iLcbVw1PtHUxXwcs6',
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
        <Button>Create New</Button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="grid md:grid-cols-2 gap-4">
          {creatives.map(creative => (
            <div key={creative.id} className="bg-zinc-50 dark:bg-zinc-700 p-4 rounded-md shadow-md overflow-hidden">
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => togglePublish(creative.id)}
                  variant={creative.status === 'ACTIVE' ? 'destructive' : 'default'}
                  size="sm"
                >
                  {creative.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm">Edit</Button>
              </div>
              <h5 className="font-semibold dark:text-zinc-200">{creative.name}</h5>
              <div className="mt-4">
                {creative.object_type === 'IMAGE' && creative.thumbnail_url ? (
                  <img src={creative.thumbnail_url} alt={creative.name} className="object-cover rounded-md h-[200px] w-full" />
                ) : creative.object_type === 'VIDEO' && creative.video_url ? (
                  <video src={creative.video_url} className="object-cover rounded-md h-[200px] w-full" controls />
                ) : (
                  <div
                    className="bg-zinc-300 dark:bg-zinc-600 rounded-md h-[200px] w-full"
                    aria-label="Media placeholder"
                  ></div>
                )}
                <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                  {creative.object_type === 'VIDEO' && creative.object_story_spec?.video_data?.message}
                  {creative.object_type === 'SHARE' && creative.object_story_spec?.link_data?.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdCreativesSwitcher;
