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
    const entries = Array.from(formData.entries())
    for (const [key, value] of entries) {
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
      // Enhanced prompt that references the uploaded images
      const enhancedPrompt = `${prompt}
Create an image inspired by these ${referenceImages.length} reference images. 
Combine elements, styles, colors, and compositions from all provided reference images.`

      // For gpt-image-1, we need to use the images.generate API with references
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: enhancedPrompt,
        n: Math.min(numberOfImages, 10), // Generate up to 10 images
        size: size as any, // Pass the size based on aspect ratio
        quality: "hd" as any, // Use higher quality
        style: "natural" as any, // Use natural style for better reference image incorporation
        // API accepts multiple reference images, which is new functionality
        // This may only be working with their latest APIs (as of April 2025)
        // In the 2023-2024 API versions, this parameter might not be accepted
        // and may be sent formatted differently based on the API version
        // This example assumes the latest API is being used
        "reference_images": referenceImages as any
      } as any)
      
      console.log("Generation complete, received results")
      
      // Extract image URLs from the response
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
      
      // Fall back to using just the first image if the multi-reference approach failed
      try {
        console.log("Falling back to single reference image approach")
        
        const result = await openai.images.edit({
          model: "gpt-image-1",
          image: referenceImages[0], // Use the first image as the base
          prompt: `${prompt}\nCreate an image inspired by this reference image. Incorporate elements, style, and composition.`,
          n: Math.min(numberOfImages, 10),
          size: size as any
        } as any)
        
        const imageUrls = result.data.map(image => {
          if (image.b64_json) {
            return `data:image/png;base64,${image.b64_json}`
          } else if (image.url) {
            return image.url
          }
          return ""
        }).filter(Boolean)
        
        if (imageUrls.length === 0) {
          throw new Error("No images were generated in fallback mode")
        }
        
        return NextResponse.json({
          success: true,
          images: imageUrls,
          note: "Used fallback mode with single reference image"
        })
      } catch (fallbackError: any) {
        console.error("Fallback approach also failed:", fallbackError)
        return NextResponse.json({ 
          success: false, 
          error: `OpenAI API error: ${apiError.message}. Fallback also failed: ${fallbackError.message}`,
          details: {
            originalError: apiError.message,
            fallbackError: fallbackError.message
          }
        }, { status: 500 })
      }
    }
    
  } catch (err: any) {
    console.error("Error generating images from references:", err)
    
    return NextResponse.json({ 
      success: false,
      error: err.message || "Failed to generate images from references"
    }, { status: 500 })
  }
}