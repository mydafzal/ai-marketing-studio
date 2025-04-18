/**
 * Validate and extract Instagram account ID from user data
 * Returns the Instagram account ID if it's associated with the user's fbPageId,
 * otherwise returns an empty string
 * 
 * The instagramFbPagePairing is stored in the format "instagramId.fbPageId"
 */
export function validateAndExtractInstagramAccountId(userData: any): string {
  if (!userData) return '';

  // If there's no Instagram-FB pairing or Facebook page ID, return empty string
  if (!userData.instagramFbPagePairing || !userData.fbPageId) {
    return '';
  }

  try {
    // Split the pairing string by the dot separator
    const [instagramId, storedFbPageId] = userData.instagramFbPagePairing.split('.');
    
    // Validate that the user's fbPageId matches the one in the pairing
    if (storedFbPageId && userData.fbPageId === storedFbPageId) {
      // Return the Instagram account ID if validation passes
      return instagramId || '';
    } else {
      console.log(`Facebook Page ID mismatch. Current: ${userData.fbPageId}, Stored: ${storedFbPageId}`);
      return '';
    }
  } catch (error) {
    console.error('Error handling Instagram account pairing:', error);
    return '';
  }
}