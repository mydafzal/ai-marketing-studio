"use server"

import OpenAI from "openai"
import Replicate from "replicate"
import { checkUsageLimit, incrementUsageCounter } from "@/app/actions"
// Note: We dynamically import FormData and node-fetch when needed
// This is to avoid issues with Next.js server components

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
})

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN as string,
})

// Available aspect ratios with their corresponding dimensions
const aspectRatios = {
  "9:16": { width: 864, height: 1536, size: "1024x1536" },
  "3:4": { width: 896, height: 1152, size: "1024x1536" }
};

// Export the AspectRatio type so it can be imported in the client component
export type AspectRatio = keyof typeof aspectRatios;

/**
 * Generate multiple images in parallel using the OpenAI GPT-Image-1 model.
 * This function accepts a text prompt and an aspect ratio, returning up to 4 generated images.
 */
export async function generateImages(
  prompt: string,
  aspectRatio: AspectRatio = "1:1",
  numberOfImages: number = 5
): Promise<{ 
  success: boolean 
  images?: string[] 
  error?: string 
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }
    
    // Check if user has reached the free tier image limit
    const usageCheck = await checkUsageLimit('images')
    if (usageCheck.success && usageCheck.limitReached) {
      return {
        success: false,
        error: "Free plan image generation limit reached. Please upgrade your subscription to continue generating images."
      }
    }

    console.log(`Starting image generation with prompt: "${prompt}" and aspect ratio: ${aspectRatio}`)
    
    // Get the size parameter based on the aspect ratio
    const size = aspectRatios[aspectRatio].size
    
    // Generate predictions for the specified number of images (up to 10)
    // TypeScript definitions don't match actual gpt-image-1 supported parameters
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      n: Math.min(numberOfImages, 10), // Allow up to 10 images
      size: size as any, // gpt-image-1 supports different sizes than the type definition
      quality: "high" as any, // gpt-image-1 supports "high" quality
      // Note: We're using b64_json by default which is what GPT-Image-1 returns
    } as any)
    
    console.log("Generation complete, received results")
    
    // Extract base64 image data and convert to data URLs
    const imageUrls = result.data.map(image => {
      if (image.b64_json) {
        return `data:image/png;base64,${image.b64_json}`
      }
      return ""
    }).filter(Boolean)

    if (imageUrls.length === 0) {
      throw new Error("No images were generated")
    }
    
    // Increment the usage counter for successful generations
    await incrementUsageCounter('images')

    const response = {
      success: true,
      images: imageUrls,
    }

    // Ensure the response is serializable
    return JSON.parse(JSON.stringify(response))
  } catch (error) {
    console.error("Error in generateImages:", error)
    return {
      success: false,
      error: error instanceof Error ? String(error.message) : "Failed to generate images",
    }
  }
}

/**
 * Inpaint an image using the 'ideogram-ai/ideogram-v2' model.
 * This function expects:
 *  - `prompt` (string)
 *  - `base64Image` (the base64 data URL of the original image)
 *  - `maskImage` (the base64 data URL of the mask, where black = inpaint region, white = keep)
 */
/**
 * Generate image variants using multiple reference images with the OpenAI GPT-Image-1 model.
 * This function accepts multiple base64 image data URLs and a text prompt.
 * It uses the images/edits endpoint which is optimized for the GPT-Image-1 model.
 */
