'use client';

import React, { useState, useEffect } from 'react';
import { 
  IconRobotThinking, 
  IconWebscan, 
  IconColorPalette, 
  IconImageAnalysis, 
  IconTextAnalysis 
} from '@/components/ui/icons';

interface ThoughtBubble {
  id: number;
  text: string;
  icon: React.ReactNode;
  duration: number;
}

export default function WebsiteAnalysisLoader() {
  const [currentThoughts, setCurrentThoughts] = useState<ThoughtBubble[]>([]);
  const [thoughtCounter, setThoughtCounter] = useState(0);

  const thoughts: ThoughtBubble[] = [
    { 
      id: 1, 
      text: "Scanning website structure and content...", 
      icon: <IconWebscan className="size-5" />, 
      duration: 2500 
    },
    { 
      id: 2, 
      text: "Extracting brand colors and typography...", 
      icon: <IconColorPalette className="size-5" />, 
      duration: 2000 
    },
    { 
      id: 3, 
      text: "Analyzing images and visual elements...", 
      icon: <IconImageAnalysis className="size-5" />, 
      duration: 2000 
    },
    { 
      id: 4, 
      text: "Processing key messaging and value propositions...", 
      icon: <IconTextAnalysis className="size-5" />, 
      duration: 2000 
    },
    { 
      id: 5, 
      text: "Identifying target audience and brand positioning...", 
      icon: <IconRobotThinking className="size-5" />, 
      duration: 2000 
    },
    { 
      id: 6, 
      text: "Analyzing unique selling propositions and competitive advantages...", 
      icon: <IconTextAnalysis className="size-5" />, 
      duration: 2000 
    },
    { 
      id: 7, 
      text: "Extracting product/service features and benefits...", 
      icon: <IconWebscan className="size-5" />, 
      duration: 2000 
    },
    { 
      id: 8, 
      text: "Analyzing call-to-actions and conversion elements...", 
      icon: <IconRobotThinking className="size-5" />, 
      duration: 2000 
    },
    { 
      id: 9, 
      text: "Finalizing brand analysis report...", 
      icon: <IconTextAnalysis className="size-5" />, 
      duration: 2000 
    }
  ];

  useEffect(() => {
    // Show thoughts in sequence
    const addThought = () => {
      if (thoughtCounter < thoughts.length) {
        const newThought = thoughts[thoughtCounter];
        setCurrentThoughts(prev => [...prev, newThought]);
        setThoughtCounter(prev => prev + 1);
      }
    };

    // Add the first thought immediately
    if (thoughtCounter === 0) {
      addThought();
    }

    // Add a new thought after the previous one's duration
    const timer = setTimeout(() => {
      if (thoughtCounter < thoughts.length) {
        addThought();
      }
    }, thoughts[Math.max(0, thoughtCounter - 1)]?.duration || 2000);

    return () => clearTimeout(timer);
  }, [thoughtCounter, thoughts]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className="size-20 bg-primary-green/20 rounded-full flex items-center justify-center">
            <IconRobotThinking className="size-10 text-primary-green animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 size-4 bg-primary-green rounded-full animate-ping" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-center mb-6">Analyzing Your Website</h3>
      
      <div className="space-y-4">
        {currentThoughts.map((thought) => (
          <div 
            key={thought.id} 
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 animate-fadeIn flex items-start gap-3"
          >
            <div className="bg-primary-green/20 rounded-full p-2 text-primary-green">
              {thought.icon}
            </div>
            <div className="flex-1">
              <p className="text-white/90">{thought.text}</p>
              <div className="mt-2 relative h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-primary-green rounded-full animate-progress origin-left"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-progress {
          animation: progress 2s linear forwards;
        }
      `}</style>
    </div>
  );
}