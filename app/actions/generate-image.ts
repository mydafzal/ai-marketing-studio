"use server"

import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN as string,
})

// Available aspect ratios with their corresponding dimensions
const aspectRatios = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
  "3:4": { width: 896, height: 1152 },
  "4:3": { width: 1152, height: 896 },
  "2:3": { width: 832, height: 1216 },
  "3:2": { width: 1216, height: 832 }
};

type AspectRatio = keyof typeof aspectRatios;

/**
 * Generate multiple images in parallel using the 'ideogram-ai/ideogram-v2-turbo' model.
 * This function accepts a text prompt and an aspect ratio, returning up to 4 generated images.
 */
export async function generateImages(
  prompt: string,
  aspectRatio: AspectRatio = "1:1",
  numberOfImages: number = 4
): Promise<{ 
  success: boolean 
  images?: string[] 
  error?: string 
}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not configured")
    }

    console.log(`Starting image generation with prompt: "${prompt}" and aspect ratio: ${aspectRatio}`)
    
    // Get dimensions for the selected aspect ratio
    const dimensions = aspectRatios[aspectRatio] || aspectRatios["1:1"];
    
    // Generate predictions in parallel (up to the requested number)
    const predictionPromises = Array(Math.min(numberOfImages, 4)).fill(null).map(() => 
      replicate.run("ideogram-ai/ideogram-v2-turbo", {
        input: {
          prompt: prompt,
          width: dimensions.width,
          height: dimensions.height,
          negative_prompt: "low quality, bad anatomy, blurry, pixelated"
        },
      })
    );

    const predictions = await Promise.all(predictionPromises);
    console.log("Generation outputs:", predictions)

    // Flatten the array of results and ensure they're strings
    const imageUrls = predictions
      .flat()
      .filter(Boolean)
      .map((url) => String(url));

    if (imageUrls.length === 0) {
      throw new Error("No images were generated")
    }

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
export async function inpaintImage(
  prompt: string,
  base64Image: string,
  maskImage: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<{
  success: boolean
  image?: string
  error?: string
}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not configured")
    }

    console.log(`Starting inpainting with prompt: "${prompt}" and aspect ratio: ${aspectRatio}`)

    // Verify we have valid data URLs
    if (!base64Image.startsWith('data:image/')) {
      throw new Error("Invalid image format: must be a data URL")
    }
    if (!maskImage.startsWith('data:image/')) {
      throw new Error("Invalid mask format: must be a data URL")
    }

    // Get dimensions for the selected aspect ratio
    const dimensions = aspectRatios[aspectRatio] || aspectRatios["1:1"];

    try {
      // Create the prediction with the full prediction API
      const prediction = await replicate.predictions.create({
        version: "ideogram-ai/ideogram-v2",
        input: {
          prompt: prompt,
          image: base64Image,
          mask: maskImage,
          negative_prompt: "low quality, bad anatomy, blurry, pixelated",
          style_type: "General",
          width: dimensions.width,
          height: dimensions.height
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