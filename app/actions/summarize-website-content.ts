"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Summarizes raw website content into a concise, well-structured marketing-focused summary
 * for display to users in the AI Creative Director. Analyzes the content to extract key 
 * business information, target audience, and marketing elements.
 * 
 * @param content The raw website content to summarize
 * @param colors Array of brand colors extracted from the website
 * @param fonts Array of fonts extracted from the website
 * @returns A structured, marketing-focused summary of the website content
 */
export async function summarizeWebsiteContent(
  content: string,
  colors: string[] = [],
  fonts: string[] = []
): Promise<string> {
  try {
    // Preprocess the content to make it more digestible
    const cleanedContent = content
      .replace(/\s+/g, ' ')
      .trim();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the more powerful model for better summarization
      messages: [
        {
          role: "system",
          content: `You are a professional marketing strategist who creates comprehensive, visually structured reports analyzing websites for advertising creative development.

Your task is to analyze website content and extract key marketing elements for ad creation, presenting your findings in a visually appealing, well-structured report format.

Analyze and include the following essential marketing elements:

1. Brand Identity & Positioning
   - What is this business/service/product?
   - What is their unique value proposition?
   - What is their positioning in the market?

2. Target Audience Analysis
   - Who specifically is their ideal customer?
   - What pain points or needs does this audience have?
   - What demographic or psychographic details are evident?

3. Core Value Proposition
   - What unique benefits does the business offer?
   - How do they solve customer problems?
   - What makes their approach different?

4. Brand Voice & Personality
   - What is their communication style (professional, casual, technical, etc.)?
   - What emotional tone do they convey?
   - What values seem important to them?

5. Key Marketing Messages
   - What are their primary selling points?
   - What calls-to-action do they emphasize?
   - What guarantees or special offers do they provide?

Format your report beautifully with the following sections:

## 📊 MARKETING INSIGHT REPORT

### 🏢 Brand Overview
[Comprehensive yet concise description of the business and its core offerings]

### 👥 Target Audience Profile
[Detailed description of who would benefit most from this product/service]

### ✨ Unique Value Proposition
[The core promise that makes this business stand out]

### 💼 Key Benefits
- [Benefit 1 - with brief explanation]
- [Benefit 2 - with brief explanation]
- [Benefit 3 - with brief explanation]

### 🗣️ Brand Voice & Tone
[Analysis of communication style and emotional resonance]

### 📣 Key Marketing Messages
- [Primary message 1]
- [Primary message 2]
- [Primary message 3]

### 📈 Advertising Recommendations
[2-3 sentences on how to best position this brand in advertising]

Make your analysis detailed, insightful, and visually structured with proper markdown formatting.`
        },
        {
          role: "user",
          content: `Please analyze this website content for marketing creative purposes:

CONTENT:
${cleanedContent.slice(0, 7500)} ${cleanedContent.length > 7500 ? '... [additional content truncated]' : ''}

BRAND COLORS:
${colors.slice(0, 8).join(', ')}

FONTS:
${fonts.slice(0, 5).join(', ')}

I need a structured summary that captures the essence of this business for AI-generated ad creatives. If any section is unclear from the content, make your best educated guess based on the available information, but keep it realistic.`
        }
      ],
      temperature: 0.4,
      max_tokens: 1000,
    })

    const summary = completion.choices[0]?.message?.content || ""
    return summary.trim()
  } catch (error) {
    console.error("Error summarizing website content:", error)
    
    // Create a more helpful fallback summary
    let fallbackSummary = "## Website Summary\n\n";
    
    // Extract some sample sentences if possible
    try {
      const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
      const sampleSentences = sentences
        .filter(s => s.length > 30 && s.length < 150) // Reasonable sentence length
        .slice(0, 5);  // Take up to 5 sentences
        
      if (sampleSentences.length > 0) {
        fallbackSummary += "### Key Content\n";
        sampleSentences.forEach(s => {
          fallbackSummary += `- ${s.trim()}\n`;
        });
      } else {
        fallbackSummary += `This site appears to be about ${content.slice(0, 100)}...\n`;
      }
    } catch (e) {
      fallbackSummary += `This site appears to be about ${content.slice(0, 100)}...\n`;
    }
    
    fallbackSummary += "\n*Note: AI summarization encountered an error. Showing excerpts from the website.*";
    return fallbackSummary;
  }
}