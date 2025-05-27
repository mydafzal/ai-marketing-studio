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
/**
 * Generates a formatted brand overview from website content
 * with appropriate markdown formatting (headers, bold, italic, lists)
 * for improved readability in company profile descriptions.
 * 
 * @param content The raw website content to process
 * @param colors Array of brand colors extracted from the website
 * @param fonts Array of fonts extracted from the website
 * @returns A markdown-formatted brand overview without emojis
 */
export async function generateFormattedBrandOverview(
  content: string,
  colors: string[] = [],
  fonts: string[] = []
): Promise<string> {
  try {
    // Check if content is empty or too short to be meaningful
    if (!content || content.trim().length < 100) {
      return "Unable to generate a brand overview. The website contains insufficient content for analysis.";
    }

    // Preprocess the content to make it more digestible
    const cleanedContent = content
      .replace(/\s+/g, ' ')
      .trim();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using the more powerful model for better results
      messages: [
        {
          role: "system",
          content: `You are a professional marketing writer who creates concise, informative brand overviews.

Your task is to analyze website content and create a well-formatted brand overview with effective use of markdown for clarity and emphasis.

FORMATTING REQUIREMENTS:
1. USE MARKDOWN - Use markdown for emphasis (bold, italic) where appropriate
2. USE HEADERS - Use ### for section headers (no higher level headers)
3. USE BULLET POINTS - Use bullet points for listing features or benefits
4. NO EMOJIS - No emoji characters of any kind
5. CLEAN STRUCTURE - Create a well-organized document with clear sections

The overview should include:
- What the business does
- Who their target audience is
- Their unique value proposition
- Key benefits they offer
- Brand voice and tone

Format your response to be visually appealing with proper markdown styling for emphasis, headers, and lists. Make it professional and easy to read.`
        },
        {
          role: "user",
          content: `Please create a formatted brand overview based on this website content. Use markdown formatting (bold, italic, headers, bullet points) to structure the information clearly.

CONTENT:
${cleanedContent.slice(0, 7500)} ${cleanedContent.length > 7500 ? '... [additional content truncated]' : ''}

BRAND COLORS (for context only):
${colors.slice(0, 3).join(', ')}

BRAND TYPOGRAPHY (for context only):
${fonts.slice(0, 5).join(', ')}

Create a well-structured overview with appropriate markdown formatting. Make it professional and visually appealing. Use headers (###), bold (**text**), italic (*text*), and bullet points (- item) to organize the information.`
        }
      ],
      temperature: 0.4,
      max_tokens: 1000,
    });

    // Get the formatted overview
    let formattedOverview = completion.choices[0]?.message?.content || "";
    
    // Remove any emojis
    formattedOverview = formattedOverview.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF]/g, '');
    
    // Clean up any excessive newlines
    formattedOverview = formattedOverview.replace(/\n{4,}/g, '\n\n\n').trim();
    return formattedOverview;
  } catch (error) {
    console.error("Error generating plain brand overview:", error);
    return "We encountered an error while generating your brand overview. Please try again or enter your description manually.";
  }
}

/**
 * Extracts the company name from website content using multiple extraction techniques
 * to ensure accurate results across different website structures.
 * 
 * @param content The raw website content to analyze
 * @param url The URL of the website (used for domain-based extraction)
 * @returns The extracted company name or empty string if not found
 */
