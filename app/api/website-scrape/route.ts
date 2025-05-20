import { NextRequest, NextResponse } from 'next/server';
import { summarizeWebsiteContent } from '@/app/actions/summarize-website-content';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SCRAPING_BEE;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Scraping API key not configured' },
        { status: 500 }
      );
    }

    const encodedUrl = encodeURIComponent(url);
    
    // Use block_resources=false to ensure we can get images, and increase timeout for better content loading
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodedUrl}&render_js=true&block_resources=false&wait=5000&wait_browser=networkidle2`;

    // Make the request to ScrapingBee
    const response = await fetch(scrapingBeeUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to scrape website: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Extract colors with improved targeting for brand elements
    const colorMap = new Map<string, number>();
    
    // Helper to add a color to our map with a weight
    const addColorWithWeight = (color: string, weight: number) => {
      if (color && color.match(/#([a-fA-F0-9]{3}){1,2}\b/)) {
        // Normalize 3-digit hex to 6-digit
        if (color.length === 4) {
          color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
        }
        
        colorMap.set(color.toLowerCase(), (colorMap.get(color.toLowerCase()) || 0) + weight);
      }
    };
    
    // Extract colors from key UI elements with different weights
    // Buttons (high weight - often brand colors)
    const buttonColorRegex = /<button[^>]*\bstyle\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:\s*(#[a-fA-F0-9]{3,6})[^"']*["'][^>]*>/gi;
    let match;
    while ((match = buttonColorRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 10); // Higher weight for button colors
    }
    
    // Headers and headings (high weight)
    const headingColorRegex = /<h[1-3][^>]*\bstyle\s*=\s*["'][^"']*\bcolor\s*:\s*(#[a-fA-F0-9]{3,6})[^"']*["'][^>]*>/gi;
    while ((match = headingColorRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 8); // High weight for heading text colors
    }
    
    // Logo and hero sections (high weight)
    const logoHeroRegex = /<(?:header|\.header|\.logo|#header|#logo|\.hero|#hero)[^>]*\bstyle\s*=\s*["'][^"']*\b(?:color|background(?:-color)?)\s*:\s*(#[a-fA-F0-9]{3,6})[^"']*["'][^>]*>/gi;
    while ((match = logoHeroRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 9); // High weight for logo/header colors
    }
    
    // Links (medium weight - often brand colors)
    const linkColorRegex = /<a[^>]*\bstyle\s*=\s*["'][^"']*\bcolor\s*:\s*(#[a-fA-F0-9]{3,6})[^"']*["'][^>]*>/gi;
    while ((match = linkColorRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 6); // Medium weight for link colors
    }
    
    // Extract and process CSS rules for colors from style tags
    const styleTagMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    for (const styleTag of styleTagMatches) {
      // Extract style content
      const styleContent = styleTag.replace(/<style[^>]*>|<\/style>/gi, '');
      
      // Button and CTA selectors
      const buttonCssRegex = /(?:\.btn|\.button|\.cta|button|\[type=['"]submit['"]\])[^{]*{[^}]*\bbackground(?:-color)?\s*:\s*(#[a-fA-F0-9]{3,6})[^}]*}/gi;
      while ((match = buttonCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 10);
      }
      
      // Header and nav selectors
      const headerCssRegex = /(?:header|\.header|nav|\.nav|\.navbar|\.navigation)[^{]*{[^}]*\b(?:color|background(?:-color)?)\s*:\s*(#[a-fA-F0-9]{3,6})[^}]*}/gi;
      while ((match = headerCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 9);
      }
      
      // Heading selectors
      const headingCssRegex = /(?:h1|h2|h3|\.title|\.heading)[^{]*{[^}]*\bcolor\s*:\s*(#[a-fA-F0-9]{3,6})[^}]*}/gi;
      while ((match = headingCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 8);
      }
      
      // Link selectors
      const linkCssRegex = /(?:a|\.link)[^{]*{[^}]*\bcolor\s*:\s*(#[a-fA-F0-9]{3,6})[^}]*}/gi;
      while ((match = linkCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 6);
      }
    }
    
    // Also check for inline background colors on important elements
    const inlineBackgroundRegex = /<(?:div|section|main|article|aside)[^>]*\bclass\s*=\s*["'][^"']*(?:header|hero|cta|banner|main)[^"']*["'][^>]*\bstyle\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:\s*(#[a-fA-F0-9]{3,6})[^"']*["'][^>]*>/gi;
    while ((match = inlineBackgroundRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 7);
    }
    
    // As a fallback, also extract all hex color codes anywhere in the document (low weight)
    const allColorRegex = /#([a-fA-F0-9]{3}){1,2}\b/g;
    const allMatches = html.match(allColorRegex) || [];
    for (const color of allMatches) {
      addColorWithWeight(color, 1); // Low weight for generic color matches
    }
    
    // Filter out extreme colors that are likely not brand colors
    const filteredColorMap = new Map(Array.from(colorMap).filter(([color]) => {
      // Convert hex to RGB
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5, 7), 16);
      
      // Filter out pure black, pure white and very close shades (likely not distinctive brand colors)
      const isExtremeBlack = r < 15 && g < 15 && b < 15;
      const isExtremeWhite = r > 240 && g > 240 && b > 240;
      
      return !isExtremeBlack && !isExtremeWhite;
    }));
    
    // Sort by weight (highest first) and take top colors
    const colors = Array.from(filteredColorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color)
      .slice(0, 8); // Get top 8 colors

    // Extract font information with priority for headings and important text
    const fontMap = new Map<string, number>();
    
    // Helper to add a font to our map with a weight
    const addFontWithWeight = (font: string, weight: number) => {
      if (font) {
        // Clean up font name - remove quotes and normalize
        const cleanedFont = font.trim()
          .replace(/["']/g, '')
          .split(',')[0] // Take only the first font in the stack
          .trim();
          
        if (cleanedFont && !cleanedFont.includes('data:') && cleanedFont.length > 1) {
          fontMap.set(cleanedFont, (fontMap.get(cleanedFont) || 0) + weight);
        }
      }
    };
    
    // Extract fonts from headings (high weight)
    const headingFontRegex = /<h[1-3][^>]*\bstyle\s*=\s*["'][^"']*\bfont-family\s*:\s*([^;"']+)[^"']*["'][^>]*>/gi;
    let fontMatches;
    while ((fontMatches = headingFontRegex.exec(html)) !== null) {
      addFontWithWeight(fontMatches[1], 10); // High weight for heading fonts
    }
    
    // Extract fonts from buttons and CTAs (high weight)
    const buttonFontRegex = /<(?:button|\.btn|\.button|\.cta)[^>]*\bstyle\s*=\s*["'][^"']*\bfont-family\s*:\s*([^;"']+)[^"']*["'][^>]*>/gi;
    while ((fontMatches = buttonFontRegex.exec(html)) !== null) {
      addFontWithWeight(fontMatches[1], 9); // High weight for button fonts
    }
    
    // Extract fonts from navigation (medium-high weight)
    const navFontRegex = /<(?:nav|\.nav|\.navbar|\.navigation)[^>]*\bstyle\s*=\s*["'][^"']*\bfont-family\s*:\s*([^;"']+)[^"']*["'][^>]*>/gi;
    while ((fontMatches = navFontRegex.exec(html)) !== null) {
      addFontWithWeight(fontMatches[1], 8); // Medium-high weight for nav fonts
    }
    
    // Extract fonts from CSS rules - reuse the style tags we found earlier
    for (const styleTag of styleTagMatches) {
      // Extract style content
      const styleContent = styleTag.replace(/<style[^>]*>|<\/style>/gi, '');
      
      // Heading fonts
      const headingCssFontRegex = /(?:h1|h2|h3|\.title|\.heading)[^{]*{[^}]*\bfont-family\s*:\s*([^;}]+)[^}]*}/gi;
      while ((fontMatches = headingCssFontRegex.exec(styleContent)) !== null) {
        addFontWithWeight(fontMatches[1], 10);
      }
      
      // Button fonts
      const buttonCssFontRegex = /(?:\.btn|\.button|\.cta|button|\[type=['"]submit['"]\])[^{]*{[^}]*\bfont-family\s*:\s*([^;}]+)[^}]*}/gi;
      while ((fontMatches = buttonCssFontRegex.exec(styleContent)) !== null) {
        addFontWithWeight(fontMatches[1], 9);
      }
      
      // Body text fonts
      const bodyCssFontRegex = /(?:body|p|\.text|\.content)[^{]*{[^}]*\bfont-family\s*:\s*([^;}]+)[^}]*}/gi;
      while ((fontMatches = bodyCssFontRegex.exec(styleContent)) !== null) {
        addFontWithWeight(fontMatches[1], 7);
      }
    }
    
    // As a fallback, get any font-family declarations (low weight)
    const genericFontRegex = /font-family\s*:\s*([^;}]+)/gi;
    while ((fontMatches = genericFontRegex.exec(html)) !== null) {
      addFontWithWeight(fontMatches[1], 1); // Low weight for generic font declarations
    }
    
    // Sort by weight (highest first) and take top fonts
    const fonts = new Set(
      Array.from(fontMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([font]) => font)
        .slice(0, 5) // Get top 5 fonts
    );

    // Extract a sample of the content text with better handling
    let bodyText = '';
    
    // First try to extract content from important semantic elements
    const contentElements = [
      // Main content areas
      /<main[^>]*>([\s\S]*?)<\/main>/gi,
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*(?:id|class)\s*=\s*["'](?:content|main|main-content|page-content)["'][^>]*>([\s\S]*?)<\/div>/gi,
      
      // Important sections
      /<section[^>]*>([\s\S]*?)<\/section>/gi,
      
      // Key headings and paragraphs
      /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
      /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
      /<p[^>]*>([\s\S]*?)<\/p>/gi,
    ];
    
    // Try each content pattern
    let contentFound = false;
    for (const pattern of contentElements) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Extract text from these elements
        for (const match of matches) {
          const textContent = match.replace(/<[^>]*>/g, ' ');
          if (textContent.trim().length > 50) { // Only add if significant content
            bodyText += textContent + ' ';
            contentFound = true;
          }
        }
      }
    }
    
    // If we couldn't find good content from semantic elements, fall back to the entire body
    if (!contentFound || bodyText.trim().length < 200) {
      bodyText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    // Clean up the text
    bodyText = bodyText.replace(/\s+/g, ' ').trim();
    const contentSample = bodyText.substring(0, 500) + (bodyText.length > 500 ? '...' : '');
    
    // Generate a summarized version of the content for display
    const contentSummary = await summarizeWebsiteContent(bodyText, colors, Array.from(fonts) as string[]);
    
    // Extract images
    const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/ig;
    let imgMatches;
    const images = [];
    
    // Helper function to sanitize URLs
    const sanitizeImageUrl = (imgSrc: string): string => {
      // Remove HTML entities like &amp;
      imgSrc = imgSrc.replace(/&amp;/g, '&');
      
      // Handle double slashes in case of wrongly formatted URLs
      imgSrc = imgSrc.replace(/([^:])\/\//g, '$1/');
      
      return imgSrc;
    };
    
    // Helper function to resolve relative URLs
    const resolveRelativeUrl = (imgSrc: string, baseUrl: URL): string => {
      // Handle absolute URLs
      if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
        return sanitizeImageUrl(imgSrc);
      }
      
      // Handle protocol-relative URLs
      if (imgSrc.startsWith('//')) {
        return `https:${imgSrc}`;
      }
      
      // Handle root-relative URLs
      if (imgSrc.startsWith('/')) {
        return `${baseUrl.origin}${imgSrc}`;
      }
      
      // Handle relative URLs
      const path = baseUrl.pathname.endsWith('/') 
        ? baseUrl.pathname 
        : baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
      
      return `${baseUrl.origin}${path}${imgSrc}`;
    };
    
    // Extract images from standard <img> tags
    while ((imgMatches = imgRegex.exec(html)) !== null && images.length < 10) {
      try {
        let imgSrc = imgMatches[1];
        
        // Skip data URLs and base64 images
        if (imgSrc.startsWith('data:') || imgSrc.includes('base64')) {
          continue;
        }
        
        // Resolve the URL
        const baseUrl = new URL(url);
        imgSrc = resolveRelativeUrl(imgSrc, baseUrl);
        
        // Only include if it's an image file or has an image-like path
        if (
          imgSrc.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) || 
          imgSrc.includes('/image/') ||
          imgSrc.includes('/img/') ||
          imgSrc.includes('/images/') ||
          imgSrc.includes('/media/') ||
          imgSrc.includes('/assets/') ||
          imgSrc.includes('/cdn/')
        ) {
          // Check if the image URL looks reasonably valid
          try {
            // Parse the URL to validate it
            new URL(imgSrc);
            images.push(imgSrc);
          } catch (urlError) {
            console.error('Invalid image URL:', imgSrc);
          }
        }
      } catch (error) {
        console.error('Error processing image URL:', error);
        // Skip problematic images
      }
    }
    
    // Also extract background images from CSS
    const backgroundImageRegex = /background(?:-image)?\s*:\s*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/ig;
    let bgMatches;
    
    // First check inline styles
    const inlineStyleRegex = /<[^>]+style\s*=\s*["'][^"']*background(?:-image)?\s*:\s*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)[^"']*["'][^>]*>/ig;
    let inlineStyleMatches;
    
    while ((inlineStyleMatches = inlineStyleRegex.exec(html)) !== null && images.length < 10) {
      try {
        let imgSrc = inlineStyleMatches[1];
        
        // Skip data URLs and base64 images
        if (imgSrc.startsWith('data:') || imgSrc.includes('base64')) {
          continue;
        }
        
        // Resolve the URL
        const baseUrl = new URL(url);
        imgSrc = resolveRelativeUrl(imgSrc, baseUrl);
        
        // Filter to include only image files
        if (imgSrc.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i)) {
          try {
            // Parse the URL to validate it
            new URL(imgSrc);
            images.push(imgSrc);
          } catch (urlError) {
            console.error('Invalid background image URL:', imgSrc);
          }
        }
      } catch (error) {
        console.error('Error processing background image URL:', error);
      }
    }
    
    // Check CSS in style tags
    for (const styleTag of styleTagMatches) {
      const styleContent = styleTag.replace(/<style[^>]*>|<\/style>/gi, '');
      
      while ((bgMatches = backgroundImageRegex.exec(styleContent)) !== null && images.length < 10) {
        try {
          let imgSrc = bgMatches[1];
          
          // Skip data URLs and base64 images
          if (imgSrc.startsWith('data:') || imgSrc.includes('base64')) {
            continue;
          }
          
          // Resolve the URL
          const baseUrl = new URL(url);
          imgSrc = resolveRelativeUrl(imgSrc, baseUrl);
          
          // Filter to include only image files
          if (imgSrc.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i)) {
            try {
              // Parse the URL to validate it
              new URL(imgSrc);
              images.push(imgSrc);
            } catch (urlError) {
              console.error('Invalid CSS background image URL:', imgSrc);
            }
          }
        } catch (error) {
          console.error('Error processing CSS background image URL:', error);
        }
      }
    }
    
    // Deduplicate images and take up to 10
    const uniqueImages = Array.from(new Set(images)).slice(0, 10);

    // Instead of returning raw URLs that might have CORS issues,
    // let's return URLs that point to our own proxy endpoint
    const proxiedImages = uniqueImages.map(imageUrl => {
      // Create a URL to our own proxy endpoint with the original URL encoded as a query parameter
      const encodedImageUrl = encodeURIComponent(imageUrl);
      return `/api/image-proxy?url=${encodedImageUrl}`;
    });

    return NextResponse.json({
      colors,
      fonts: Array.from(fonts),
      contentSample,
      contentSummary,
      images: proxiedImages,
      success: true
    });
  } catch (error) {
    console.error('Website scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape website', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}