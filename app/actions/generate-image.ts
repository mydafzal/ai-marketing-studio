// app/actions/generate-image.ts
'use server'

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN as string,
});

export async function generateImages(prompt: string): Promise<{ 
  success: boolean; 
  images?: string[]; 
  error?: string;
}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    console.log("Starting image generation with prompt:", prompt);

    // Generate 4 separate predictions in parallel
    // Adjust inputs if the new model supports or requires them
    const predictions = await Promise.all([
      replicate.run(
        "ideogram-ai/ideogram-v2-turbo",
        {
          input: {
            prompt: prompt,
          },
        }
      ),
      replicate.run(
        "ideogram-ai/ideogram-v2-turbo",
        {
          input: {
            prompt: prompt,
          },
        }
      ),
      replicate.run(
        "ideogram-ai/ideogram-v2-turbo",
        {
          input: {
            prompt: prompt,
          },
        }
      ),
      replicate.run(
        "ideogram-ai/ideogram-v2-turbo",
        {
          input: {
            prompt: prompt,
          },
        }
      )
    ]);

    console.log('Generation outputs:', predictions);

    // Flatten the array of results and ensure they're strings
    const imageUrls = predictions
      .flat()
      .filter(Boolean)
      .map(url => String(url));

    if (imageUrls.length === 0) {
      throw new Error('No images were generated');
    }

    const response = {
      success: true,
      images: imageUrls
    };

    // Ensure the response is serializable
    return JSON.parse(JSON.stringify(response));

  } catch (error) {
    console.error('Error in generateImages:', error);
    return {
      success: false,
      error: error instanceof Error ? String(error.message) : 'Failed to generate images'
    };
  }
}
