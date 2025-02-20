"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Improves the user's prompt text to ensure it references the uploaded image
 * object in the final video generation scene, making the prompt more descriptive
 * and cohesive without drastically changing the core meaning.
 */
export async function improvePrompt(currentPrompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo" if you prefer
      messages: [
        {
          role: "system",
          content: `
You are a helpful writing assistant. Take the user's text and improve it by making it more descriptive, creative, and cohesive. 
Importantly, the final prompt must strongly incorporate the object or scene from the user's uploaded reference image into the 
video generation. Ensure that the prompt clarifies how the reference image should be used in the resulting scene, but do not 
drastically change the original meaning or context. 
`
        },
        {
          role: "user",
          content: currentPrompt
        }
      ],
      temperature: 0.4,
    })

    const improvedText = completion.choices[0]?.message?.content || ""
    return improvedText.trim()
  } catch (error) {
    console.error("Error improving prompt:", error)
    throw new Error("Failed to improve prompt")
  }
}
