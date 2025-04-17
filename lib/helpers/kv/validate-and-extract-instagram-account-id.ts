/**
 * Validate and extract Instagram account ID from user data
 * Returns the Instagram account ID if it's associated with the user's fbPageId,
 * otherwise returns an empty string
 */
export function validateAndExtractInstagramAccountId(userData: any): string {
    if (!userData) return '';

    // If there's no Instagram account config or Facebook page ID, return empty string
    if (!userData.instagramAccountConfig || !userData.fbPageId) {
        return '';
    }

    // Parse the Instagram account config JSON
    try {
        const instagramConfig = JSON.parse(userData.instagramAccountConfig as string);

        // Validate that the fbPageId matches the mappedFbPageId in the Instagram config
        if (userData.fbPageId === instagramConfig.mappedFbPageId) {
            // Return the Instagram account ID if validation passes
            return instagramConfig.instagramAccountId || '';
        } else {
            console.log(`Facebook Page ID mismatch. Current: ${userData.fbPageId}, Expected: ${instagramConfig.mappedFbPageId}`);
            return '';
        }
    } catch (error) {
        console.error('Error parsing Instagram account configuration:', error);
        return '';
    }
}