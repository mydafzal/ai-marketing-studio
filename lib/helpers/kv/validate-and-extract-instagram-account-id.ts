/**
 * Validate and extract Instagram account ID from user data
 * Returns the Instagram account ID if it's associated with the user's fbPageId,
 * otherwise returns an empty string
 *
 * The instagramFbPagePairing is stored in the format "instagramId.fbPageId"
 */
export function validateAndExtractInstagramAccountId(userData: any): string {
  if (!userData) return '';

  const pairingRaw = userData.instagramFbPagePairing;
  const fbPageIdRaw = userData.fbPageId;

  if (!pairingRaw || !fbPageIdRaw) {
    return '';
  }

  try {
    const splitInstagramFbArr = String(pairingRaw).trim().split('.');
    if (splitInstagramFbArr.length !== 2) {
      return '';
    }

    const instagramId = splitInstagramFbArr[0].trim();
    const fbPageIdMapped = splitInstagramFbArr[1].trim();
    const fbPageId = String(fbPageIdRaw).trim();

    if (fbPageIdMapped !== fbPageId) {
      return '';
    }

    return instagramId;
  } catch (err) {
    console.error('Error in validateAndExtractInstagramAccountId:', err);
    return '';
  }
}

