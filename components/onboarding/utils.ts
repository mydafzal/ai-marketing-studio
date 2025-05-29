/**
 * Helper functions for onboarding component
 */

// Check if a URL is valid (has a TLD after adding https://)
export const isValidUrl = (url: string) => {
  if (!url || url.trim() === '') return false;
  
  try {
    // Ensure URL has protocol before checking
    const urlWithProtocol = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    
    // Check for a valid domain with at least one dot (to ensure there's a TLD)
    return urlObj.hostname.includes('.') && urlObj.hostname.split('.').pop()!.length > 0;
  } catch (e) {
    return false;
  }
};

// URL validation to ensure all links have https:// but no www.
export const validateAndFixUrl = (url: string) => {
  if (!url || url.trim() === '') return url;
  
  // Remove www. if present
  let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)/i, '');
  
  // Add https:// if not present
  if (!cleanUrl.match(/^https?:\/\//i)) {
    return `https://${cleanUrl}`;
  }
  
  return cleanUrl;
};
