'use client'

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useActions, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/AIManager'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CampaignContext } from '@/components/contexts/campaign-context'
import { Settings2, PlusCircle, Edit2, EyeOff, Eye, ImageIcon, Film } from 'lucide-react';
import { getCampaignIdFromUrl } from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Enhanced VideoPlayer component that supports aspect ratio detection
const EnhancedVideoPlayer = ({ 
  videoId,
  className,
  autoPlay = true 
}: {
  videoId: string;
  className?: string;
  autoPlay?: boolean;
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16/9');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoId) {
      fetchVideoDetails(videoId);
    }
  }, [videoId]);

  const fetchVideoDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/fasty-bot/proxy-get-video-detail?video_id=${id}`);
      const data = await response.json();
      if (data?.source) {
        setVideoUrl(data.source);
        
        // Check video dimensions after it's loaded to determine aspect ratio
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              const videoWidth = videoRef.current.videoWidth;
              const videoHeight = videoRef.current.videoHeight;
              // Check if it's portrait (9:16) or landscape (16:9)
              if (videoHeight > videoWidth) {
                setAspectRatio('9/16');
              } else {
                setAspectRatio('16/9');
              }
            }
          };
        }
      }
    } catch (error) {
      console.error("Error fetching video:", error);
    }
  };

  return (
    <div className={cn(
      "relative overflow-hidden bg-black/5 rounded-lg",
      aspectRatio === '9/16' ? "aspect-[9/16] max-w-[300px] mx-auto" : "aspect-video w-full",
      className
    )}>
      {videoUrl ? (
        <video 
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-contain"
          autoPlay={autoPlay}
          muted
          loop
          playsInline
        />
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <Film className="h-8 w-8 text-zinc-400 animate-pulse" />
        </div>
      )}
    </div>
  );
};

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
  const { campaign, adset: selectedAdset } = useContext(CampaignContext)
  
  // Current creative index state
  const [currentCreativeIndex, setCurrentCreativeIndex] = useState<number>(0);
  // All creatives flattened
  const [flatCreatives, setFlatCreatives] = useState<Creative[]>([]);
  
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

        setCreatives(adsetWithCreatives);
        
        // Flatten all creatives for the carousel view
        const allCreatives = adsetWithCreatives.flatMap(adset => adset.creatives);
        setFlatCreatives(allCreatives);
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
      const creative = flatCreatives.find(creative => creative.id === id);
      
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

      // Update both state arrays
      setCreatives(prevCreatives =>
        prevCreatives.map(adset => ({
          ...adset,
          creatives: adset.creatives.map(creative =>
            creative.id === id ? { ...creative, status: updatedCreative.status } : creative
          ),
        }))
      );
      
      setFlatCreatives(prevCreatives => 
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

      // Update both state arrays
      setCreatives(prevCreatives =>
        prevCreatives.map(adset => ({
          ...adset,
          creatives: adset.creatives.map(creative =>
            creative.id === editingCreative.id ? { 
              ...creative, 
              name: editName,
              status: updatedCreative.status,
              object_story_spec: {
                ...creative.object_story_spec,
                video_data: creative.object_story_spec.video_data 
                  ? { ...creative.object_story_spec.video_data, message: editMessage }
                  : undefined,
                link_data: creative.object_story_spec.link_data
                  ? { ...creative.object_story_spec.link_data, message: editMessage }
                  : undefined,
              }
            } : creative
          ),
        }))
      );
      
      setFlatCreatives(prevCreatives => 
        prevCreatives.map(creative => 
          creative.id === editingCreative.id ? { 
            ...creative, 
            name: editName,
            status: updatedCreative.status,
            object_story_spec: {
              ...creative.object_story_spec,
              video_data: creative.object_story_spec.video_data 
                ? { ...creative.object_story_spec.video_data, message: editMessage }
                : undefined,
              link_data: creative.object_story_spec.link_data
                ? { ...creative.object_story_spec.link_data, message: editMessage }
                : undefined,
            }
          } : creative
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
    )
    setMessages(currentMessages => [...currentMessages, responseMessage])
  };
  
  // Navigation functions
  const nextCreative = () => {
    if (flatCreatives.length === 0) return;
    setCurrentCreativeIndex((prevIndex) => 
      prevIndex === flatCreatives.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevCreative = () => {
    if (flatCreatives.length === 0) return;
    setCurrentCreativeIndex((prevIndex) => 
      prevIndex === 0 ? flatCreatives.length - 1 : prevIndex - 1
    );
  };
  
  // Extract the clean creative name (removing IDs)
  const getCleanCreativeName = (name: string): string => {
    // Remove any ID-like patterns from the name
    return name.replace(/\s*\(?\d{5,}\)?/g, '').replace(/\s*ID:\s*\d+/gi, '').trim();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-zinc-600 dark:text-zinc-300 font-medium">Loading creatives...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200">Failed to Load Creatives</h3>
          <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Single creative carousel view
  const currentCreative = flatCreatives[currentCreativeIndex];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 shadow-lg rounded-xl overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
            <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Ad Creative Gallery</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {flatCreatives.length > 0 
                ? `${currentCreativeIndex + 1} of ${flatCreatives.length} creatives` 
                : "No creatives found"}
            </p>
          </div>
        </div>
        <Button 
          onClick={addNewCreative} 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </header>

      <main className="flex-grow p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        {flatCreatives.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
            <div className="mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200">No Creatives Found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">
              Create your first ad creative to get started with your campaign.
            </p>
            <Button 
              onClick={addNewCreative} 
              className="mt-4"
            >
              Create Your First Creative
            </Button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Navigation buttons */}
            <div className="flex justify-between mb-6">
              <Button 
                variant="outline" 
                onClick={prevCreative} 
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </Button>
              
              <div className="flex items-center gap-2">
                <Badge 
                  className={
                    currentCreative?.status === 'ACTIVE' 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  }
                >
                  {currentCreative?.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </Badge>
                <Button 
                  variant={currentCreative?.status === 'ACTIVE' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => togglePublish(currentCreative?.id)}
                  className={cn(
                    currentCreative?.status !== 'ACTIVE' && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {currentCreative?.status === 'ACTIVE' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      Activate
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(currentCreative)}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                onClick={nextCreative} 
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Button>
            </div>
            
            {/* Creative content */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700">
              <div className="relative">
                {currentCreative?.object_type === 'VIDEO' ? (
                  <EnhancedVideoPlayer 
                    videoId={currentCreative?.object_story_spec?.video_data?.video_id || ''}
                    autoPlay={true}
                  />
                ) : (
                  <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                    {currentCreative?.thumbnail_url ? (
                      <img
                        src={currentCreative?.thumbnail_url}
                        alt={getCleanCreativeName(currentCreative?.name || '')}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Type indicator */}
                <div className="absolute top-3 right-3">
                  <Badge 
                    variant="outline" 
                    className="bg-white/80 dark:bg-black/50 backdrop-blur-sm text-xs font-medium"
                  >
                    {currentCreative?.object_type === 'VIDEO' ? 'Video' : 'Image'}
                  </Badge>
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-2">
                  {getCleanCreativeName(currentCreative?.name || '')}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  {currentCreative?.object_type === 'VIDEO' && currentCreative?.object_story_spec?.video_data?.message}
                  {currentCreative?.object_type === 'SHARE' && currentCreative?.object_story_spec?.link_data?.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Dialog 
        open={!!editingCreative} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingCreative(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Ad Creative</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-5 gap-6 py-4">
            <div className="md:col-span-2 space-y-4">
              {editingCreative?.object_type === 'VIDEO' ? (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden">
                  <EnhancedVideoPlayer
                    videoId={editingCreative?.object_story_spec?.video_data?.video_id || ''}
                    autoPlay={true}
                  />
                </div>
              ) : (
                <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={imagePermalinkUrl || editingCreative?.thumbnail_url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              
              <div className="px-1">
                <Badge className="mb-2">
                  {editingCreative?.object_type} Ad
                </Badge>
                
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  <p className="mb-1">
                    <span className="font-medium">Status:</span> {editingCreative?.status}
                  </p>
                  <p>
                    <span className="font-medium">Creative ID:</span> {editingCreative?.id}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Creative Name
                </label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full"
                  placeholder="Enter creative name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ad Message
                </label>
                <Textarea
                  id="message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full min-h-[150px]"
                  placeholder="Enter your ad copy here..."
                />
              </div>
              
              {editError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
                  {editError}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingCreative(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isEditing} className="ml-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdCreativesSwitcher;