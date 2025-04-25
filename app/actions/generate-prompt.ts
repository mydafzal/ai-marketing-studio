"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Enhances the user's prompt for image or video generation by making minimal
 * improvements while preserving the original intent and description.
 * 
 * @param currentPrompt The user's original prompt text
 * @param platform Optional platform context 
 * @param contentType Optional content type ("video", "image", or "image-with-reference")
 * @returns A slightly improved prompt for better AI generation
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
          content: `You are a prompt enhancement assistant for image and video generation models. Your role is to make subtle improvements to user prompts while maintaining their original intent and core description.

Guidelines:
1. PRESERVE CORE CONTENT: Keep the user's original description as the foundation.
2. CLARIFY AMBIGUITIES: Only clarify elements that might be unclear to an AI image/video generator.
3. ADD MINIMAL VISUAL DETAILS: Add only essential details about lighting, perspective, or style if they're missing.
4. MAINTAIN BREVITY: Keep the prompt concise and focused.
5. AVOID OVEREMBELLISHMENT: Do not add dramatic narrative elements, storylines, or marketing language unless specifically in the original prompt.
${contentType === "image-with-reference" ? `
6. REFERENCE IMAGE GUIDANCE: Since this prompt will be used with reference images, focus on describing how elements from those references should be combined or emphasized. Include details about which aspects to preserve and how to adapt them.` : ""}

Your output should be a slightly refined version of the user's input that will help image/video generation models produce better results without changing the user's original vision.`
        },
        {
          role: "user",
          content: `Here's my description for a ${contentType === "image-with-reference" ? "image that will be created using reference images" : contentType}: "${currentPrompt}"

${contentType === "image-with-reference" 
  ? "Please make minimal improvements to help the AI understand how to combine elements from multiple reference images, while staying true to my original description."
  : "Please make minimal improvements to help image/video generation models understand it better, while staying true to my original description."}`
        }
      ],
      temperature: 0.3, // Lower temperature for more conservative, predictable outputs
      max_tokens: 500, // Shorter limit to prevent overembellishment
    })

    const improvedText = completion.choices[0]?.message?.content || ""
    return improvedText.trim()
  } catch (error) {
    console.error("Error improving prompt:", error)
    throw new Error("Failed to improve prompt. Please try again or check your OpenAI API connection.")
  }
}