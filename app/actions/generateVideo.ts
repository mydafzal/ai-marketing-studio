"use server"
import 'server-only'
import Replicate from 'replicate'
import { readFile } from 'node:fs/promises'

interface GenerateVideoOptions {
  prompt: string
  duration: number
  startImageDataUrl?: string
}

export async function generateVideo({
  prompt,
  duration,
  startImageDataUrl,
}: GenerateVideoOptions): Promise<string> {
  // Ensure REPLICATE_API_TOKEN is set
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set in your environment.")
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN
  })

  const input: Record<string, any> = {
    prompt,
    duration, // 5 or 10
    cfg_scale: 0.5, // or whatever default
    aspect_ratio: "16:9"
  }

  if (startImageDataUrl) {
    // This is the user-uploaded data URL
    input.start_image = startImageDataUrl
  }

  try {
    // This calls the replicate model
    const output = await replicate.run("kwaivgi/kling-v1.6-standard", {
      input
    })
    // The model returns the mp4 as a direct result (string) or array? 
    // Often it's a URL to the .mp4
    if (!output) {
      throw new Error("No output returned from replicate.")
    }

    // Some models return an array with one or multiple outputs. 
    // We'll assume here it's a single string (URL to the video).
    const videoUrl = Array.isArray(output) ? output[0] : output
    if (typeof videoUrl !== 'string') {
      throw new Error("Video output is not a string URL.")
    }

    return videoUrl
  } catch (err) {
    console.error("Error generating video with replicate:", err)
    throw err
  }
}