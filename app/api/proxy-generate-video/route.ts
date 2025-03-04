// app/api/proxy-generate-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Configure longer timeout for this API route
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

// Define interface for input based on the model schema
interface VideoGenerationInput {
  prompt: string;
  duration?: number;
  cfg_scale?: number;
  start_image?: string;
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  negative_prompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, duration, startImageDataUrl, aspectRatio = "16:9" } = body;

    // Ensure REPLICATE_API_TOKEN is set
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN is not set in your environment.");
      return NextResponse.json(
        { error: "API configuration error", success: false },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });

    // Build input object with correct typing
    const input: VideoGenerationInput = {
      prompt,
      duration: Number(duration),
      cfg_scale: 0.5,
      aspect_ratio: aspectRatio as "16:9" | "9:16" | "1:1"
    };

    // Add start image if provided
    if (startImageDataUrl) {
      input.start_image = startImageDataUrl;
    }

    console.log("Calling Replicate API with prompt:", prompt);
    console.log("Using aspect ratio:", aspectRatio);
    console.log("Duration:", duration);
    
    // Use the run method according to the documentation example
    const output = await replicate.run("kwaivgi/kling-v1.6-standard", { input });
    
    console.log("Replicate API response type:", typeof output);
    
    // From the schema, output should be a string URL
    if (!output) {
      console.error("Replicate returned null or undefined output");
      return NextResponse.json(
        { error: "No output returned from video generation API", success: false },
        { status: 500 }
      );
    }
    
    // Handle string output (expected according to the schema)
    if (typeof output === 'string') {
      return NextResponse.json({
        success: true,
        videoUrl: output
      });
    } 
    
    // If output is not a string (unlikely based on the schema but handling just in case)
    console.error("Unexpected output format:", output);
    return NextResponse.json({
      error: "Unexpected response format from video generation API",
      success: false,
      debug: { output, outputType: typeof output }
    }, { status: 500 });
    
  } catch (error: any) {
    console.error("Error generating video with replicate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate video", success: false },
      { status: 500 }
    );
  }
}