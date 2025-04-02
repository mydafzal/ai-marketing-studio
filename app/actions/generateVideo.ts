"use server"
import 'server-only'
import Replicate from 'replicate'
import { createReplicateClient } from "@/lib/replicate-client"

interface GenerateVideoOptions {
  prompt: string
  duration: number
  startImageDataUrl?: string
  aspectRatio?: "16:9" | "9:16" | "1:1"
}

/**
 * Starts a video generation job and returns a prediction ID for polling
 */
export async function startVideoGeneration({
  prompt,
  duration,
  startImageDataUrl,
  aspectRatio = "16:9",
}: GenerateVideoOptions): Promise<{ success: boolean; predictionId: string; status: string }> {
  // Ensure REPLICATE_API_TOKEN is set
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set in your environment.")
  }

  const replicate = createReplicateClient(process.env.REPLICATE_API_TOKEN)

  const input: Record<string, any> = {
    prompt,
    duration: duration || 5, // 5 or 10
    cfg_scale: 0.5,
    aspect_ratio: aspectRatio
  }

  if (startImageDataUrl) {
    input.start_image = startImageDataUrl
  }

  try {
    console.log(`[VIDEO_GEN] Starting video generation with prompt: "${prompt}" and duration: ${duration}s`)
    console.log(`[VIDEO_GEN] Using Replicate model: kwaivgi/kling-v1.6-standard`)
    console.log(`[VIDEO_GEN] Input configuration:`, JSON.stringify({
      prompt,
      duration,
      aspectRatio,
      hasStartImage: !!startImageDataUrl,
      cfgScale: input.cfg_scale
    }))
    
    // Create prediction without waiting for completion
    const prediction = await replicate.predictions.create({
      model: "kwaivgi/kling-v1.6-standard",
      input
    })

    console.log(`[VIDEO_GEN] Prediction created with ID: ${prediction.id}`)
    console.log(`[VIDEO_GEN] Initial prediction state: ${prediction.status}`)
    console.log(`[VIDEO_GEN] Creation timestamp: ${new Date().toISOString()}`)

    return {
      success: true,
      status: 'processing',
      predictionId: prediction.id
    }
  } catch (err) {
    console.error("[VIDEO_GEN] Error initiating video generation:", err)
    throw err
  }
}

/**
 * Checks the status of a video generation by prediction ID
 */
export async function checkVideoStatus(predictionId: string): Promise<{
  success: boolean;
  status: string;
  videoUrl?: string;
  error?: string;
  details?: any;
}> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set in your environment.")
  }

  const replicate = createReplicateClient(process.env.REPLICATE_API_TOKEN)
  
  try {
    console.log(`[VIDEO_STATUS] Checking prediction ${predictionId} at ${new Date().toISOString()}`)
    
    // Get the prediction status
    const prediction = await replicate.predictions.get(predictionId)
    
    console.log(`[VIDEO_STATUS] Prediction ${predictionId} status: ${prediction.status}`)
    console.log(`[VIDEO_STATUS] Created at: ${prediction.created_at || 'unknown'}`)
    console.log(`[VIDEO_STATUS] Started at: ${prediction.started_at || 'not started yet'}`)
    console.log(`[VIDEO_STATUS] Completed at: ${prediction.completed_at || 'not completed yet'}`)
    
    if (prediction.error) {
      console.error(`[VIDEO_STATUS] Prediction error:`, prediction.error)
    }
    
    if (prediction.logs) {
      console.log(`[VIDEO_STATUS] Prediction logs:`, prediction.logs.substring(0, 200) + '...')
    }
    
    // Include additional details for debugging
    const details = {
      id: prediction.id,
      status: prediction.status,
      created_at: prediction.created_at,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
      error: prediction.error,
      hasOutput: !!prediction.output,
      outputType: prediction.output ? typeof prediction.output : null,
      isOutputArray: prediction.output ? Array.isArray(prediction.output) : null
    }
    
    if (prediction.status === "failed") {
      console.error(`[VIDEO_STATUS] Prediction failed:`, prediction.error || "Unknown error")
      return {
        success: false,
        status: "failed",
        error: prediction.error?.toString() || "Prediction failed",
        details
      }
    }

    if (prediction.status === "succeeded") {
      console.log(`[VIDEO_STATUS] Prediction succeeded!`)
      
      // Extract video URL from the output
      let videoUrl
      
      if (Array.isArray(prediction.output)) {
        videoUrl = prediction.output[0]
        console.log(`[VIDEO_STATUS] Output is array, using first element as URL:`, videoUrl)
      } else {
        videoUrl = prediction.output
        console.log(`[VIDEO_STATUS] Output is direct URL:`, videoUrl)
      }

      if (!videoUrl || typeof videoUrl !== 'string') {
        console.error(`[VIDEO_STATUS] Invalid video URL:`, prediction.output)
        throw new Error(`Invalid video URL in output: ${JSON.stringify(prediction.output)}`)
      }

      return {
        success: true,
        status: "succeeded",
        videoUrl,
        details
      }
    }

    // If still processing
    console.log(`[VIDEO_STATUS] Prediction still processing: ${prediction.status}`)
    return {
      success: true,
      status: prediction.status,
      details
    }
  } catch (err) {
    console.error(`[VIDEO_STATUS] Error checking status for prediction ${predictionId}:`, err)
    throw err
  }
}