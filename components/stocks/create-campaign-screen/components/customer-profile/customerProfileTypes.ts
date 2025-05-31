export interface CustomerProfile {
  id: string;
  name?: string; // New profile name field
  companyName: string;
  websiteLink: string;
  language?: string;
  locations?: any; // Keep flexible for now
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
  privacyPolicyLink?: string;
  websiteData?: any;
  preferred_language?: string; // Match API naming convention
  location_data?: any; // Match API naming convention
  privacy_policy_link?: string; // Match API naming convention
  website_data?: any; // Match API naming convention
}

export type CustomerProfileBehavior = "own" | "select";

export interface StoredCustomerProfile {
  profileId: string;
  companyName: string;
}

export interface CustomerProfileSelectorProps {
  selectedProfileId: string;
  setSelectedProfileId: (id: string) => void;
}