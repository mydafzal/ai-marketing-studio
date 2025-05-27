'use client';

import React, { useState, useEffect } from 'react';
import { 
  IconRobotThinking, 
  IconCreativeExport,
  IconLightbulb,
  IconImageAnalysis,
  IconColorPalette
} from '@/components/ui/icons';

// AI thought bubble interface
interface AIThought {
  id: number;
  stage: 'awareness' | 'consideration' | 'conversion';
  format: 'square' | 'vertical';
  text: string;
  type: 'thinking' | 'decision' | 'creation';
}

const formatText = (thought: AIThought) => {
  const formatText = thought.format === 'square' ? '1:1 square' : '9:16 vertical';
  const stageText = thought.stage.charAt(0).toUpperCase() + thought.stage.slice(1);
  return `[${stageText} - ${formatText}] ${thought.text}`;
};

export default function AdCreativeLoader() {
  const [currentStage, setCurrentStage] = useState<'awareness' | 'consideration' | 'conversion'>('awareness');
  const [currentFormat, setCurrentFormat] = useState<'square' | 'vertical'>('square');
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [displayedThoughts, setDisplayedThoughts] = useState<AIThought[]>([]);
  const [progress, setProgress] = useState(0);

  // AI thoughts
  const thoughtsSequence: AIThought[] = [
    // Awareness stage - square format
    { id: 1, stage: 'awareness', format: 'square', type: 'thinking', text: "Analyzing brand identity and unique value propositions..." },
    { id: 2, stage: 'awareness', format: 'square', type: 'thinking', text: "Reviewing brand colors and typography to maintain visual consistency..." },
    { id: 3, stage: 'awareness', format: 'square', type: 'decision', text: "For awareness stage, should focus on broad appeal and emotional impact..." },
    { id: 4, stage: 'awareness', format: 'square', type: 'thinking', text: "Evaluating potential headline options for stop-scrolling impact..." },
    { id: 5, stage: 'awareness', format: 'square', type: 'decision', text: "Will use minimal text and focus on eye-catching visuals..." },
    { id: 6, stage: 'awareness', format: 'square', type: 'creation', text: "Generating 1:1 square awareness creative..." },
    
    // Awareness stage - vertical format
    { id: 7, stage: 'awareness', format: 'vertical', type: 'thinking', text: "Adapting awareness concept to vertical format for stories/reels..." },
    { id: 8, stage: 'awareness', format: 'vertical', type: 'thinking', text: "Adjusting visual composition for 9:16 aspect ratio..." },
    { id: 9, stage: 'awareness', format: 'vertical', type: 'creation', text: "Generating 9:16 vertical awareness creative..." },
    
    // Consideration stage - square format
    { id: 10, stage: 'consideration', format: 'square', type: 'thinking', text: "Moving to consideration stage - focusing on specific problems and solutions..." },
    { id: 11, stage: 'consideration', format: 'square', type: 'thinking', text: "Identifying key benefits and unique selling propositions for emphasis..." },
    { id: 12, stage: 'consideration', format: 'square', type: 'decision', text: "Will include more detailed information than awareness ad..." },
    { id: 13, stage: 'consideration', format: 'square', type: 'thinking', text: "Designing visuals that demonstrate product/service in context..." },
    { id: 14, stage: 'consideration', format: 'square', type: 'creation', text: "Generating 1:1 square consideration creative..." },
    
    // Consideration stage - vertical format
    { id: 15, stage: 'consideration', format: 'vertical', type: 'thinking', text: "Adapting consideration content to vertical format..." },
    { id: 16, stage: 'consideration', format: 'vertical', type: 'thinking', text: "Optimizing layout for mobile viewing experience..." },
    { id: 17, stage: 'consideration', format: 'vertical', type: 'creation', text: "Generating 9:16 vertical consideration creative..." },
    
    // Conversion stage - square format
    { id: 18, stage: 'conversion', format: 'square', type: 'thinking', text: "Moving to conversion stage - focusing on immediate action..." },
    { id: 19, stage: 'conversion', format: 'square', type: 'thinking', text: "Incorporating urgency and strong call-to-action elements..." },
    { id: 20, stage: 'conversion', format: 'square', type: 'decision', text: "Will highlight social proof and address final objections..." },
    { id: 21, stage: 'conversion', format: 'square', type: 'thinking', text: "Creating sense of FOMO (fear of missing out)..." },
    { id: 22, stage: 'conversion', format: 'square', type: 'creation', text: "Generating 1:1 square conversion creative..." },
    
    // Conversion stage - vertical format
    { id: 23, stage: 'conversion', format: 'vertical', type: 'thinking', text: "Adapting conversion content to vertical format..." },
    { id: 24, stage: 'conversion', format: 'vertical', type: 'thinking', text: "Optimizing CTA placement for thumb-friendly interaction..." },
    { id: 25, stage: 'conversion', format: 'vertical', type: 'creation', text: "Generating 9:16 vertical conversion creative..." },
    
    // Finalizing
    { id: 26, stage: 'conversion', format: 'vertical', type: 'thinking', text: "Optimizing final outputs for quality and alignment with brand..." },
  ];

  useEffect(() => {
    // Calculate overall progress percentage based on current thought index
    const newProgress = (thoughtIndex / thoughtsSequence.length) * 100;
    setProgress(newProgress);

    // Update current stage and format based on current thought
    if (thoughtIndex < thoughtsSequence.length) {
      const currentThought = thoughtsSequence[thoughtIndex];
      setCurrentStage(currentThought.stage);
      setCurrentFormat(currentThought.format);
    }

    // Display thoughts one by one with a delay
    const timer = setTimeout(() => {
      if (thoughtIndex < thoughtsSequence.length) {
        setDisplayedThoughts(prev => [...prev, thoughtsSequence[thoughtIndex]]);
        setThoughtIndex(prev => prev + 1);
      }
    }, 1500); // Adjust timing as needed

    return () => clearTimeout(timer);
  }, [thoughtIndex, thoughtsSequence]);

  // Helper function to get icon based on thought type
  const getIconForThought = (thought: AIThought) => {
    switch (thought.type) {
      case 'thinking':
        return <IconRobotThinking className="size-5" />;
      case 'decision':
        return <IconLightbulb className="size-5" />;
      case 'creation':
        return <IconCreativeExport className="size-5" />;
      default:
        return <IconRobotThinking className="size-5" />;
    }
  };

  // Helper function to get color class based on stage
  const getColorForStage = (stage: 'awareness' | 'consideration' | 'conversion') => {
    switch (stage) {
      case 'awareness':
        return 'text-primary-green';
      case 'consideration':
        return 'text-blue-400';
      case 'conversion':
        return 'text-amber-400';
      default:
        return 'text-primary-green';
    }
  };

  // Helper function to get background color class based on stage
  const getBgColorForStage = (stage: 'awareness' | 'consideration' | 'conversion') => {
    switch (stage) {
      case 'awareness':
        return 'bg-primary-green/20';
      case 'consideration':
        return 'bg-blue-500/20';
      case 'conversion':
        return 'bg-amber-500/20';
      default:
        return 'bg-primary-green/20';
    }
  };

  // Helper function to determine if a thought should be highlighted (current thought)
  const isHighlighted = (id: number) => {
    return id === displayedThoughts[displayedThoughts.length - 1]?.id;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-center mb-6 relative">
        <div className={`size-20 ${getBgColorForStage(currentStage)} rounded-full flex items-center justify-center`}>
          <IconRobotThinking className={`size-10 ${getColorForStage(currentStage)} animate-pulse`} />
        </div>
        <div className={`absolute -top-1 -right-1 size-4 ${currentStage === 'awareness' ? 'bg-primary-green' : currentStage === 'consideration' ? 'bg-blue-500' : 'bg-amber-500'} rounded-full animate-ping`} />
      </div>
      
      <h3 className="text-xl font-bold text-center mb-2">Generating Ad Creatives</h3>
      
      <div className="flex justify-center items-center gap-4 mb-6">
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${currentStage === 'awareness' ? 'bg-primary-green/20 text-primary-green' : currentStage === 'consideration' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)} Stage
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${currentFormat === 'square' ? 'bg-gray-700/50 text-white' : 'bg-gray-700/50 text-white'}`}>
          {currentFormat === 'square' ? '1:1 Square' : '9:16 Vertical'}
        </div>
      </div>
      
      <div className="mb-6 bg-gray-800/30 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary-green via-blue-500 to-amber-500 transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {displayedThoughts.map((thought) => (
          <div 
            key={thought.id} 
            className={`rounded-lg p-4 border transition-all duration-300 flex items-start gap-3 ${
              isHighlighted(thought.id) 
                ? `${getBgColorForStage(thought.stage)} border-${thought.stage === 'awareness' ? 'primary-green' : thought.stage === 'consideration' ? 'blue-500' : 'amber-500'}`
                : 'bg-gray-800/50 border-gray-700'
            }`}
          >
            <div className={`rounded-full p-2 ${getBgColorForStage(thought.stage)} ${getColorForStage(thought.stage)}`}>
              {getIconForThought(thought)}
            </div>
            <div className="flex-1">
              <p className="text-white/90 font-medium">{formatText(thought)}</p>
              {isHighlighted(thought.id) && thought.type === 'creation' && (
                <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-transparent to-white animate-progress-pulse"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes progress-pulse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-progress-pulse {
          animation: progress-pulse 1.5s ease-in-out infinite;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>
    </div>
  );
}