export async function generateImageVariants(
  prompt: string,
  referenceImages: string[],
  aspectRatio: AspectRatio = "1:1",
  numberOfImages: number = 5
): Promise<{ 
  success: boolean 
  images?: string[] 
  error?: string 
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }
    
    // Check if user has reached the free tier image limit
    const usageCheck = await checkUsageLimit('images')
    if (usageCheck.success && usageCheck.limitReached) {
      return {
        success: false,
        error: "Free plan image generation limit reached. Please upgrade your subscription to continue generating images."
      }
    }

    console.log(`Starting image variant generation with prompt: "${prompt}" and ${referenceImages.length} reference images`)
    
    // Get the size parameter based on the aspect ratio
    const size = aspectRatios[aspectRatio].size
    
    // Convert base64 data URLs to Buffers
    const imageBuffers = referenceImages.map(dataUrl => {
      try {
        // Extract the base64 part from the data URL
        const base64Data = dataUrl.split(',')[1]
        return Buffer.from(base64Data, 'base64')
      } catch (error) {
        console.error("Error converting data URL to Buffer:", error)
        return null
      }
    }).filter(Boolean) as Buffer[]
    
    if (imageBuffers.length === 0) {
      throw new Error("No valid reference images provided")
    }
    
    // Use node-fetch for making the request
    const fetch = (await import('node-fetch')).default;
    
    // Create a FormData instance
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    
    // Add all parameters to the form data
    form.append('model', 'gpt-image-1');
    form.append('prompt', prompt);
    form.append('n', Math.min(numberOfImages, 10).toString()); // Allow up to 10 images
    form.append('size', size);
    form.append('quality', 'high');
    // Note: response_format is not used for gpt-image-1 as it always returns base64 images
    
    // For the images/edits endpoint, we need to handle single vs multiple images differently
    if (imageBuffers.length === 1) {
      // Single image - use 'image' parameter (no array brackets)
      form.append('image', imageBuffers[0], {
        filename: 'reference-image.png',
        contentType: 'image/png'
      });
      
      // We can also add a mask if needed for selective editing
      // For reference image editing, we're not using a mask
    } else {
      // Multiple images - use array format for each image
      imageBuffers.forEach((buffer, index) => {
        form.append('image[]', buffer, {
          filename: `reference-image-${index + 1}.png`,
          contentType: 'image/png'
        });
      });
    }
    
    console.log(`Sending request to OpenAI images/edits API with ${imageBuffers.length} reference image(s)`);
    
    // Helper function for fetch with retry logic
    const fetchWithRetry = async (url: string, options: any, retries = 3, delay = 1000): Promise<any> => {
      try {
        const response = await fetch(url, options);
        
        // If successful or we've used all retries, return the response
        if (response.ok || retries <= 1) return response;
        
        // Otherwise wait and retry
        console.log(`Retrying fetch, ${retries-1} attempts remaining...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      } catch (error) {
        // If we have retries left, try again after delay
        if (retries > 1) {
          console.log(`Fetch failed, retrying... ${retries-1} attempts remaining.`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
        
        // Out of retries, throw the error
        throw error;
      }
    };
    
    // Use fetch with retry
    const response = await fetchWithRetry('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form
    });
    
    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
      
      try {
        // Try to parse error as JSON
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = `${errorMessage} - ${errorData.error.message || JSON.stringify(errorData.error)}`;
        }
      } catch (e) {
        // If not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText}`;
          }
        } catch (textError) {
          // Ignore text parsing error
        }
      }
      
      console.error("API Error response:", errorMessage);
      throw new Error(errorMessage);
    }
    
    // Get response text first to inspect it
    const responseText = await response.text();
    console.log("Response text length:", responseText.length);
    
    let result;
    try {
      // Parse the response text as JSON
      result = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("Failed to parse response as JSON:", jsonError);
      console.error("Response text snippet:", responseText.substring(0, 200) + "...");
      throw new Error("Failed to parse API response as JSON");
    }
    
    console.log("Variant generation complete, received results");
    
    // Add some debug info about the response structure
    console.log(`API returned ${result.data?.length || 0} images`);
    if (result.data && result.data.length > 0) {
      const sampleImage = result.data[0];
      console.log(`Sample image has formats: ${Object.keys(sampleImage).join(', ')}`);
    }
    
    // Extract image data and convert to data URLs
    const imageUrls = result.data.map((image: any) => {
      // For gpt-image-1, the response will always contain b64_json
      if (image.b64_json) {
        return `data:image/png;base64,${image.b64_json}`;
      } 
      // For backward compatibility if the API response changes
      else if (image.url) {
        return image.url;
      }
      return "";
    }).filter(Boolean);

    if (imageUrls.length === 0) {
      throw new Error("No image variants were generated");
    }
    
    // Increment the usage counter for successful generations
    await incrementUsageCounter('images')

    return {
      success: true,
      images: imageUrls,
    };
  } catch (error) {
    console.error("Error in generateImageVariants:", error);
    return {
      success: false,
      error: error instanceof Error ? String(error.message) : "Failed to generate image variants",
    };
  }
}

