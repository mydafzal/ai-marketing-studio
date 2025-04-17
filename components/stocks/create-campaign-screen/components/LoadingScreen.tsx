import React, { useState, useEffect } from 'react';
import { loadingSteps, initializeApiCallSteps, launchApiCallSteps } from '../utils';

interface LoadingScreenProps {
  loadingStep: number;
  error?: string | null;
  mode?: 'initialize' | 'launch';
}

export function LoadingScreen({ loadingStep, error, mode = 'initialize' }: LoadingScreenProps) {
  const apiCallSteps = mode === 'initialize' ? initializeApiCallSteps : launchApiCallSteps;
  const [apiCallStep, setApiCallStep] = useState(0);
  const [isApiStepComplete, setIsApiStepComplete] = useState(false);

  // Cycle through API call animations when loading steps change
  useEffect(() => {
    // If there's an error, don't cycle through API calls
    if (error) {
      return;
    }
    
    // Reset when loading step changes
    setApiCallStep(0);
    setIsApiStepComplete(false);
    
    // Use intervals to cycle through API call animations
    const apiInterval = setInterval(() => {
      setApiCallStep(prev => {
        // Only go to next API call if we haven't reached the end
        if (prev < apiCallSteps.length - 1) {
          return prev + 1;
        }
        // Mark as complete on last step
        setIsApiStepComplete(true);
        clearInterval(apiInterval);
        return prev;
      });
    }, 2000); // Show each API call for 2 seconds

    return () => clearInterval(apiInterval);
  }, [loadingStep, error]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-20 h-20 flex items-center justify-center mb-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-border-dark border-t-primary-green rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-dark-bg rounded-full flex items-center justify-center border border-border-dark">
              <span className="text-lg font-bold text-primary-green">AI</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold mb-5 text-primary-green">
          AI Campaign Assistant
        </h3>
        <div className="relative h-12 min-h-12">
          {loadingSteps.map((step, index) => (
            <p key={index} className={`text-lg font-medium absolute left-0 right-0 transition-all duration-500 ${
              loadingStep === index ? "opacity-100 transform translate-y-0 text-text-white" : 
              loadingStep > index ? "opacity-0 transform -translate-y-8" : 
              "opacity-0 transform translate-y-8"
            }`}>
              {step}
            </p>
          ))}
        </div>
      </div>
      
      {/* Facebook API Calls Animation */}
      <div className="bg-[#1A1B26] rounded-lg p-4 mb-6 border border-border-dark w-96 max-w-full shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Facebook Marketing API</h4>
          <div className="flex space-x-1">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          </div>
        </div>
        
        <div className="font-mono text-xs mb-3 bg-[#13141B] p-2 rounded border border-gray-800 overflow-hidden">
          <p className="text-[#FFD942]">
            $ facebook-api-client --token=**** --version=v22.0
          </p>
        </div>
        
        <div className="font-mono text-xs h-32 overflow-hidden relative p-1">
          {apiCallSteps.map((step, index) => (
            <div 
              key={index}
              className={`transition-all duration-300 ${
                index <= apiCallStep ? "opacity-100" : "opacity-0 absolute"
              }`}
            >
              <p className="text-gray-300 mb-1">
                <span className="text-[#61AFEF]">[{new Date().toLocaleTimeString()}]</span> <span className="text-primary-green">INFO:</span> {step.label}
              </p>
              <p className={`mb-2 ${index === apiCallStep && !isApiStepComplete ? "animate-pulse" : ""}`}>
                <span className="text-[#E06C75]">POST</span> <span className="text-[#98C379]">{step.endpoint}</span>
                {index < apiCallStep || isApiStepComplete ? (
                  <span className="text-green-400 ml-2">✓ 200 OK</span>
                ) : index === apiCallStep ? (
                  <span className="text-yellow-400 ml-2">⧖ processing...</span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-64 h-2 bg-dark-bg rounded-full overflow-hidden border border-border-dark">
        <div 
          className={`h-full transition-all duration-500 ${error ? 'bg-red-500' : 'bg-primary-green'}`}
          style={{ width: error ? '100%' : `${(loadingStep + 1) / loadingSteps.length * 100}%` }}
        ></div>
      </div>
      
      {error ? (
        <p className="text-sm text-red-400 mt-3 max-w-xs text-center">
          {error}
        </p>
      ) : (
        <p className="text-sm text-text-light-gray mt-3">
          Please wait while I optimize your campaign...
        </p>
      )}
    </div>
  );
}