export async function extractCompanyName(content: string, url: string): Promise<string> {
  // Clean the content for processing
  const cleanedContent = content.replace(/\s+/g, ' ').trim();
  
  // Pattern 1: Look for common company name patterns in text
  const patterns = [
    // "Company Name is a..." pattern
    /(?:^|\s)([A-Z][A-Za-z0-9\s&,'-]{2,30})(?:\s+is\s+an?|,\s+an?)\s+(?:industry|leading|innovative|premier|global|top|award[\s-]winning)/i,
    
    // "About Company Name" pattern
    /(?:about|about\s+us|company)(?:\s+[\-\|:])?\s+([A-Z][A-Za-z0-9\s&,'-]{2,30})(?:[\.\s]|$)/i,
    
    // "Company Name, a..." pattern
    /([A-Z][A-Za-z0-9\s&,'-]{2,30}),\s+(?:an?|the)\s+(?:industry|leading|innovative|premier|global|provider|company|organization|enterprise|specialist)/i,
    
    // "Welcome to Company Name" pattern
    /welcome\s+to\s+([A-Z][A-Za-z0-9\s&,'-]{2,30})(?:[\.\s]|$)/i,
    
    // "© 2023 Company Name" pattern (copyright)
    /©\s*(?:19|20)\d{2}\s+([A-Z][A-Za-z0-9\s&,''-]{2,30})(?:[\.\s,]|$)/i,
    
    // "Company Name LLC/Inc/Ltd" pattern
    /([A-Z][A-Za-z0-9\s&,''-]{2,25})\s+(?:LLC|Inc|Ltd|GmbH|Limited|Corp|Corporation|Company|Co)(?:[\.\s,]|$)/i,
    
    // "All rights reserved. Company Name" pattern
    /All\s+rights\s+reserved\.?\s+([A-Z][A-Za-z0-9\s&,''-]{2,30})(?:[\.\s,]|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = cleanedContent.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      // Clean up the match
      return match[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*[,\.-]\s*$/, ''); // Remove trailing punctuation
    }
  }
  
  // Pattern 2: Extract from meta tags
  const metaTagPatterns = [
    /<meta\s+(?:property|name)=["'](?:og:site_name|application-name|author|copyright|publisher)["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:site_name|application-name|author|copyright|publisher)["']/i
  ];
  
  for (const pattern of metaTagPatterns) {
    const matches = Array.from(content.matchAll(new RegExp(pattern, 'gi')));
    for (const match of matches) {
      if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
        return match[1].trim();
      }
    }
  }
  
  // Pattern 3: Extract from title tag
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    // Clean and process the title
    let title = titleMatch[1].trim();
    
    // Remove common suffixes like "| Home" or "- Official Website"
    title = title.replace(/\s*[|:\-–—]\s*(?:Home|Official(?:\s+Site|Website)?|Welcome|About(?:\s+Us)?|Contact(?:\s+Us)?)$/i, '');
    
    // If title is not too long and looks like a brand name, use it
    if (title.length > 2 && title.length < 50 && /^[A-Z0-9]/.test(title)) {
      return title;
    }
  }
  
  // Pattern 4: Extract from domain name
  if (url) {
    try {
      const hostname = new URL(url).hostname;
      // Remove common TLDs and www
      let domain = hostname
        .replace(/^www\./, '')
        .replace(/\.(com|org|net|io|co|ai|app|biz|info|us|uk|eu|de|fr)$/, '');
      
      // Split by dots and take the first part (for subdomains)
      const domainParts = domain.split('.');
      domain = domainParts[0];
      
      // If domain has dashes, convert to spaces and capitalize each word
      if (domain.includes('-')) {
        domain = domain.split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        // Just capitalize the first letter
        domain = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
      
      // Only use domain if it's not too short and looks like a name
      if (domain.length > 2 && /^[A-Za-z0-9]/.test(domain)) {
        return domain;
      }
    } catch (e) {
      console.error('Error extracting company name from domain:', e);
    }
  }
  
  // If all else fails, return an empty string
  return '';
}

/**
 * Finds the privacy policy URL from a website
 * 
 * @param content The raw HTML content
 * @param baseUrl The base URL of the website for resolving relative URLs
 * @returns The privacy policy URL or empty string if not found
 */
export async function findPrivacyPolicyUrl(content: string, baseUrl: string): Promise<string> {
  try {
    // Clean up the content a bit to make regex more reliable
    const cleanedContent = content.replace(/\s+/g, ' ');
    
    // Regex for finding link tags with privacy-related text
    // This prioritizes links that have explicit privacy policy text
    const privacyLinkPatterns = [
      // Links with very specific privacy policy text in the link text
      /<a[^>]*href=["']([^"']+)["'][^>]*>(?:[^<]*(?:privacy\s*policy|privacy\s*statement|datenschutz(?:erklärung)?|política\s*de\s*privacidad)[^<]*)<\/a>/i,
      
      // Links with common privacy paths in the href
      /<a[^>]*href=["']([^"']*\/(?:privacy-policy|privacy_policy|privacypolicy|datenschutz|privacy\/|datenschutz\/|legal\/privacy|legal\/datenschutz)[^"']*)["'][^>]*>/i,
      
      // Links with privacy-related text
      /<a[^>]*href=["']([^"']+)["'][^>]*>(?:[^<]*(?:privacy|datenschutz|privacidad|policy)[^<]*)<\/a>/i,
      
      // Footer or legal links that might contain privacy policy
      /<(?:footer|div[^>]*(?:class|id)=["'][^"']*(?:footer|legal|bottom)[^"']*["'])[^>]*>(?:[^<]*<a[^>]*href=["']([^"']+)["'][^>]*>(?:[^<]*(?:privacy|datenschutz|privacidad|policy)[^<]*)<\/a>[^<]*)+<\/(?:footer|div)>/i
    ];
    
    // Try each pattern
    for (const pattern of privacyLinkPatterns) {
      const matches = Array.from(cleanedContent.matchAll(new RegExp(pattern, 'gi')));
      for (const match of matches) {
        if (match && match[1]) {
          const linkHref = match[1];
          
          // Skip links that are clearly not privacy policy links
          if (linkHref.includes('mailto:') || 
              linkHref.includes('tel:') || 
              linkHref.includes('javascript:') ||
              linkHref === '#' ||
              linkHref.includes('login') ||
              linkHref.includes('signup') ||
              linkHref.includes('/cart') ||
              linkHref.includes('/search')) {
            continue;
          }
          
          try {
            // Resolve relative URLs
            const url = new URL(linkHref, baseUrl).href;
            console.log('Found privacy policy URL:', url);
            return url;
          } catch (e) {
            // If URL parsing fails, try to handle it as a relative URL manually
            if (linkHref.startsWith('/')) {
              try {
                const urlObj = new URL(baseUrl);
                const fullUrl = `${urlObj.origin}${linkHref}`;
                console.log('Resolved relative privacy policy URL:', fullUrl);
                return fullUrl;
              } catch (e) {
                console.error('Error resolving relative URL:', e);
              }
            }
          }
        }
      }
    }
    
    // Fallback: check for all links that have privacy-related text or URLs
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    const links = Array.from(cleanedContent.matchAll(linkRegex));
    
    // First, look for obvious privacy policy links
    for (const link of links) {
      const url = link[1];
      const text = link[2].toLowerCase();
      
      const isPrivacyText = 
        text.includes('privacy policy') || 
        text.includes('privacy statement') || 
        text.includes('datenschutzerklärung') ||
        text.includes('política de privacidad');
        
      const isPrivacyUrl = 
        url.includes('/privacy-policy') || 
        url.includes('/privacy_policy') || 
        url.includes('/privacypolicy') || 
        url.includes('/datenschutz') ||
        url.includes('/legal/privacy');
      
      if (isPrivacyText || isPrivacyUrl) {
        try {
          const resolvedUrl = new URL(url, baseUrl).href;
          console.log('Found privacy policy URL from fallback:', resolvedUrl);
          return resolvedUrl;
        } catch (e) {
          if (url.startsWith('/')) {
            try {
              const urlObj = new URL(baseUrl);
              const fullUrl = `${urlObj.origin}${url}`;
              console.log('Resolved relative privacy URL from fallback:', fullUrl);
              return fullUrl;
            } catch (e) {
              console.error('Error resolving relative URL:', e);
            }
          }
        }
      }
    }
    
    // If no privacy policy URL was found, do NOT guess one
    return '';
  } catch (error) {
    console.error('Error finding privacy policy URL:', error);
    return '';
  }
}

export async function summarizeWebsiteContent(
  content: string,
  colors: string[] = [],
  fonts: string[] = []
): Promise<string> {
  try {
    // Check if content is empty or too short to be meaningful
    if (!content || content.trim().length < 100) {
      return `## ⚠️ Website Insights Analysis Failed

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

## 📊 WEBSITE INSIGHTS REPORT

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