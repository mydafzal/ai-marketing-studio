/**
 * API client to toggle an ad creative's status between ACTIVE and PAUSED
 * Uses the FastAPI endpoint through our Next.js API route
 */
export async function toggleAdCreativeStatus(adCreativeId: string): Promise<{
    success: boolean;
    previous_status?: string;
    new_status?: string;
    error?: string;
  }> {
    try {
      console.log('toggleAdCreativeStatus called for ID:', adCreativeId);
      
      // Call the Next.js API route we just created
      const response = await fetch('/api/fasty-bot/proxy-toggle-ad-creative-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ad_creative_id: adCreativeId }),
      });
  
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('Error response:', data);
        throw new Error(data.error || 'Failed to toggle ad creative status');
      }
  
      console.log('Toggle successful:', data);
      
      return {
        success: true,
        previous_status: data.previous_status,
        new_status: data.new_status,
      };
    } catch (error) {
      console.error('Error toggling ad creative status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }