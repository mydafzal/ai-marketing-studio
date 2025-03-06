// app/api/generate-video/route.ts
import { NextResponse } from 'next/server'
import { createReplicateClient } from "@/lib/replicate-client"

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set in your environment.")
    }

    const { prompt, duration, startImageDataUrl } = await req.json() || {}

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const replicate = createReplicateClient(process.env.REPLICATE_API_TOKEN)

    // Create prediction with proper input structure
    const prediction = await replicate.predictions.create({
      model: "kwaivgi/kling-v1.6-standard",
      input: {
        prompt,
        duration: duration || 5,
        start_image: startImageDataUrl,
        cfg_scale: 0.5,
        aspect_ratio: "16:9"
      },
    })

    console.log("Initial prediction:", prediction)

    // Poll for completion
    let finalPrediction = prediction
    while (
      finalPrediction.status !== "succeeded" && 
      finalPrediction.status !== "failed"
    ) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      finalPrediction = await replicate.predictions.get(prediction.id)
      console.log("Polling prediction status:", finalPrediction.status)
    }

    console.log("Final prediction:", finalPrediction)

    if (finalPrediction.status === "failed") {
      throw new Error(`Prediction failed: ${finalPrediction.error || "Unknown error"}`)
    }

    if (!finalPrediction.output) {
      throw new Error("No output returned from prediction")
    }

    // Log the output structure to understand what we're receiving
    console.log("Prediction output type:", typeof finalPrediction.output)
    console.log("Prediction output value:", finalPrediction.output)

    // Extract video URL from the output
    let videoUrl
    if (Array.isArray(finalPrediction.output)) {
      videoUrl = finalPrediction.output[0]
    } else {
      videoUrl = finalPrediction.output
    }

    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error(`Invalid video URL in output: ${JSON.stringify(finalPrediction.output)}`)
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      predictionId: prediction.id // Including this for debugging
    })

  } catch (err: any) {
    console.error("Error in /api/generate-video route:", err)
    return NextResponse.json({ 
      success: false,
      error: err.message || "Failed to generate video.",
      details: err // Including full error details for debugging
    }, { status: 500 })
  }
}