import React, { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw, ExternalLink, Loader2, Info as InfoIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CustomerProfile, CustomerProfileBehavior, CustomerProfileSelectorProps } from './customerProfileTypes';
import { getStoredCustomerProfile, saveCustomerProfileToLocalStorage } from './customerProfileStorage';

// Define an event dispatcher for profile changes
export const dispatchProfileChangeEvent = (profile: CustomerProfile | null) => {
  const event = new CustomEvent('customerProfileChange', { 
    detail: { profile }
  });
  window.dispatchEvent(event);
};

export function CustomerProfileSelector({
  selectedProfileId,
  setSelectedProfileId
}: CustomerProfileSelectorProps) {
  // State
  const [profileBehavior, setProfileBehavior] = useState<CustomerProfileBehavior>("own");
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [selectedProfileName, setSelectedProfileName] = useState<string>('');
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer profiles when component mounts
  useEffect(() => {
    if (profileBehavior === "select" && customerProfiles.length === 0) {
      fetchCustomerProfiles();
    }
  }, [profileBehavior]);

  // Update selected profile name when ID or profiles change
  useEffect(() => {
    if (selectedProfileId && customerProfiles.length > 0) {
      const selectedProfile = customerProfiles.find(profile => profile.id === selectedProfileId);
      if (selectedProfile) {
        setSelectedProfileName(selectedProfile.companyName);
      }
    }
  }, [selectedProfileId, customerProfiles]);

  // Check for previously stored profile
  useEffect(() => {
    const storedProfile = getStoredCustomerProfile();
    if (storedProfile && storedProfile.profileId) {
      setSelectedProfileId(storedProfile.profileId);
      setSelectedProfileName(storedProfile.companyName);
      setProfileBehavior("select");
      
      // Fetch and dispatch complete profile data
      fetchCompleteProfileData(storedProfile.profileId).then(completeProfile => {
        if (completeProfile) {
          dispatchProfileChangeEvent(completeProfile);
        }
      });
    }
  }, [setSelectedProfileId]);

  // When profile behavior changes to "own", clear selected profile
  useEffect(() => {
    if (profileBehavior === "own" && selectedProfileId) {
      setSelectedProfileId("");
      setSelectedProfileName("");
      dispatchProfileChangeEvent(null);
    }
  }, [profileBehavior, selectedProfileId, setSelectedProfileId]);

  // Fetch customer profiles from API
  const fetchCustomerProfiles = async () => {
    setLoadingProfiles(true);
    setError(null);
    
    try {
      const response = await fetch('/api/persona');
      const data = await response.json();
      
      if (data.success) {
        // Map the API response format to our CustomerProfile type
        const profiles = data.data.map((persona: any) => ({
          id: persona.id,
          companyName: persona.company_name,
          websiteLink: persona.website_link,
          language: persona.preferred_language,
          locations: persona.location_data,
          createdAt: persona.created_at,
          updatedAt: persona.updated_at,
          ownerId: persona.owner_id,
          privacyPolicyLink: persona.privacy_policy_link,
          websiteData: persona.website_data
        }));
        
        setCustomerProfiles(profiles);
      } else {
        setError('Failed to fetch customer profiles');
      }
    } catch (error) {
      console.error('Error fetching customer profiles:', error);
      setError('Error fetching customer profiles');
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Fetch complete profile data
  const fetchCompleteProfileData = async (profileId: string) => {
    try {
      const response = await fetch(`/api/persona/${profileId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Map snake_case to camelCase and also keep original snake_case properties
        const completeProfile: CustomerProfile = {
          id: data.data.id,
          companyName: data.data.company_name,
          websiteLink: data.data.website_link,
          language: data.data.preferred_language,
          locations: data.data.location_data,
          createdAt: data.data.created_at,
          updatedAt: data.data.updated_at,
          ownerId: data.data.owner_id,
          privacyPolicyLink: data.data.privacy_policy_link,
          websiteData: data.data.website_data,
          // Also keep original snake_case versions for API compatibility
          preferred_language: data.data.preferred_language,
          location_data: data.data.location_data,
          privacy_policy_link: data.data.privacy_policy_link,
          website_data: data.data.website_data
        };
        
        return completeProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching complete profile data:', error);
      return null;
    }
  };

  // Handle profile selection
  const handleProfileSelection = async (profileId: string) => {
    if (!profileId) {
      setSelectedProfileId("");
      setSelectedProfileName("");
      dispatchProfileChangeEvent(null);
      return;
    }
    
    // Find basic profile info from current list
    const basicProfile = customerProfiles.find(profile => profile.id === profileId);
    if (!basicProfile) return;
    
    // Set basic info immediately for UI responsiveness
    setSelectedProfileId(profileId);
    setSelectedProfileName(basicProfile.companyName);
    
    // Fetch complete profile data
    const completeProfile = await fetchCompleteProfileData(profileId);
    if (completeProfile) {
      // Update local storage with complete profile
      saveCustomerProfileToLocalStorage(completeProfile);
      
      // Dispatch event with complete profile data
      dispatchProfileChangeEvent(completeProfile);
    } else {
      // If complete profile fetch fails, still use basic profile
      dispatchProfileChangeEvent(basicProfile);
    }
  };

  // Open manage profiles in new tab
  const openManageProfiles = () => {
    window.open('/manage-persona', '_blank');
  };

  return (
    <div className="mt-6 pt-2 border-t border-border-dark">
      <h4 className="text-sm font-medium text-text-white mb-2">
        Customer Profile
      </h4>
      <p className="text-xs text-text-light-gray mb-3">
        Choose whether to use your own profile or select from your saved customer profiles.
      </p>
      
      <RadioGroup
        value={profileBehavior}
        onValueChange={(value) => setProfileBehavior(value as CustomerProfileBehavior)}
        className="space-y-3"
      >
        <div className="flex items-start space-x-2">
          <RadioGroupItem id="own-profile" value="own" />
          <div className="flex flex-col">
            <Label htmlFor="own-profile" className="text-sm font-medium text-text-white">
              Use my own profile
            </Label>
            <span className="text-xs text-text-light-gray">
              Use your own profile information for this campaign.
            </span>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <RadioGroupItem id="select-profile" value="select" />
          <div className="flex flex-col w-full">
            <Label htmlFor="select-profile" className="text-sm font-medium text-text-white mb-1">
              Select customer profile
            </Label>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <select
                  className={`w-full bg-dark-bg border border-border-dark rounded-md py-2 px-3 text-sm appearance-none ${profileBehavior === "select" ? "text-text-white" : "text-text-light-gray"}`}
                  disabled={profileBehavior !== "select" || customerProfiles.length === 0}
                  value={selectedProfileId}
                  onChange={(e) => handleProfileSelection(e.target.value)}
                >
                  <option value="">Select a customer profile...</option>
                  {customerProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.companyName}
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  size={16} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light-gray pointer-events-none" 
                />
              </div>
              
              <button
                type="button"
                className="p-2 bg-dark-bg border border-border-dark rounded-md text-text-light-gray hover:text-primary-green disabled:opacity-50"
                onClick={fetchCustomerProfiles}
                disabled={profileBehavior !== "select" || loadingProfiles}
                title="Refresh profiles"
              >
                {loadingProfiles ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
              
              <button
                type="button"
                className="p-2 bg-dark-bg border border-border-dark rounded-md text-text-light-gray hover:text-primary-green"
                onClick={openManageProfiles}
                title="Manage customer profiles"
              >
                <ExternalLink size={16} />
              </button>
            </div>
            
            {error && (
              <p className="mt-1 text-xs text-red-400">{error}</p>
            )}
            
            {profileBehavior === "select" && customerProfiles.length === 0 && !loadingProfiles && !error && (
              <p className="mt-1 text-xs text-text-light-gray">
                No customer profiles found. <button onClick={openManageProfiles} className="text-primary-green hover:underline">Create one</button>
              </p>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}