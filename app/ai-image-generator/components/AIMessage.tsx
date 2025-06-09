"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import AnimatedBlob from './AnimatedBlob';

interface AIMessageProps {
  isLoading: boolean;
  displayedText: string;
  isGeneratingMultipleImages?: boolean;
  displayedGenerationMessage?: string;
  displayedCompletionMessage?: string;
}

export default function AIMessage({ 
  isLoading, 
  displayedText, 
  isGeneratingMultipleImages = false,
  displayedGenerationMessage = "",
  displayedCompletionMessage = ""
}: AIMessageProps) {
  const renderTypingText = (text: string) => {
    return (
      <span className="typing-text">
        {text.split(/(\s+)/).map((word, wordIndex) => (
          <span 
            key={wordIndex} 
            className="word-span"
            style={{
              display: 'inline-block',
              whiteSpace: 'pre-wrap'
            }}
          >
            {word.split('').map((char, charIndex) => (
              <span 
                key={`${wordIndex}-${charIndex}`} 
                style={{ 
                  display: 'inline'
                }}
              >{char}</span>
            ))}
          </span>
        ))}
      </span>
    );
  };

  const getDisplayText = () => {
    if (isGeneratingMultipleImages) {
      return displayedGenerationMessage;
    } else if (displayedCompletionMessage) {
      return displayedCompletionMessage;
    }
    return displayedText;
  };

  return (
    <div className="flex justify-center mb-10">
      <div className="flex items-start max-w-xl w-full">
        <div className="mr-4 flex-shrink-0">
          <AnimatedBlob />
        </div>
        <div className="bg-[#1A1D29] rounded-lg p-5 shadow flex-grow">
          <div className="text-white text-base typing-container relative" 
             style={{ 
               whiteSpace: "pre-wrap", 
               minHeight: "24px",
               wordBreak: "keep-all",
               overflowWrap: "break-word",
               hyphens: "none",
               lineHeight: "1.5"
             }}>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#4BF29C]" />
                <span>Analyzing your business profile...</span>
              </div>
            ) : (
              renderTypingText(getDisplayText())
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 