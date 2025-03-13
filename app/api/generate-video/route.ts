// app/api/generate-video/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 480 // Set to 8 minutes (480 seconds)

export async function POST(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not set in your environment.")
    }
    
    // Test the API token with a simple account API call
    try {
      console.log("Testing Replicate API token with account API...")
      const accountResponse = await fetch("https://api.replicate.com/v1/account", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`
        }
      })
      
      if (!accountResponse.ok) {
        const errorData = await accountResponse.json()
        console.error("Error with Replicate API token:", errorData)
        throw new Error(`Invalid Replicate API token: ${JSON.stringify(errorData)}`)
      }
      
      const accountData = await accountResponse.json()
      console.log(`Replicate API token valid for user: ${accountData.username}`)
    } catch (tokenError) {
      console.error("Error verifying Replicate API token:", tokenError)
      throw new Error("Could not verify Replicate API token. Please check your credentials.")
    }

    // Parse request body safely with proper error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid JSON in request body" 
      }, { status: 400 });
    }
    
    // Destructure with defaults in case values are missing
    const { 
      prompt = "", 
      duration = 5, 
      startImageDataUrl = null, 
      aspectRatio = "16:9" 
    } = requestBody || {};

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }
    
    if (!startImageDataUrl) {
      return NextResponse.json({ error: "Missing starting image" }, { status: 400 })
    }

    // Log the aspect ratio to debug
    console.log(`Using aspect ratio: ${aspectRatio} for video generation`)
    console.log(`Starting direct HTTP call to Replicate API for prompt: "${prompt.substring(0, 30)}..."`)

    // Create the input JSON
    // Based on the API error, the model expects the exact aspect ratio strings:
    // Valid values are: "16:9", "9:16", "1:1"
    const validAspectRatios = ["16:9", "9:16", "1:1"];
    const modelAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "16:9";
    
    console.log(`Using validated aspect ratio value for API: "${modelAspectRatio}"`);
    
    const input = {
      input: {
        prompt,
        duration,
        start_image: startImageDataUrl,
        cfg_scale: 0.5,
        aspect_ratio: modelAspectRatio // Pass the exact string value the API expects
      }
    }

    // Try running with the Prefer: wait=30 header first (synchronous with 30 second timeout)
    try {
      console.log("Making synchronous request to Replicate API with 30 second timeout...")
      
      const response = await fetch("https://api.replicate.com/v1/models/kwaivgi/kling-v1.6-standard/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          "Prefer": "wait=30" // This header tells Replicate to wait for completion with a 30 second timeout
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Synchronous request failed with status:", response.status, errorData)
        throw new Error(`Replicate API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      console.log("Response received from synchronous request:", data)
      
      if (data.status === "succeeded") {
        console.log("Prediction completed successfully with status:", data.status)
        
        // Extract the video URL directly from the output
        let videoUrl = null
        if (data.output) {
          videoUrl = Array.isArray(data.output) ? data.output[0] : data.output
        }

        if (videoUrl) {
          return NextResponse.json({
            success: true,
            videoUrl: videoUrl,
            predictionId: data.id,
            status: "completed"
          })
        } else {
          throw new Error("No video URL in the output")
        }
      } else {
        // If not succeeded, fall back to async mode
        console.log("Synchronous request did not complete within timeout, falling back to async")
        throw new Error("Prediction not complete within timeout")
      }
    } catch (syncError) {
      console.error("Synchronous request failed, falling back to async:", syncError)
      
      // If the synchronous request fails or times out, fall back to the async approach
      console.log("Creating async prediction...")
      const response = await fetch("https://api.replicate.com/v1/models/kwaivgi/kling-v1.6-standard/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Async request failed with status:", response.status, errorData)
        throw new Error(`Replicate API error: ${JSON.stringify(errorData)}`)
      }

      const prediction = await response.json()
      console.log("Created async prediction with ID:", prediction.id, "Status:", prediction.status)

      // Return the prediction ID for client-side polling
      return NextResponse.json({
        success: true,
        predictionId: prediction.id,
        status: prediction.status
      })
    }
  } catch (err: any) {
    console.error("Error in /api/generate-video route:", err)
    return NextResponse.json({ 
      success: false,
      error: err.message || "Failed to generate video.",
      details: err.toString()
    }, { status: 500 })
  }
}