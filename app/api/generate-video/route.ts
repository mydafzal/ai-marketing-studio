// app/api/generate-video/route.ts
import { NextResponse } from 'next/server'
import { createReplicateClient } from "@/lib/replicate-client"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// This route initiates a video generation and returns a prediction ID for polling
export async function POST(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set in your environment.")
    }

    const { prompt, duration, startImageDataUrl, aspectRatio = "16:9", negative_prompt } = await req.json() || {}

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const replicate = createReplicateClient(process.env.REPLICATE_API_TOKEN)

    // Create input object based on available parameters
    const input: Record<string, any> = {
      prompt,
      duration: duration || 5,
      cfg_scale: 0.5,
      aspect_ratio: aspectRatio
    }

    // Only add optional parameters if they exist
    if (startImageDataUrl) {
      input.start_image = startImageDataUrl
    }
    
    if (negative_prompt) {
      input.negative_prompt = negative_prompt
    }

    console.log(`Starting video generation with prompt: "${prompt}" and duration: ${duration}s`)
    
    // Create prediction without waiting for completion
    const prediction = await replicate.predictions.create({
      model: "kwaivgi/kling-v1.6-standard",
      input
    })

    console.log(`Prediction created with ID: ${prediction.id}`)

    return NextResponse.json({
      success: true,
      status: 'processing',
      predictionId: prediction.id
    })

  } catch (err: any) {
    console.error("Error initiating video generation:", err)
    return NextResponse.json({ 
      success: false,
      error: err.message || "Failed to start video generation.",
    }, { status: 500 })
  }
}