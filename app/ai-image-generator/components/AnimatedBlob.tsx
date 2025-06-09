"use client";

import React, { useEffect } from 'react';

export default function AnimatedBlob() {
  // Add animation styles to the global scope
  useEffect(() => {
    // Add the fadeIn animation if it doesn't exist
    if (!document.getElementById('fadeInAnimation')) {
      const style = document.createElement('style');
      style.id = 'fadeInAnimation';
      style.innerHTML = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up on component unmount
      const styleElement = document.getElementById('fadeInAnimation');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(75,242,156,0.7)]">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#4BF29C] via-[#35d6ff] to-[#0a84ff]" 
        style={{
          animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
          backgroundSize: "300% 300%"
        }}
      ></div>
      <div 
        className="absolute inset-0" 
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
          animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
        }}
      ></div>
      <div 
        className="absolute inset-0" 
        style={{
          background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
          backgroundSize: "400% 400%",
          animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
        }}
      ></div>
      <div 
        className="absolute inset-0" 
        style={{
          background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
          backgroundSize: "200% 200%",
          animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
        }}
      ></div>
      <div 
        className="absolute inset-[2px] rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
          animation: "pulse 2s ease-in-out infinite alternate"
        }}
      ></div>
    </div>
  );
} 