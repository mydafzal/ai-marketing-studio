'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Creative {
  id: number;
  name: string;
  status: string;
  image_url?: string;
  video_url?: string;
  body?: string;
}

const AdCreativesSwitcher = () => {
  const [creatives, setCreatives] = useState<Creative[]>([
    {
      id: 1,
      name: "Summer Sale",
      status: "ACTIVE",
      image_url: "https://placehold.co/600x400",
      body: "Up to 50% off on all items!"
    },
    {
      id: 2,
      name: "New Product Launch",
      status: "PAUSED",
      video_url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      body: "Check out our latest product."
    }
  ]);
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
        setCreatives(data);
      } catch (err) {
        setError('Error fetching creatives. Please try again later.');
        console.error('Error fetching creatives:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // fetchCreatives();
  }, []);

  const togglePublish = async (id: number) => {
    try {
      const response = await fetch('/api/fasty-bot/proxy-update-adcreative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action: 'toggle_publish' }),
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
    return <div>Loading creatives...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white shadow-lg">
      <header className="flex justify-between px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800">Ad Creative Selector</h1>
        <Button>Create New</Button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="grid md:grid-cols-2 gap-4">
          {creatives.map(creative => (
            <div key={creative.id} className="bg-gray-50 p-4 rounded-md shadow-md">
              <div className="flex justify-between">
                <h5 className="font-semibold whitespace-nowrap self-end">{creative.name}</h5>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => togglePublish(creative.id)}
                    variant={creative.status === 'ACTIVE' ? 'destructive' : 'default'}
                    size="sm"
                  >
                    {creative.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm">Edit</Button>
                </div>
              </div>
              <div className="mt-4">
                {creative.image_url ? (
                  <img src={creative.image_url} alt={creative.name} className="object-cover rounded-md h-[200px] w-full" />
                ) : creative.video_url ? (
                  <video src={creative.video_url} className="object-cover rounded-md h-[200px] w-full" controls />
                ) : (
                  <div 
                    className="bg-gray-300 rounded-md h-[200px] w-full"
                    aria-label="Media placeholder"
                  ></div>
                )}
                <p className="mt-2 text-gray-600">{creative.body}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdCreativesSwitcher;
