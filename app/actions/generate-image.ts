"use server";

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN as string,
});

// Available aspect ratios with their corresponding dimensions
const aspectRatios = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
  "3:4": { width: 896, height: 1152 },
  "4:3": { width: 1152, height: 896 },
  "2:3": { width: 832, height: 1216 },
  "3:2": { width: 1216, height: 832 },
};

// Export the AspectRatio type so it can be imported in the client component
export type AspectRatio = keyof typeof aspectRatios;

/**
 * Generate multiple images in parallel using the 'ideogram-ai/ideogram-v2-turbo' model.
 * This function accepts a text prompt and an aspect ratio, returning up to 4 generated images.
 */
export async function generateImages(
  prompt: string,
  additionalPrompt: string,
  aspectRatio: AspectRatio = "1:1",
  numberOfImages: number = 4
): Promise<{ 
  success: boolean;
  images?: string[];
  error?: string;
}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not configured");
    }

    // Generate 4 separate predictions in parallel for better performance
    const predictions = await Promise.all([
      replicate.run("black-forest-labs/flux-1.1-pro", {
        input: {
          prompt: `${prompt}. Also follow these instructions: ${additionalPrompt}`,
          num_outputs: 1,
          prompt_upsampling: true,
          aspect_ratio: "1:1",
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      }),
      replicate.run("black-forest-labs/flux-1.1-pro", {
        input: {
          prompt,
          num_outputs: 1,
          prompt_upsampling: true,
          aspect_ratio: "1:1",
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      }),
      replicate.run("black-forest-labs/flux-1.1-pro", {
        input: {
          prompt,
          num_outputs: 1,
          prompt_upsampling: true,
          aspect_ratio: "1:1",
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      }),
      replicate.run("black-forest-labs/flux-1.1-pro", {
        input: {
          prompt,
          num_outputs: 1,
          prompt_upsampling: true,
          aspect_ratio: "1:1",
          guidance_scale: 7.5,
          num_inference_steps: 50,
        },
      }),
    ]);

    // Generate predictions in parallel (up to the requested number)
    const predictionPromises = Array(Math.min(numberOfImages, 4))
      .fill(null)
      .map(() =>
        replicate.run("ideogram-ai/ideogram-v2-turbo", {
          input: {
            prompt,
            aspect_ratio: aspectRatio,
            negative_prompt: "low quality, bad anatomy, blurry, pixelated",
          },
        })
      );

    const additionalPredictions = await Promise.all(predictionPromises);

    // Combine all predictions
    const allPredictions = [...predictions, ...additionalPredictions];

    // Flatten the array of results and ensure they're strings
    const imageUrls = allPredictions.flat().filter(Boolean).map(String);

    if (imageUrls.length === 0) {
      throw new Error("No images were generated");
    }

    return {
      success: true,
      images: imageUrls,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate images",
    };
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
  success: boolean;
  image?: string;
  error?: string;
}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not configured");
    }

    // Verify we have valid data URLs
    if (!base64Image.startsWith("data:image/")) {
      throw new Error("Invalid image format: must be a data URL");
    }
    if (!maskImage.startsWith("data:image/")) {
      throw new Error("Invalid mask format: must be a data URL");
    }

    // Create the prediction with the full prediction API
    const prediction = await replicate.predictions.create({
      version: "ideogram-ai/ideogram-v2",
      input: {
        prompt,
        image: base64Image,
        mask: maskImage,
        aspect_ratio: aspectRatio,
        negative_prompt: "low quality, bad anatomy, blurry, pixelated",
        style_type: "General",
      },
    });

    // Poll for the prediction result
    let completedPrediction = prediction;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      completedPrediction = await replicate.predictions.get(prediction.id);

      if (completedPrediction.status === "succeeded") {
        break;
      } else if (
        completedPrediction.status === "failed" ||
        completedPrediction.status === "canceled"
      ) {
        throw new Error(`Prediction failed with status: ${completedPrediction.status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Prediction timed out after 30 seconds");
    }

    const output = completedPrediction.output;
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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Inpainting failed",
    };
  }
}
