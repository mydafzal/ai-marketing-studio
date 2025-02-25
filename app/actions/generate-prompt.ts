"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Enhances the user's prompt for social media content generation by making it more
 * engaging, platform-optimized, and visually descriptive. Ensures uploaded images
 * are organically incorporated into the content for better AI generation results.
 * 
 * @param currentPrompt The user's original prompt text
 * @param platform Optional platform context ("instagram", "tiktok", etc.)
 * @param contentType Optional content type ("video", "image", "carousel", etc.)
 * @returns An improved, platform-optimized prompt
 */
export async function improvePrompt(
  currentPrompt: string, 
  platform: string = "instagram", 
  contentType: string = "video"
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest GPT-4o model
      messages: [
        {
          role: "system",
          content: `You are an expert social media content strategist who specializes in creating viral ${platform} ${contentType} content.
          
Your task is to transform basic prompt ideas into highly detailed, engaging content directions that will:

1. OPTIMIZE FOR PLATFORM: Enhance the prompt specifically for ${platform}'s audience, trends, and algorithm preferences.

2. ADD VISUAL DIRECTION: Incorporate detailed visual guidance that works with the user's uploaded reference image, specifying:
   - Lighting conditions, color palettes, and mood
   - Camera angles, movements, and transitions (for videos)
   - Compositional elements and focal points
   
3. ENHANCE ENGAGEMENT HOOKS: Add elements that will drive strong engagement metrics for ${platform}, such as:
   - Attention-grabbing openings
   - Narrative structures that maintain viewer retention
   - Clear call-to-actions and ways to boost sharing/saving
   
4. MAINTAIN AUTHENTICITY: While improving the prompt, preserve the original intent and create a style that feels genuine and on-brand.

5. TECHNICAL OPTIMIZATION: Include any relevant technical specifications that might improve the ${contentType} generation quality.

Format your response as a cohesive, detailed prompt paragraph that the user can directly use for AI generation. DO NOT use bullets or numbered lists in your response.`
        },
        {
          role: "user",
          content: `Here's my basic idea for ${platform} ${contentType} content: "${currentPrompt}".
          
I've uploaded a reference image that should be incorporated into the final content. Please transform this into a comprehensive, optimized prompt.`
        }
      ],
      temperature: 0.7, // Slightly higher temperature for more creative outputs
      max_tokens: 1000, // Allow for longer, more detailed prompts
    })

    const improvedText = completion.choices[0]?.message?.content || ""
    return improvedText.trim()
  } catch (error) {
    console.error("Error improving prompt:", error)
    throw new Error("Failed to improve prompt. Please try again or check your OpenAI API connection.")
  }
}