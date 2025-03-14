// app/api/video-status/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createReplicateClient } from "@/lib/replicate-client"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// This route checks the status of a video generation by prediction ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const predictionId = params.id
    
    if (!predictionId) {
      return NextResponse.json({ 
        success: false,
        error: "Missing prediction ID" 
      }, { status: 400 })
    }
    
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set in your environment.")
    }

    const replicate = createReplicateClient(process.env.REPLICATE_API_TOKEN)
    
    // Get the prediction status
    const prediction = await replicate.predictions.get(predictionId)
    
    console.log(`Checking prediction ${predictionId}. Current status: ${prediction.status}`)

    if (prediction.status === "failed") {
      return NextResponse.json({
        success: false,
        status: "failed",
        error: prediction.error || "Prediction failed",
      })
    }

    if (prediction.status === "succeeded") {
      // Extract video URL from the output
      let videoUrl
      if (Array.isArray(prediction.output)) {
        videoUrl = prediction.output[0]
      } else {
        videoUrl = prediction.output
      }

      if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error(`Invalid video URL in output: ${JSON.stringify(prediction.output)}`)
      }

      return NextResponse.json({
        success: true,
        status: "succeeded",
        videoUrl
      })
    }

    // If still processing
    return NextResponse.json({
      success: true,
      status: prediction.status,
      progress: prediction.logs || "",
      estimatedCompletionTime: prediction.metrics?.predict_time // May or may not exist
    })

  } catch (err: any) {
    console.error(`Error checking video status for prediction:`, err)
    return NextResponse.json({ 
      success: false,
      error: err.message || "Failed to check video generation status." 
    }, { status: 500 })
  }
}