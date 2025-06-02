export interface CompanyInfo {
  name: string;
  description: string;
  segment: string;
  brandColors: string[];
  websiteImages: string[];
}

export interface GeneratedImages {
  social: string[];
  product: string[];
  branding: string[];
}

export interface AdContent {
  headline: string;
  text: string;
}

export interface GeneratedAdContent {
  social: AdContent | null;
  product: AdContent | null;
  branding: AdContent | null;
}

export interface ImageGeneratorState {
  isLoading: boolean;
  isGeneratingImage: boolean;
  displayedText: string;
  fullMessage: string;
  companyInfo: CompanyInfo;
  showTabs: boolean;
  showImageGenerationUI: boolean;
  generatedImages: GeneratedImages;
  generatedAdContent: GeneratedAdContent;
  selectedImage: string | null;
  selectedFormat: string | null;
  error: string | null;
  selectedReferenceImages: string[];
  showReferenceImages: boolean;
  referenceImageUploadedFiles: File[];
  isUploadingImage: boolean;
  showUploadField: boolean;
  isGeneratingMultipleImages: boolean;
  showAIGenerationMessage: boolean;
  completionMessage: string;
  isTypingCompletionMessage: boolean;
  displayedCompletionMessage: string;
  generationMessage: string;
  isTypingGenerationMessage: boolean;
  displayedGenerationMessage: string;
  isGeneratingAdContent: boolean;
} 