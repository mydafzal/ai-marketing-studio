// app/api/replicate-webhook/route.ts
import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export const runtime = 'nodejs'

interface WebhookPayload {
  id: string
  status: string
  created_at: string
  completed_at?: string
  output?: string | string[]
  error?: string
  logs?: string
  metrics?: {
    predict_time?: number
  }
}

// Function to save prediction data to KV database
async function savePredictionResult(id: string, data: WebhookPayload): Promise<void> {
  try {
    // Use KV to store the data with a 24-hour expiration
    const key = `video:${id}`
    await kv.set(key, JSON.stringify(data), { ex: 60 * 60 * 24 })
    console.log(`Stored result for prediction ${id} in KV database`)
  } catch (error) {
    console.error("Error storing prediction result in KV:", error)
  }
}

export async function POST(req: Request) {
  try {
    // Extract the webhook payload
    const data: WebhookPayload = await req.json()
    console.log("Received webhook for prediction:", data.id, "status:", data.status)
    
    // Validate payload
    if (!data || !data.id) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }
    
    // Process the completed prediction
    if (data.status === "succeeded") {
      console.log(`Prediction ${data.id} completed successfully`)
      
      // Extract the video URL from output
      let videoUrl
      if (Array.isArray(data.output) && data.output.length > 0) {
        videoUrl = data.output[0]
      } else if (typeof data.output === 'string') {
        videoUrl = data.output
      }
      
      if (!videoUrl) {
        console.error(`No valid output URL for prediction ${data.id}`)
        return NextResponse.json({ error: "No valid output URL" }, { status: 400 })
      }
      
      // Save the result to KV database
      await savePredictionResult(data.id, data)
      
      return NextResponse.json({ success: true })
    } 
    
    // Handle failed predictions
    else if (data.status === "failed") {
      console.error(`Prediction ${data.id} failed:`, data.error)
      
      // Save the failed state to KV database
      await savePredictionResult(data.id, data)
      
      return NextResponse.json({ success: false, error: data.error })
    }
    
    // For other statuses, just acknowledge receipt
    return NextResponse.json({ success: true, status: data.status })
    
  } catch (err: any) {
    console.error("Error processing webhook:", err)
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Failed to process webhook" 
    }, { status: 500 })
  }
}