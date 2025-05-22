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
    // Check if content is empty or too short to be meaningful
    if (!content || content.trim().length < 100) {
      return `## ⚠️ Website Content Analysis Failed

### Unable to Analyze Website Content
The website could not be properly accessed or contains insufficient textual content to analyze. This may be due to:
- Website using technologies that block scraping
- Content being loaded dynamically with JavaScript
- Website using unusual content embedding methods
- Access restrictions on the website

### Available Visual Information
${colors.length > 0 ? `- **Brand Colors Detected**: ${colors.slice(0, 3).join(', ')}` : "- No brand colors could be detected"}
${fonts.length > 0 ? `- **Typography Detected**: ${fonts.slice(0, 5).join(', ')}` : "- No typography information could be detected"}

### Troubleshooting Suggestions
- Try providing a more specific page URL that contains marketing content
- If you're using a homepage with minimal text, try a product or about page instead
- Check if the website requires user interaction or login to display content
- Some websites may be protected against automated access

Please try again with a different URL or a more accessible page on the website.`;
    }

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

### 🎨 Brand Visual Identity
- **Primary Brand Color**: [First color in the list, generally the main brand color]
- **Secondary Color**: [Second color if available, typically used for accents]
- **Tertiary Color**: [Third color if available, used for additional accents]
- **Typography**: [Main font identified, and how it contributes to brand identity]
- **Visual Style**: [Is the brand minimalist, bold, elegant, playful, etc.]

IMPORTANT: For ad creative generation, ONLY use the brand colors provided. Do not suggest or use any additional colors.

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

BRAND COLORS (use ONLY these colors for ad creatives, in priority order):
${colors.slice(0, 3).join(', ')}

BRAND TYPOGRAPHY (in priority order - higher priority fonts first):
${fonts.slice(0, 5).join(', ')}

I need a structured summary that captures the essence of this business for AI-generated ad creatives. If any section is unclear from the content, make your best educated guess based on the available information, but keep it realistic.

IMPORTANT: When creating ad creatives, ONLY use the brand colors listed above. Do not use any additional colors.`
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
    let fallbackSummary = "## ⚠️ AI Analysis Error\n\n";
    fallbackSummary += "There was an error generating the complete website analysis. Here's what we were able to extract:\n\n";
    
    // Include visual identity information if available - only up to 3 brand colors
    if (colors.length > 0) {
      fallbackSummary += "### 🎨 Brand Colors (use ONLY these colors for ad creatives)\n";
      fallbackSummary += colors.slice(0, 3).map(color => `- ${color}`).join('\n');
      fallbackSummary += "\n\n";
    }
    
    if (fonts.length > 0) {
      fallbackSummary += "### 🔤 Typography\n";
      fallbackSummary += fonts.slice(0, 5).map(font => `- ${font}`).join('\n');
      fallbackSummary += "\n\n";
    }
    
    // Extract some sample sentences if possible
    if (content && content.length > 100) {
      try {
        const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
        const sampleSentences = sentences
          .filter(s => s.length > 30 && s.length < 150) // Reasonable sentence length
          .slice(0, 5);  // Take up to 5 sentences
          
        if (sampleSentences.length > 0) {
          fallbackSummary += "### 📝 Content Excerpts\n";
          sampleSentences.forEach(s => {
            fallbackSummary += `- ${s.trim()}\n`;
          });
          fallbackSummary += "\n";
        }
      } catch (e) {
        // Skip sentence extraction if it fails
      }
    }
    
    fallbackSummary += "> **Note**: Please try again or try a different URL. If the problem persists, consider using a more accessible page on the website.";
    return fallbackSummary;
  }
}