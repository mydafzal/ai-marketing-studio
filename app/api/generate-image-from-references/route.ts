// app/api/generate-image-from-references/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// This endpoint will be used to generate images based on reference images using OpenAI's API
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: "OPENAI_API_KEY is not configured" 
      }, { status: 500 })
    }
    
    // Get form data from the request
    const formData = await req.formData()
    
    // Extract parameters
    const prompt = formData.get('prompt') as string
    const aspectRatio = formData.get('aspectRatio') as string || '1:1'
    const numberOfImages = parseInt(formData.get('numberOfImages') as string || '4', 10)
    
    // Convert aspectRatio to dimensions
    let size: string
    switch(aspectRatio) {
      case "16:9": size = "1536x1024"; break;
      case "9:16": size = "1024x1536"; break;
      case "4:3": size = "1536x1024"; break;
      case "3:4": size = "1024x1536"; break;
      case "2:3": size = "1024x1536"; break;
      case "3:2": size = "1536x1024"; break;
      default: size = "1024x1024"; // 1:1 as default
    }
    
    // Get all reference images from form data
    const referenceImages: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('referenceImage') && value instanceof File) {
        referenceImages.push(value)
      }
    }
    
    if (referenceImages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No reference images provided" 
      }, { status: 400 })
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    console.log(`Starting image generation with prompt: "${prompt}"`)
    console.log(`Using ${referenceImages.length} reference images and aspect ratio: ${aspectRatio}`)
    
    try {
      // Create a request to OpenAI's image edit API
      const result = await openai.images.edit({
        model: "gpt-image-1",
        image: referenceImages[0], // Use the first image as the base
        prompt: prompt,
        n: Math.min(numberOfImages, 10), // Limit to 10 maximum
        size: size as any
      } as any)
      
      console.log("Generation complete, received results")
      
      // Extract image URLs
      const imageUrls = result.data.map(image => {
        if (image.b64_json) {
          return `data:image/png;base64,${image.b64_json}`
        } else if (image.url) {
          return image.url
        }
        return ""
      }).filter(Boolean)
      
      if (imageUrls.length === 0) {
        throw new Error("No images were generated")
      }
      
      return NextResponse.json({
        success: true,
        images: imageUrls
      })
      
    } catch (apiError: any) {
      console.error("API Error:", apiError)
      
      return NextResponse.json({ 
        success: false, 
        error: apiError.message || "OpenAI API error"
      }, { status: 500 })
    }
    
  } catch (err: any) {
    console.error("Error generating images from references:", err)
    
    return NextResponse.json({ 
      success: false,
      error: err.message || "Failed to generate images from references"
    }, { status: 500 })
  }
}