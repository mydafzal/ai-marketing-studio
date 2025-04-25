// app/api/generate-images-with-variation/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// This endpoint creates a series of images by creating variations of each reference image
// and merges the results to provide a diverse set based on multiple references
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
    const numberOfImages = parseInt(formData.get('numberOfImages') as string || '10', 10)
    
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
    
    console.log(`Starting multi-image variation generation with prompt: "${prompt}"`)
    console.log(`Using ${referenceImages.length} reference images and aspect ratio: ${aspectRatio}`)
    
    try {
      const allImageUrls: string[] = []
      
      // Calculate number of images to generate per reference image
      // We'll distribute the requested number of images across all reference images
      // with a minimum of 1 image per reference
      const imagesPerReference = Math.max(1, Math.floor(numberOfImages / referenceImages.length))
      let remainingImages = numberOfImages % referenceImages.length
      
      // Process each reference image
      for (let i = 0; i < referenceImages.length; i++) {
        const referenceImage = referenceImages[i]
        
        // Calculate how many images to generate for this reference
        // Distribute any remaining images evenly
        const imagesToGenerate = imagesPerReference + (remainingImages > 0 ? 1 : 0)
        if (remainingImages > 0) remainingImages--
        
        if (imagesToGenerate <= 0) continue
        
        // Create an enhanced prompt specific to this reference image
        const enhancedPrompt = `${prompt}
Create an image inspired by reference image ${i+1} of ${referenceImages.length}.
Apply the style, composition, and elements while incorporating the creative direction from the original reference.`
        
        // Generate images based on this reference
        const result = await openai.images.edit({
          model: "gpt-image-1",
          image: referenceImage,
          prompt: enhancedPrompt,
          n: imagesToGenerate,
          size: size as any
        } as any)
        
        // Extract and save URLs
        const imageUrls = result.data.map(image => {
          if (image.b64_json) {
            return `data:image/png;base64,${image.b64_json}`
          } else if (image.url) {
            return image.url
          }
          return ""
        }).filter(Boolean)
        
        allImageUrls.push(...imageUrls)
        
        console.log(`Generated ${imageUrls.length} images from reference ${i+1}`)
      }
      
      // Check if we managed to generate any images
      if (allImageUrls.length === 0) {
        throw new Error("No images were generated from any reference images")
      }
      
      // Return all generated images
      return NextResponse.json({
        success: true,
        images: allImageUrls,
        referenceCount: referenceImages.length,
        processMethod: "individual variations"
      })
      
    } catch (apiError: any) {
      console.error("API Error:", apiError)
      
      // Fall back to just using the first image if all else fails
      try {
        console.log("Falling back to single reference image approach")
        
        const result = await openai.images.edit({
          model: "gpt-image-1",
          image: referenceImages[0],
          prompt: `${prompt}\nCreate an image inspired by this reference image.`,
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
          error: `OpenAI API error: ${apiError.message}. Fallback also failed: ${fallbackError.message}`
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