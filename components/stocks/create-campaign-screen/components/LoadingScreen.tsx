import React from 'react';
import { loadingSteps } from '../utils';

interface LoadingScreenProps {
  loadingStep: number;
}

export function LoadingScreen({ loadingStep }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-20 h-20 flex items-center justify-center mb-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-[#743FC7] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <span className="text-lg font-bold bg-gradient-to-r from-[#743FC7] to-blue-500 text-transparent bg-clip-text">AI</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold mb-5 bg-gradient-to-r from-[#743FC7] to-blue-500 text-transparent bg-clip-text">
          AI Campaign Assistant
        </h3>
        <div className="relative h-12 min-h-12">
          {loadingSteps.map((step, index) => (
            <p key={index} className={`text-lg font-medium absolute left-0 right-0 transition-all duration-500 ${
              loadingStep === index ? "opacity-100 transform translate-y-0" : 
              loadingStep > index ? "opacity-0 transform -translate-y-8" : 
              "opacity-0 transform translate-y-8"
            }`}>
              {step}
            </p>
          ))}
        </div>
      </div>
      
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#743FC7] to-blue-500 transition-all duration-500"
          style={{ width: `${(loadingStep + 1) / loadingSteps.length * 100}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-400 mt-3">
        Please wait while I optimize your campaign...
      </p>
    </div>
  );
}