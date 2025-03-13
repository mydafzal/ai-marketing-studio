// app/api/video-status/[id]/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60 // Set status check timeout to 60 seconds

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const predictionId = params.id
    
    if (!predictionId) {
      return NextResponse.json({ error: "Missing prediction ID" }, { status: 400 })
    }
    
    // Check with Replicate API directly
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({
        success: false,
        status: "processing", // Default to processing if we can't check
        message: "API token not configured, status unknown",
        predictionId
      })
    }
    
    try {
      console.log(`Checking prediction status directly from Replicate API for ID: ${predictionId}`)
      
      // Get the current timestamp and the startedAt timestamp from query params
      const currentTimestamp = new Date().getTime()
      const startingTimestampParam = new URL(request.url).searchParams.get('startedAt')
      
      // Get the prediction details from Replicate API
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Replicate API error: ${JSON.stringify(errorData)}`)
      }

      const prediction = await response.json()
      console.log(`Received prediction status: ${prediction.status} for ID: ${predictionId}`)
      
      // Check if we should cancel based on elapsed time and state
      if (startingTimestampParam) {
        const startingTimestamp = parseInt(startingTimestampParam)
        const elapsedTimeInSeconds = (currentTimestamp - startingTimestamp) / 1000
        
        // Different timeout for different states
        // - "starting" state: cancel after 2 minutes
        // - "processing" state: allow up to 10 minutes
        const isStarting = prediction.status === "starting"
        const maxWaitTime = isStarting ? 120 : 600 // 2 min for starting, 10 min for processing
        
        if (elapsedTimeInSeconds > maxWaitTime) {
          console.log(`Prediction ${predictionId} has been in ${prediction.status} state for ${elapsedTimeInSeconds.toFixed(0)} seconds, attempting to cancel`)
          
          try {
            // Try to cancel the stuck prediction
            const cancelResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}/cancel`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json"
              }
            })
            
            if (cancelResponse.ok) {
              console.log(`Successfully cancelled stuck prediction ${predictionId}`)
              return NextResponse.json({
                success: false,
                status: "failed",
                error: `Prediction was stuck in ${prediction.status} state for ${elapsedTimeInSeconds.toFixed(0)} seconds and was cancelled. Please try again.`,
                predictionId
              })
            }
          } catch (cancelError) {
            console.error("Error cancelling stuck prediction:", cancelError)
          }
        }
      }
      
      // Format the response based on prediction status
      if (prediction.status === "succeeded") {
        let videoUrl
        if (Array.isArray(prediction.output) && prediction.output.length > 0) {
          videoUrl = prediction.output[0]
        } else if (typeof prediction.output === 'string') {
          videoUrl = prediction.output
        }
        
        if (videoUrl) {
          console.log(`Video URL found: ${videoUrl}`)
          return NextResponse.json({
            success: true,
            status: "completed",
            videoUrl,
            predictionId
          })
        } else {
          console.error("No video URL in successful prediction")
          return NextResponse.json({
            success: false,
            status: "failed",
            error: "No video URL in output",
            predictionId
          })
        }
      } else if (prediction.status === "failed") {
        return NextResponse.json({
          success: false,
          status: "failed",
          error: prediction.error || "Video generation failed",
          predictionId
        })
      } else {
        // Still processing (starting or processing)
        return NextResponse.json({
          success: true,
          status: prediction.status,
          predictionId
        })
      }
    } catch (replicateError) {
      console.error("Error checking with Replicate API:", replicateError)
      
      // If Replicate check fails, return a processing status to continue polling
      return NextResponse.json({
        success: true,
        status: "processing", // Default to processing to continue polling
        message: "Could not check Replicate status, please continue polling",
        predictionId
      })
    }
    
  } catch (err: any) {
    console.error("Error fetching video status:", err)
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Failed to get video status" 
    }, { status: 500 })
  }
}