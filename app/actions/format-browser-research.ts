"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface BrowserResearchResult {
  researchQuery: string;
  results: string;
}

/**
 * Formats browser research results into a natural, well-crafted message
 * for the AI to send to users in the chat.
 * 
 * @param researchQuery The original query that was researched
 * @param results The raw research results text
 * @param enhancedInstructions The enhanced instructions that were used (optional)
 * @returns A natural language message summarizing the research findings
 */
export async function formatBrowserResearch(
  researchQuery: string,
  results: string,
  enhancedInstructions?: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest GPT-4o model
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that specializes in summarizing web research and presenting findings in a clear, concise, and friendly manner.

Guidelines:
1. FOCUS ON RELEVANT FINDINGS: Emphasize the most important information related to the query.
2. BE CONCISE BUT INFORMATIVE: Communicate the key insights in a conversational, easy-to-understand way.
3. HIGHLIGHT IMPORTANT POINTS: Structure the findings with bullet points for clarity.
4. BE CONVERSATIONAL: Write as if you're having a direct conversation with the user.
5. INCLUDE SOURCE CONTEXT: Mention where the information comes from when relevant.
6. INDICATE COMPLETENESS: Note if the research is comprehensive or if there are limitations.`
        },
        {
          role: "user",
          content: `Please format these browser research results into a natural, conversational message:

ORIGINAL USER QUERY:
${researchQuery}

${enhancedInstructions ? `ENHANCED INSTRUCTIONS USED:
${enhancedInstructions}

` : ''}RESEARCH RESULTS:
${results.slice(0, 7500)} ${results.length > 7500 ? '... [additional content truncated]' : ''}

Create a message that sounds natural and helpful. Include the 3-5 most important findings as bullet points, followed by a brief summary paragraph. This message will be added directly to the chat as an AI assistant message.`
        }
      ],
      temperature: 0.7, // Slightly higher temperature for more natural language
      max_tokens: 800,
    })

    const formattedMessage = completion.choices[0]?.message?.content || ""
    return formattedMessage.trim()
  } catch (error) {
    console.error("Error formatting browser research:", error)
    
    // Create a basic formatted message from the raw results
    let basicBulletPoints = "• No specific results found";
    
    if (results && typeof results === 'string') {
      try {
        basicBulletPoints = results
          .split('\n')
          .filter(line => line.trim().length > 20)
          .slice(0, 5)
          .map(line => `• ${line.trim()}`)
          .join('\n');
      } catch (splitError) {
        console.error("Error processing results:", splitError);
        // If split fails, use the results as is (if it's a string)
        basicBulletPoints = `• ${results.substring(0, 200)}...`;
      }
    }
      
    return `# 🌐 Research Results: ${researchQuery}\n\n${basicBulletPoints}\n\n---\n\nI've completed the research on "${researchQuery}". These are the key findings from my web search. The detailed results are available in the sidebar, where you can also continue to explore with the browser agent.`;
  }
}