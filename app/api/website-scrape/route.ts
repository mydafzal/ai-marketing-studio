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

    // Extract colors with enhanced targeting specifically for brand colors
    const colorMap = new Map<string, number>();
    
    // Helper to convert RGB/RGBA color to hex
    const rgbToHex = (r: number, g: number, b: number): string => {
      return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    };
    
    // Helper to convert HSL to RGB
    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
      // Normalize hue to [0, 360)
      h = ((h % 360) + 360) % 360 / 360;
      s = Math.max(0, Math.min(1, s / 100));
      l = Math.max(0, Math.min(1, l / 100));
      
      // Algorithm from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h * 6) % 2 - 1));
      const m = l - c / 2;
      
      let r, g, b;
      if (h < 1/6) {
        [r, g, b] = [c, x, 0];
      } else if (h < 2/6) {
        [r, g, b] = [x, c, 0];
      } else if (h < 3/6) {
        [r, g, b] = [0, c, x];
      } else if (h < 4/6) {
        [r, g, b] = [0, x, c];
      } else if (h < 5/6) {
        [r, g, b] = [x, 0, c];
      } else {
        [r, g, b] = [c, 0, x];
      }
      
      return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
      ];
    };
    
    // Helper to add a color to our map with a weight
    const addColorWithWeight = (color: string, weight: number, source: string = 'generic') => {
      // Skip empty colors
      if (!color) return;
      
      let r = 0, g = 0, b = 0;
      let normalizedColor = '';
      
      // Handle hex colors
      if (color.startsWith('#')) {
        let hexColor = color.toLowerCase();
        
        // Normalize 3-digit hex to 6-digit
        if (hexColor.length === 4) {
          hexColor = `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`;
        }
        
        // Skip if not a valid hex color
        if (!hexColor.match(/#[a-f0-9]{6}\b/)) return;
        
        // Parse RGB values
        r = parseInt(hexColor.substring(1, 3), 16);
        g = parseInt(hexColor.substring(3, 5), 16);
        b = parseInt(hexColor.substring(5, 7), 16);
        normalizedColor = hexColor;
      } 
      // Handle rgb/rgba colors
      else if (color.startsWith('rgb')) {
        // Extract RGB values using regex
        const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/i);
        if (!rgbMatch) return;
        
        r = parseInt(rgbMatch[1], 10);
        g = parseInt(rgbMatch[2], 10);
        b = parseInt(rgbMatch[3], 10);
        
        // Convert to hex format for consistent storage
        normalizedColor = rgbToHex(r, g, b);
      }
      // Handle hsl/hsla colors
      else if (color.startsWith('hsl')) {
        // Extract HSL values using regex
        const hslMatch = color.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+\s*)?\)/i);
        if (!hslMatch) return;
        
        const h = parseInt(hslMatch[1], 10);
        const s = parseInt(hslMatch[2], 10);
        const l = parseInt(hslMatch[3], 10);
        
        // Convert HSL to RGB
        [r, g, b] = hslToRgb(h, s, l);
        
        // Convert to hex format for consistent storage
        normalizedColor = rgbToHex(r, g, b);
      }
      // Skip other color formats
      else {
        return;
      }
      
      // Skip extremely bright or dark colors when found in non-critical contexts
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const isExtremeBlack = brightness < 20;
      const isExtremeWhite = brightness > 240;
      
      // Skip pure gray colors (R=G=B) in non-critical contexts
      const isGray = Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && Math.abs(r - b) < 5;
      
      // Higher-weight sources (like logos, buttons) can include borderline colors
      const isPrioritySrc = ['logo', 'button', 'cta', 'primary', 'accent', 'brand'].includes(source);
      
      // Skip non-branded colors unless they're from critical branding elements
      if ((isExtremeBlack || isExtremeWhite || isGray) && !isPrioritySrc) {
        return;
      }
      
      // Extra check for saturation to prioritize more vivid colors that are likely brand colors
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      
      // Increase weight for more saturated colors (likely intentional brand choices)
      const saturationBonus = saturation > 0.5 ? 2 : (saturation > 0.2 ? 1 : 0);
      
      // Add the color with its calculated weight
      colorMap.set(normalizedColor, (colorMap.get(normalizedColor) || 0) + weight + saturationBonus);
    };
    
    // Parse CSS variables for brand colors (these are gold for finding brand colors!)
    // Capture hex, rgb/rgba, and hsl/hsla color formats
    const cssVarRegex = /--(?:[a-zA-Z0-9_-]*(?:primary|brand|accent|theme|corporate|main|base|highlight|color)[a-zA-Z0-9_-]*)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))/gi;
    const styleContent = html.toString();
    let match;
    
    while ((match = cssVarRegex.exec(styleContent)) !== null) {
      addColorWithWeight(match[1], 15, 'css-var'); // Highest weight for CSS variables that look like brand colors
    }
    
    // Extract color roots from :root declarations
    const rootRegex = /:root\s*{([^}]*)}/gi;
    let rootMatch;
    while ((rootMatch = rootRegex.exec(styleContent)) !== null) {
      const rootContent = rootMatch[1];
      // Look for variable definitions in :root with hex, rgb/rgba, or hsl/hsla
      const rootVarRegex = /--(?:[a-zA-Z0-9_-]*(?:primary|brand|accent|theme|corporate|main|base|highlight|color)[a-zA-Z0-9_-]*)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))/gi;
      let cssVarMatch;
      while ((cssVarMatch = rootVarRegex.exec(rootContent)) !== null) {
        addColorWithWeight(cssVarMatch[1], 15, 'root-var');
      }
    }
    
    // Extract colors from elements with brand-related class/id names
    const brandElementRegex = /<[^>]*(?:class|id)\s*=\s*["'][^"']*(?:brand|logo|primary|main-header|navbar|nav-primary|cta-primary|hero)[^"']*["'][^>]*\bstyle\s*=\s*["'][^"']*\b(?:color|background(?:-color)?)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = brandElementRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 14, 'brand-element');
    }
    
    // Primary CTA buttons (extremely high weight - almost always brand colors)
    const primaryBtnRegex = /<(?:button|a)[^>]*(?:class|id)\s*=\s*["'][^"']*(?:btn-primary|primary-button|main-cta|cta-primary|primary)[^"']*["'][^>]*\bstyle\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = primaryBtnRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 13, 'primary-button');
    }
    
    // Standard buttons (high weight - often brand colors)
    const buttonColorRegex = /<button[^>]*\bstyle\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = buttonColorRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 10, 'button');
    }
    
    // Logo elements (very high weight)
    const logoRegex = /<[^>]*(?:class|id)\s*=\s*["'][^"']*(?:logo|brand)[^"']*["'][^>]*>/gi;
    let logoElement;
    while ((logoElement = logoRegex.exec(html)) !== null) {
      // Try to find background or color properties within this logo element
      const logoColorRegex = /\bstyle\s*=\s*["'][^"']*\b(?:color|background(?:-color)?)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["']/i;
      const logoColorMatch = logoElement[0].match(logoColorRegex);
      if (logoColorMatch) {
        addColorWithWeight(logoColorMatch[1], 12, 'logo');
      }
    }
    
    // Headers and hero sections (high weight)
    const headerRegex = /<(?:header|div[^>]*(?:class|id)\s*=\s*["'][^"']*(?:header|hero|banner|masthead|top-banner)[^"']*["'])[^>]*\bstyle\s*=\s*["'][^"']*\b(?:color|background(?:-color)?)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = headerRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 11, 'header');
    }
    
    // Extract and process CSS rules for colors from style tags
    const styleTagMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    for (const styleTag of styleTagMatches) {
      // Extract style content
      const styleContent = styleTag.replace(/<style[^>]*>|<\/style>/gi, '');
      
      // CSS classes that typically contain brand colors
      const brandCssRegex = /\.(?:brand|primary|logo|accent|corporate|highlight|main|cta-primary|btn-primary)[^{]*{[^}]*\b(?:color|background(?:-color)?)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = brandCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 12, 'brand-css');
      }
      
      // Primary button selectors (nearly always brand colors)
      const primaryBtnCssRegex = /\.(?:btn-primary|button-primary|primary-button|cta-primary)[^{]*{[^}]*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = primaryBtnCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 12, 'primary-btn-css');
      }
      
      // Button and CTA selectors
      const buttonCssRegex = /(?:\.btn|\.button|\.cta|button|\[type=['"]submit['"]\])[^{]*{[^}]*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = buttonCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 9, 'button-css');
      }
      
      // Header and nav selectors
      const headerCssRegex = /(?:header|\.header|nav|\.navbar|\.navigation)[^{]*{[^}]*\b(?:color|background(?:-color)?)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = headerCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 8, 'header-css');
      }
      
      // Link colors (often brand-related)
      const linkCssRegex = /(?:a|\.link)[^{]*{[^}]*\bcolor\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = linkCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 6, 'link-css');
      }
      
      // Look for accent/focus/hover states (often variations of brand colors)
      const accentCssRegex = /(?:\.active|:hover|:focus|\.focus|\.selected|\.current)[^{]*{[^}]*\b(?:color|background(?:-color)?|border-color)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = accentCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 5, 'accent-css');
      }
    }
    
    // As a fallback, also extract all hex, rgb, and hsl color codes anywhere in the document (low weight)
    const allHexColorRegex = /#([a-fA-F0-9]{3,6})\b/g;
    const allHexMatches = html.match(allHexColorRegex) || [];
    for (const color of allHexMatches) {
      addColorWithWeight(color, 1, 'fallback-hex');
    }
    
    const allRgbColorRegex = /\brgba?\([^)]+\)/g;
    const allRgbMatches = html.match(allRgbColorRegex) || [];
    for (const color of allRgbMatches) {
      addColorWithWeight(color, 1, 'fallback-rgb');
    }
    
    const allHslColorRegex = /\bhsla?\([^)]+\)/g;
    const allHslMatches = html.match(allHslColorRegex) || [];
    for (const color of allHslMatches) {
      addColorWithWeight(color, 1, 'fallback-hsl');
    }
    
    // Convert the color Map to an array of [color, weight] pairs
    let colorEntries = Array.from(colorMap.entries());
    
    // Special processing to create a harmonious color palette
    // Often websites have a primary brand color and then secondary/accent colors
    
    // Helper function to calculate color distance (simple Euclidean distance in RGB space)
    const calculateColorDistance = (colorA: string, colorB: string): number => {
      const rA = parseInt(colorA.substring(1, 3), 16);
      const gA = parseInt(colorA.substring(3, 5), 16);
      const bA = parseInt(colorA.substring(5, 7), 16);
      
      const rB = parseInt(colorB.substring(1, 3), 16);
      const gB = parseInt(colorB.substring(3, 5), 16);
      const bB = parseInt(colorB.substring(5, 7), 16);
      
      return Math.sqrt(
        Math.pow(rA - rB, 2) + 
        Math.pow(gA - gB, 2) + 
        Math.pow(bA - bB, 2)
      );
    };
    
    // Group similar colors (avoid having many variations of the same color)
    const groupedColors = new Map<string, number>();
    const COLOR_SIMILARITY_THRESHOLD = 25; // Adjust as needed
    
    // Sort by weight first (highest weight first)
    colorEntries.sort((a, b) => b[1] - a[1]);
    
    // Group similar colors, keeping the highest weighted one in each group
    for (const [color, weight] of colorEntries) {
      let foundSimilar = false;
      
      for (const [existingColor] of groupedColors.entries()) {
        const distance = calculateColorDistance(color, existingColor);
        
        if (distance < COLOR_SIMILARITY_THRESHOLD) {
          // If this color has higher weight than the existing one, replace it
          if (weight > (groupedColors.get(existingColor) || 0)) {
            groupedColors.delete(existingColor);
            groupedColors.set(color, weight);
          }
          
          foundSimilar = true;
          break;
        }
      }
      
      if (!foundSimilar) {
        groupedColors.set(color, weight);
      }
    }
    
    // Convert back to array and sort by weight again
    const finalColorEntries = Array.from(groupedColors.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Take top colors
    const colors = finalColorEntries
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