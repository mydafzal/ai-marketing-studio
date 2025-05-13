import { CustomerProfile, StoredCustomerProfile } from './customerProfileTypes';

const STORAGE_KEY = 'reeply_selected_customer_profile';

export function saveCustomerProfileToLocalStorage(profile: CustomerProfile): void {
  if (!profile || !profile.id) return;
  
  const storedProfile: StoredCustomerProfile = {
    profileId: profile.id,
    companyName: profile.companyName
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedProfile));
  } catch (error) {
    console.error('Error saving customer profile to local storage:', error);
  }
}

export function getStoredCustomerProfile(): StoredCustomerProfile | null {
  try {
    const storedProfileJson = localStorage.getItem(STORAGE_KEY);
    if (!storedProfileJson) return null;
    
    return JSON.parse(storedProfileJson) as StoredCustomerProfile;
  } catch (error) {
    console.error('Error getting stored customer profile:', error);
    return null;
  }
}

export function clearStoredCustomerProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing stored customer profile:', error);
  }
}