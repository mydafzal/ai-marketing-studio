export interface CustomerProfile {
  id: string;
  companyName: string;
  websiteLink: string;
  language?: string;
  locations?: any; // Keep flexible for now
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
  privacyPolicyLink?: string;
  websiteData?: any;
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