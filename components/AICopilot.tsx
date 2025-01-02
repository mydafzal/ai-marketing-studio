'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { IconSpinner } from '@/components/ui/icons';

interface ScreenshotData {
  dataUrl: string;
  timestamp: number;
}

export function AICopilot() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const screenCaptureInterval = useRef<NodeJS.Timeout | null>(null);

  const captureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        },
        audio: false
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          video.play();
          resolve(true);
        };
      });

      return {
        canvas,
        context,
        video,
        stream
      };
    } catch (error) {
      console.error('Error capturing screen:', error);
      toast.error('Failed to start screen capture');
      return null;
    }
  };

  const startScreenShare = async () => {
    const capture = await captureScreen();
    if (!capture) return;

    const { canvas, context, video, stream } = capture;

    screenCaptureInterval.current = setInterval(() => {
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const screenshot = canvas.toDataURL('image/jpeg', 0.5);
      setCurrentScreenshot(screenshot);
      
      // Send to OpenAI API
      sendScreenshotToAI(screenshot);
    }, 3000);

    setIsSharing(true);
    
    // Cleanup when stream ends
    stream.getVideoTracks()[0].onended = () => {
      stopScreenShare();
    };
  };

  const stopScreenShare = () => {
    if (screenCaptureInterval.current) {
      clearInterval(screenCaptureInterval.current);
      screenCaptureInterval.current = null;
    }
    setIsSharing(false);
    setCurrentScreenshot(null);
  };

  const sendScreenshotToAI = async (screenshot: string) => {
    try {
      const response = await fetch('/api/analyze-screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenshot,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send screenshot to AI');
      }

      const data = await response.json();
      // Handle AI response here
      console.log('AI Response:', data);
    } catch (error) {
      console.error('Error sending screenshot to AI:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (screenCaptureInterval.current) {
        clearInterval(screenCaptureInterval.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border border-zinc-200 dark:border-zinc-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-5" />
            AI Copilot Screen Share
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsConnected(!isConnected)}
              className={isConnected ? "bg-green-600" : "bg-blue-600"}
            >
              {isConnected ? (
                <>
                  <Wifi className="mr-2 size-4" />
                  Connected to AI
                </>
              ) : (
                <>
                  <WifiOff className="mr-2 size-4" />
                  Connect to AI
                </>
              )}
            </Button>

            <Button
              onClick={isSharing ? stopScreenShare : startScreenShare}
              disabled={!isConnected}
              className={isSharing ? "bg-red-600" : "bg-blue-600"}
            >
              {isSharing ? (
                <>
                  <EyeOff className="mr-2 size-4" />
                  Stop Sharing
                </>
              ) : (
                <>
                  <Eye className="mr-2 size-4" />
                  Share Screen
                </>
              )}
            </Button>
          </div>

          {currentScreenshot && (
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
              <img
                src={currentScreenshot}
                alt="Current screen share"
                className="w-full h-auto"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}