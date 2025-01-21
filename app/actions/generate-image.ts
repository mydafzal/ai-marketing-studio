// app/actions/generate-image.ts
'use server'

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN as string,
});



export async function generateImages(prompt: string,additionalPrompt: string): Promise<{ 
  success: boolean; 
  images?: string[]; 
  error?: string;
}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    console.log("Starting image generation with additional:", additionalPrompt);

    // console.log("Starting image generation with prompt:", prompt);

    // Generate 4 separate predictions in parallel for better performance
    const predictions = await Promise.all([
      replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: prompt+". Also follow this instructions: "+additionalPrompt,
            num_outputs: 1,  // Generate 1 image per prediction
            prompt_upsampling: true,
            aspect_ratio: "1:1",
            guidance_scale: 7.5,
            num_inference_steps: 50
          },
        }
      ),
      replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: prompt,
            num_outputs: 1,
            prompt_upsampling: true,
            aspect_ratio: "1:1",
            guidance_scale: 7.5,
            num_inference_steps: 50
          },
        }
      ),
      replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: prompt,
            num_outputs: 1,
            prompt_upsampling: true,
            aspect_ratio: "1:1",
            guidance_scale: 7.5,
            num_inference_steps: 50
          },
        }
      ),
      replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt: prompt,
            num_outputs: 1,
            prompt_upsampling: true,
            aspect_ratio: "1:1",
            guidance_scale: 7.5,
            num_inference_steps: 50
          },
        }
      )
    ]);

    // console.log('Generation outputs:', predictions);

    // Flatten the array of results and ensure they're strings
    const imageUrls = predictions
      .flat()
      .filter(Boolean)
      .map(url => String(url));

    if (imageUrls.length === 0) {
      throw new Error('No images were generated');
    }

    // Create a plain object for the response
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