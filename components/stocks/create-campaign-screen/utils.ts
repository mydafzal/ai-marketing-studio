import { AspectRatio } from './types';

// Utility functions
export const calculateAspectRatio = (file: File): Promise<AspectRatio> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const ratio = width / height;
      
      // Determine which aspect ratio the image is closest to
      if (ratio > 0.9 && ratio < 1.1) {
        resolve('1:1'); // Square
      } else if (ratio > 1.7 && ratio < 1.8) {
        resolve('16:9'); // Landscape wide
      } else if (ratio > 0.55 && ratio < 0.6) {
        resolve('9:16'); // Portrait tall
      } else if (ratio > 1.3 && ratio < 1.35) {
        resolve('4:3'); // Standard landscape
      } else if (ratio > 0.74 && ratio < 0.76) {
        resolve('3:4'); // Standard portrait
      } else if (ratio > 0.65 && ratio < 0.68) {
        resolve('2:3'); // Portrait
      } else if (ratio > 1.45 && ratio < 1.55) {
        resolve('3:2'); // Landscape
      } else if (ratio <= 0.65) {
        // Default to 9:16 for very tall images
        resolve('9:16');
      } else {
        // Default to 16:9 for very wide images
        resolve('16:9');
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
      
      // Same aspect ratio logic as images
      if (ratio > 0.9 && ratio < 1.1) {
        resolve('1:1'); // Square
      } else if (ratio > 1.7 && ratio < 1.8) {
        resolve('16:9'); // Landscape wide
      } else if (ratio > 0.55 && ratio < 0.6) {
        resolve('9:16'); // Portrait tall
      } else if (ratio > 1.3 && ratio < 1.35) {
        resolve('4:3'); // Standard landscape
      } else if (ratio > 0.74 && ratio < 0.76) {
        resolve('3:4'); // Standard portrait
      } else if (ratio > 0.65 && ratio < 0.68) {
        resolve('2:3'); // Portrait
      } else if (ratio > 1.45 && ratio < 1.55) {
        resolve('3:2'); // Landscape
      } else if (ratio <= 0.65) {
        // Default to 9:16 for very tall videos
        resolve('9:16');
      } else {
        // Default to 16:9 for very wide videos
        resolve('16:9');
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