/**
 * Generate images using reference images with the OpenAI GPT-Image-1 model.
 * This function uses the images.edit endpoint which supports multiple reference images
 * and is available for GPT-Image-1.
 * 
 * @param referenceImages Array of base64 image data URLs (up to 4 images)
 * @param aspectRatio The desired aspect ratio for the generated images
 * @param numberOfImages Number of images to generate (default 5, max 10)
 * @param prompt Optional custom prompt (defaults to a general creative prompt)
 */
export async function generateImageVariation(
  referenceImages: string | string[],
  aspectRatio: AspectRatio = "1:1",
  numberOfImages: number = 5,
  prompt: string = "Create a creative variation based on these reference images. Maintain key elements but apply a fresh, professional style suitable for marketing and advertising."
): Promise<{ 
  success: boolean 
  images?: string[] 
  error?: string 
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }
    
    // Check if user has reached the free tier image limit
    const usageCheck = await checkUsageLimit('images')
    if (usageCheck.success && usageCheck.limitReached) {
      return {
        success: false,
        error: "Free plan image generation limit reached. Please upgrade your subscription to continue generating images."
      }
    }

    console.log(`Starting image generation with ${Array.isArray(referenceImages) ? referenceImages.length : 1} reference images using GPT-Image-1`)
    
    // Get the size parameter based on the aspect ratio
    const size = aspectRatios[aspectRatio].size
    
    // Ensure referenceImages is an array
    const imageDataArray = Array.isArray(referenceImages) ? referenceImages : [referenceImages];
    
    // Convert all base64 data URLs to Buffers
    const imageBuffers = imageDataArray.map(dataUrl => {
      try {
        // Extract the base64 part from the data URL
        const base64Data = dataUrl.split(',')[1];
        return Buffer.from(base64Data, 'base64');
      } catch (error) {
        console.error("Error converting data URL to Buffer:", error);
        return null;
      }
    }).filter(Boolean) as Buffer[];
    
    if (imageBuffers.length === 0) {
      throw new Error("No valid reference images provided");
    }

    console.log(`Processed ${imageBuffers.length} reference images`);
    
    // Use node-fetch for making the request directly
    const fetch = (await import('node-fetch')).default;
    
    // Create a FormData instance for proper multipart/form-data encoding
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    
    // Add all parameters to the form data
    form.append('model', 'gpt-image-1');
    form.append('prompt', prompt);
    form.append('n', Math.min(numberOfImages, 10).toString()); // Allow up to 10 images
    form.append('size', size);
    form.append('quality', 'high');
    // Note: response_format is not used for gpt-image-1 as it always returns base64 images

    // Add reference images with the correct format based on whether we have one or multiple
    if (imageBuffers.length === 1) {
      // Single image case - use 'image' parameter
      form.append('image', imageBuffers[0], {
        filename: 'reference-image.png',
        contentType: 'image/png'
      });
    } else {
      // Multiple images case - use array format for each image
      imageBuffers.forEach((buffer, index) => {
        // For multiple images with the images/edits endpoint, we use 'image[]'
        form.append('image[]', buffer, {
          filename: `reference-image-${index + 1}.png`,
          contentType: 'image/png'
        });
      });
    }

    console.log("Sending request to OpenAI API with", imageBuffers.length, "reference images");
    
    try {
      // Make the direct fetch request to the OpenAI API
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: form
      });
      
      if (!response.ok) {
        let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
        
        try {
          // Try to parse error as JSON
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorMessage} - ${errorData.error.message || JSON.stringify(errorData.error)}`;
          }
        } catch (e) {
          // If not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = `${errorMessage} - ${errorText}`;
            }
          } catch (textError) {
            // Ignore text parsing error
          }
        }
        
        console.error("API Error response:", errorMessage);
        throw new Error(errorMessage);
      }
      
      // Get response text first to inspect it
      const responseText = await response.text();
      console.log("Response text length:", responseText.length);
      
      let result;
      try {
        // Parse the response text as JSON
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError);
        console.error("Response text snippet:", responseText.substring(0, 200) + "...");
        throw new Error("Failed to parse API response as JSON");
      }
      
      console.log("Image creation complete, received results");
      
      // Add some debug info about the response structure
      console.log(`API returned ${result.data?.length || 0} images`);
      if (result.data && result.data.length > 0) {
        const sampleImage = result.data[0];
        console.log(`Sample image has formats: ${Object.keys(sampleImage).join(', ')}`);
      }
      
      // Extract image data and convert to data URLs
      const imageUrls = result.data.map((image: any) => {
        // For gpt-image-1, the response will always contain b64_json
        if (image.b64_json) {
          return `data:image/png;base64,${image.b64_json}`;
        } 
        // For backward compatibility if the API response changes
        else if (image.url) {
          return image.url;
        }
        return "";
      }).filter(Boolean);

      if (imageUrls.length === 0) {
        throw new Error("No images were generated");
      }
      
      // Increment the usage counter for successful generations
      await incrementUsageCounter('images')

      return {
        success: true,
        images: imageUrls,
      };
    } catch (error) {
      console.error("Error using OpenAI API:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in generateImageVariation:", error);
    return {
      success: false,
      error: error instanceof Error ? String(error.message) : "Failed to generate images with reference images",
    };
  }
}

export async function inpaintImage(
  prompt: string,
  base64Image: string,
  maskImage: string
): Promise<{
  success: boolean
  image?: string
  error?: string
}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not configured")
    }
    
    // Check if user has reached the free tier inpainting limit
    const usageCheck = await checkUsageLimit('inpainting')
    if (usageCheck.success && usageCheck.limitReached) {
      return {
        success: false,
        error: "Free plan image inpainting limit reached. Please upgrade your subscription to continue using inpainting."
      }
    }

    console.log("Starting inpainting with prompt:", prompt)

    // Verify we have valid data URLs
    if (!base64Image.startsWith('data:image/')) {
      throw new Error("Invalid image format: must be a data URL")
    }
    if (!maskImage.startsWith('data:image/')) {
      throw new Error("Invalid mask format: must be a data URL")
    }

    // The safer way is to upload these images first, then use the URLs
    try {
      // Create the prediction with the full prediction API
      const prediction = await replicate.predictions.create({
        version: "ideogram-ai/ideogram-v2",
        input: {
          prompt: prompt,
          image: base64Image,
          mask: maskImage,
          negative_prompt: "low quality, bad anatomy, blurry, pixelated",
          style_type: "General"
        },
      });

      console.log("Prediction ID:", prediction.id);
      
      // Poll for the prediction result
      let completedPrediction = prediction;
      let attempts = 0;
      const maxAttempts = 30; // Stop after 30 attempts (30 seconds)
      
      while (attempts < maxAttempts) {
        // Get the latest prediction
        completedPrediction = await replicate.predictions.get(prediction.id);
        console.log(`Polling attempt ${attempts + 1}/${maxAttempts}: ${completedPrediction.status}`);

        if (completedPrediction.status === "succeeded") {
          break;
        } else if (completedPrediction.status === "failed" || completedPrediction.status === "canceled") {
          throw new Error(`Prediction failed with status: ${completedPrediction.status}`);
        }

        // Wait before the next polling attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error("Prediction timed out after 30 seconds");
      }

      // Process the output
      console.log("Prediction succeeded with output:", completedPrediction.output);
      
      const output = completedPrediction.output;
      
      // Handle different output formats
      let imageUrl: string | null = null;
      
      if (typeof output === "string") {
        imageUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      }

      if (!imageUrl) {
        throw new Error("No image URL in prediction output");
      }
      
      // Increment the usage counter for successful inpainting
      await incrementUsageCounter('inpainting')

      return {
        success: true,
        image: imageUrl,
      };
    } catch (apiError: any) {
      console.error("API Error details:", apiError);
      
      // Extract more detailed error message if available
      let errorMessage = "Unknown API error";
      
      if (apiError.message) {
        errorMessage = apiError.message;
      } else if (apiError.response && apiError.response.data) {
        errorMessage = JSON.stringify(apiError.response.data);
      }
      
      throw new Error(`API Error: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Error in inpaintImage:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Inpainting failed",
    };
  }
}