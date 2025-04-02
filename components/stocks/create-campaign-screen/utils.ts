import { AspectRatio } from './types';

// Utility functions
export const calculateAspectRatio = (file: File): Promise<AspectRatio> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;
      
      // Only categorize images as either 9:16 or 1:1 as required by Facebook
      // Images close to 9:16 ratio (0.5625) should be categorized as 9:16
      // All other images should be categorized as 1:1
      if (ratio > 0.53 && ratio < 0.6) {
        console.log('📏 Image categorized as 9:16 with ratio:', ratio);
        resolve('9:16'); // Portrait tall (9:16)
      } else {
        console.log('📏 Image categorized as 1:1 with ratio:', ratio);
        resolve('1:1'); // All other ratios use 1:1
      }
    };
    img.src = URL.createObjectURL(file);
  });
};

// Function to get video dimensions and calculate aspect ratio
export const calculateVideoAspectRatio = (file: File): Promise<AspectRatio> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const ratio = width / height;
      
      // Only categorize videos as either 9:16 or 1:1 as required by Facebook
      // Videos close to 9:16 ratio (0.5625) should be categorized as 9:16
      // All other videos should be categorized as 1:1
      if (ratio > 0.53 && ratio < 0.6) {
        console.log('📏 Video categorized as 9:16 with ratio:', ratio);
        resolve('9:16'); // Portrait tall (9:16)
      } else {
        console.log('📏 Video categorized as 1:1 with ratio:', ratio);
        resolve('1:1'); // All other ratios use 1:1
      }
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const loadingSteps = [
  "I am analyzing your website link...",
  "Understanding your advertising goal...",
  "Researching the best possible targeting...",
  "Identifying ideal audience demographics...",
  "Selecting optimal platform placements...",
  "Optimizing creative elements...",
  "Finalizing campaign settings..."
];

export const initializeApiCallSteps = [
  {
    label: "Initializing campaign flow...",
    endpoint: "api/master-flow-initiate-process"
  },
  {
    label: "Analyzing your website...",
    endpoint: "api/analyze/website"
  },
  {
    label: "Generating ad text suggestions...",
    endpoint: "api/generate/ad_text"
  },
  {
    label: "Researching audience targeting...",
    endpoint: "api/research/audience"
  },
  {
    label: "Processing media assets...",
    endpoint: "api/process/media"
  },
  {
    label: "Creating demographic targeting...",
    endpoint: "api/create/targeting"
  },
  {
    label: "Preparing campaign structure...",
    endpoint: "api/prepare/campaign"
  }
];

export const launchApiCallSteps = [
  {
    label: "Setting up campaign...",
    endpoint: "api/campaign/create"
  },
  {
    label: "Creating ad set with targeting...",
    endpoint: "api/adset/create"
  },
  {
    label: "Building creative content...",
    endpoint: "api/adcreative/create"
  },
  {
    label: "Configuring ad placement...",
    endpoint: "api/ad/create"
  },
  {
    label: "Optimizing audience reach...",
    endpoint: "api/audience/update"
  },
  {
    label: "Setting up lead form...",
    endpoint: "api/leadform/create"
  },
  {
    label: "Finalizing and launching campaign...",
    endpoint: "api/fasty-bot/proxy-finalize-campaign"
  }
];

// For backward compatibility
export const apiCallSteps = initializeApiCallSteps;