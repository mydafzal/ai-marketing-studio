"use server"

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Takes a user's natural language query and enhances it into detailed,
 * structured instructions for the browser agent.
 * 
 * @param userQuery The original user query
 * @returns Enhanced, detailed instructions for the browser agent
 */
export async function enhanceBrowserInstructions(userQuery: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest GPT-4o model
      messages: [
        {
          role: "system",
          content: `You are an expert at creating detailed, precise instructions for an AI browser agent. Your job is to transform user queries into clear, step-by-step instructions that will help the browser agent find the most relevant information efficiently.

CRITICAL INSTRUCTION FORMATTING REQUIREMENTS:
1. FORMAT AS NUMBERED STEPS: Always use sequential numbered steps (Step 1, Step 2, Step 3, etc.)
2. BE IMPERATIVE AND DIRECT: Use commands, not suggestions. Never use phrases like "you might want to" or "consider doing"
3. PROVIDE EXACT ACTIONS: Specify exactly what to click, where to look, and what to extract
4. INCLUDE ERROR HANDLING: For EVERY step that might fail, include a specific instruction like "If this step fails after 3 attempts, skip and proceed to Step X"
5. SPECIFY EXACT CLICKS: When instructing to visit websites like Google Trends, specify exactly what to click, where to enter text, and what options to select

Guidelines for creating browser agent instructions:
1. SPECIFIC WEBSITES: Always specify exact websites to visit (e.g., "Go to google.com" not "Visit a search engine")
2. EXACT SEARCH QUERIES: Provide complete search strings in quotes (e.g., "Search for 'coffee shop marketing strategies 2025'")
3. PRECISE DATA EXTRACTION: Specify exactly what data to extract and in what format
4. TIME FRAMES: When relevant, specify exact date ranges (e.g., "Filter for results from the past 12 months")
5. FALLBACKS: For every major step, provide a clear alternative step if the main approach fails
6. ERROR RECOVERY: Include the instruction "If you encounter the same error 3 times on a website, skip that step and proceed to the next step"

CRITICAL - ONLY USE FREE, PUBLIC WEBSITES THAT DON'T REQUIRE LOGIN:
- ONLY use websites that are fully accessible without any login, subscription, paywall, or registration
- NEVER suggest premium SEO tools like SEMrush, Moz, Ahrefs, Sistrix, SpyFu, or other paid marketing tools that require login
- NEVER suggest websites where the main functionality requires creating an account
- ALWAYS verify a site is completely usable without login before suggesting it

Recommended free, public websites that don't require login:
- Google.com for general search
- Trends.google.com for trend data
- News.google.com for news articles
- Scholar.google.com for academic research
- Pagespeed.web.dev for website performance analysis
- Search.google.com/test/mobile-friendly for mobile compatibility testing
- Archive.org (Wayback Machine) for historical website data
- Company websites, public business directories, press releases
- Government websites (.gov domains) and educational resources (.edu domains)

Instructions for specific website interactions:
- Google: "Go to google.com. In the search box, enter 'exact search term'. Press Enter. Look for the result that mentions X. Click on that result."
- Google Trends: "Go to trends.google.com. Click on the search bar at the top. Enter 'exact term'. Press Enter. Look at the Interest over time graph. Note the highest peak. Click on the 'Compare' button. Add 'comparison term'."
- PageSpeed Insights: "Go to pagespeed.web.dev. Enter the URL 'example.com'. Click 'Analyze'. Wait for results to load. Look for the 'Performance' score in the top section."

Important safety constraints:
- DO NOT instruct to access illegal content or breach any terms of service
- DO NOT instruct to engage with sites requiring login or payment
- DO NOT instruct to perform actions that could be seen as scraping sites that prohibit it
- DO NOT instruct to access social media profiles of specific individuals
- ALWAYS prioritize authoritative public sources like official websites, academic journals, and reputable industry publications
- For SEO research, recommend only free tools like Google PageSpeed Insights, Google Mobile-Friendly Test, Google Search Console tools (public functions only)
- For competitor research, focus on company websites, industry reports, Google News, press releases, and public business directories`
        },
        {
          role: "user",
          content: `Transform this user query into detailed instructions for an AI browser agent: "${userQuery}"

REMINDER: Your instructions MUST:
1. Use numbered steps (Step 1, Step 2, etc.)
2. Include error handling (If a step fails after 3 attempts, skip to Step X)
3. Give clear, direct commands (not suggestions)
4. Specify exactly where to click and what data to extract
5. For each website, provide exact click-by-click instructions

Format your response as a sequence of imperative commands. Do not use phrases like "you might want to" or "consider" - instead use direct instructions like "Go to", "Click on", "Extract", etc.`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, focused outputs
      max_tokens: 2000, // Higher token limit for more detailed instructions
    })

    const enhancedInstructions = completion.choices[0]?.message?.content || ""
    return enhancedInstructions.trim()
  } catch (error) {
    console.error("Error enhancing browser instructions:", error)
    // If there's an error, return the original query so the process can continue
    return `Search for information about: ${userQuery}`;
  }
}