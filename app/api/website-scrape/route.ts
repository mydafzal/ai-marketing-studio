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
    const addColorWithWeight = (color: string, weight: number, source: string = 'generic', elementContext: string = '') => {
      // Skip empty colors
      if (!color) return;
      
      // CRITICAL: Explicitly reject any colors from image elements or contexts
      // This ensures we NEVER extract colors from images except logos
      if (
        (elementContext.includes('<img') || 
         elementContext.includes('background-image') || 
         source.includes('image')) && 
        !source.includes('logo')
      ) {
        return;
      }
      
      // Only consider brand-relevant sources according to user requirements:
      // button colors, headline colors, text colors, background colors, and logo colors
      const allowedSources = [
        'button', 'primary-button', 'button-css', 'primary-btn-css',
        'header', 'header-css', 'heading-text',
        'text', 'paragraph', 'body-text',
        'background', 'main-background',
        'logo', 'brand-element'
      ];
      
      // Skip if not from one of the specifically allowed sources
      if (!allowedSources.includes(source) && 
          // Also include sources that contain these keywords
          !source.includes('button') && 
          !source.includes('heading') && 
          !source.includes('text') && 
          !source.includes('background') && 
          !source.includes('logo')) {
        return;
      }
      
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
      
      // Higher-weight sources can include borderline colors
      const isPrioritySrc = ['logo', 'button', 'heading-text', 'main-background'].includes(source);
      
      // Skip non-branded colors unless they're from critical branding elements
      if ((isExtremeBlack || isExtremeWhite || isGray) && !isPrioritySrc) {
        return;
      }
      
      // Extra check for saturation to prioritize more vivid colors that are likely brand colors
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      
      // Add source-specific weight adjustments
      let sourceBonus = 0;
      if (source.includes('logo')) {
        // Logo colors get highest priority
        sourceBonus += 5;
      } else if (source.includes('button')) {
        // Button colors are usually brand colors
        sourceBonus += 3;
      } else if (source.includes('heading')) {
        // Headings often use brand colors
        sourceBonus += 2;
      }
      
      // Increase weight for more saturated colors (likely intentional brand choices)
      const saturationBonus = saturation > 0.5 ? 2 : (saturation > 0.2 ? 1 : 0);
      
      // Add the color with its calculated weight and bonuses
      colorMap.set(normalizedColor, (colorMap.get(normalizedColor) || 0) + weight + sourceBonus + saturationBonus);
    };
    
    // Parse CSS variables for brand colors but only those related to buttons, headings, text, backgrounds, and logos
    // Capture hex, rgb/rgba, and hsl/hsla color formats
    const cssVarRegex = /--(?:[a-zA-Z0-9_-]*(?:button|btn|heading|title|text|background|bg|logo|brand)[a-zA-Z0-9_-]*)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))/gi;
    const styleContent = html.toString();
    let match;
    
    while ((match = cssVarRegex.exec(styleContent)) !== null) {
      const varName = match[0].toLowerCase();
      let sourceType;
      
      // Assign appropriate source based on CSS variable name
      if (varName.includes('button') || varName.includes('btn')) {
        sourceType = 'button';
      } else if (varName.includes('heading') || varName.includes('title')) {
        sourceType = 'heading-text';
      } else if (varName.includes('text')) {
        sourceType = 'text';
      } else if (varName.includes('background') || varName.includes('bg')) {
        sourceType = 'background';
      } else if (varName.includes('logo') || varName.includes('brand')) {
        sourceType = 'logo';
      } else {
        // Skip if not related to our target categories
        continue;
      }
      
      addColorWithWeight(match[1], 15, sourceType);
    }
    
    // Extract color roots from :root declarations
    const rootRegex = /:root\s*{([^}]*)}/gi;
    let rootMatch;
    while ((rootMatch = rootRegex.exec(styleContent)) !== null) {
      const rootContent = rootMatch[1];
      // Look for variable definitions in :root with hex, rgb/rgba, or hsl/hsla
      // Only target variables related to buttons, headings, text, backgrounds, and logos
      const rootVarRegex = /--(?:[a-zA-Z0-9_-]*(?:button|btn|heading|title|text|background|bg|logo|brand)[a-zA-Z0-9_-]*)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))/gi;
      let cssVarMatch;
      while ((cssVarMatch = rootVarRegex.exec(rootContent)) !== null) {
        const varName = cssVarMatch[0].toLowerCase();
        let sourceType;
        
        // Assign appropriate source based on CSS variable name
        if (varName.includes('button') || varName.includes('btn')) {
          sourceType = 'button';
        } else if (varName.includes('heading') || varName.includes('title')) {
          sourceType = 'heading-text';
        } else if (varName.includes('text')) {
          sourceType = 'text';
        } else if (varName.includes('background') || varName.includes('bg')) {
          sourceType = 'background';
        } else if (varName.includes('logo') || varName.includes('brand')) {
          sourceType = 'logo';
        } else {
          // Skip if not related to our target categories
          continue;
        }
        
        addColorWithWeight(cssVarMatch[1], 15, sourceType);
      }
    }
    
    // Logo elements (highest priority)
    const logoRegex = /<[^>]*(?:class|id)\s*=\s*["'][^"']*(?:logo|brand)[^"']*["'][^>]*>/gi;
    let logoElement;
    while ((logoElement = logoRegex.exec(html)) !== null) {
      // Try to find background or color properties within this logo element
      const logoColorRegex = /\bstyle\s*=\s*["'][^"']*\b(?:color|background(?:-color)?)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["']/i;
      const logoColorMatch = logoElement[0].match(logoColorRegex);
      if (logoColorMatch) {
        // Pass the element context to check if it contains image references
        addColorWithWeight(logoColorMatch[1], 15, 'logo', logoElement[0]);
      }
    }
    
    // Button elements (high priority)
    // Primary buttons
    const primaryBtnRegex = /<(?:button|a)[^>]*(?:class|id)\s*=\s*["'][^"']*(?:btn-primary|primary-button|main-cta|cta-primary|primary)[^"']*["'][^>]*\bstyle\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = primaryBtnRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 14, 'button', match[0]);
    }
    
    // Standard buttons
    const buttonColorRegex = /<button[^>]*\bstyle\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = buttonColorRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 12, 'button', match[0]);
    }
    
    // Button text colors
    const buttonTextColorRegex = /<button[^>]*\bstyle\s*=\s*["'][^"']*\bcolor\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = buttonTextColorRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 10, 'button', match[0]);
    }
    
    // Headline colors - h1, h2, h3 elements
    const headlineRegex = /<h[1-3][^>]*\bstyle\s*=\s*["'][^"']*\bcolor\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = headlineRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 13, 'heading-text', match[0]);
    }
    
    // Header background colors
    const headerBgRegex = /<(?:header|div[^>]*(?:class|id)\s*=\s*["'][^"']*(?:header|hero|banner|masthead|top-banner)[^"']*["'])[^>]*\bstyle\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = headerBgRegex.exec(html)) !== null) {
      // Skip if the header contains an image background (we only want solid color backgrounds)
      if (!match[0].includes('background-image') && !match[0].includes('<img')) {
        addColorWithWeight(match[1], 11, 'background', match[0]);
      }
    }
    
    // Text colors
    const textColorRegex = /<(?:p|span|div|a)[^>]*\bstyle\s*=\s*["'][^"']*\bcolor\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = textColorRegex.exec(html)) !== null) {
      addColorWithWeight(match[1], 9, 'text', match[0]);
    }
    
    // Background colors of main elements
    const mainBgRegex = /<(?:body|main|div[^>]*(?:class|id)\s*=\s*["'][^"']*(?:main|content|container|wrapper|page)[^"']*["'])[^>]*\bstyle\s*=\s*["'][^"']*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^"']*["'][^>]*>/gi;
    while ((match = mainBgRegex.exec(html)) !== null) {
      // Skip if the element contains an image background
      if (!match[0].includes('background-image') && !match[0].includes('<img')) {
        addColorWithWeight(match[1], 10, 'background', match[0]);
      }
    }
    
    // Extract and process CSS rules for colors from style tags
    const styleTagMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    for (const styleTag of styleTagMatches) {
      // Extract style content
      const styleContent = styleTag.replace(/<style[^>]*>|<\/style>/gi, '');
      
      // Skip stylesheets that seem to be for images or non-UI content
      if (
        styleContent.includes('background-image') && 
        (styleContent.includes('.jpg') || 
         styleContent.includes('.png') || 
         styleContent.includes('.gif') || 
         styleContent.includes('.svg'))
      ) {
        continue;
      }
      
      // Logo selectors - very high priority
      const logoCssRegex = /(?:\.logo|#logo|\[class\*="logo"]|\[id\*="logo"]|\.brand|#brand)[^{]*{[^}]*\b(?:color|background(?:-color)?)\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = logoCssRegex.exec(styleContent)) !== null) {
        // Skip if the rule includes background-image
        if (!match[0].includes('background-image')) {
          addColorWithWeight(match[1], 15, 'logo', match[0]);
        }
      }
      
      // Primary Button selectors - high priority
      const primaryBtnCssRegex = /\.(?:btn-primary|button-primary|primary-button|cta-primary|primary-btn)[^{]*{[^}]*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = primaryBtnCssRegex.exec(styleContent)) !== null) {
        // Skip if the rule includes background-image
        if (!match[0].includes('background-image')) {
          addColorWithWeight(match[1], 14, 'button', match[0]);
        }
      }
      
      // Standard Button selectors
      const buttonCssRegex = /(?:\.btn|\.button|button|\[type=['"]submit['"]\])[^{]*{[^}]*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = buttonCssRegex.exec(styleContent)) !== null) {
        // Skip if the rule includes background-image
        if (!match[0].includes('background-image')) {
          addColorWithWeight(match[1], 12, 'button', match[0]);
        }
      }
      
      // Button text colors
      const buttonTextCssRegex = /(?:\.btn|\.button|button|\[type=['"]submit['"]\])[^{]*{[^}]*\bcolor\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = buttonTextCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 10, 'button', match[0]);
      }
      
      // Headline selectors
      const headlineCssRegex = /(?:h1|h2|h3|\.heading|\.title|\.headline)[^{]*{[^}]*\bcolor\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = headlineCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 13, 'heading-text', match[0]);
      }
      
      // Text selectors
      const textCssRegex = /(?:p|\.text|body|\.body-text)[^{]*{[^}]*\bcolor\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = textCssRegex.exec(styleContent)) !== null) {
        addColorWithWeight(match[1], 9, 'text', match[0]);
      }
      
      // Background selectors - only solid background colors, not images
      const backgroundCssRegex = /(?:body|main|\.container|\.wrapper|\.content|#main|#content)[^{]*{[^}]*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = backgroundCssRegex.exec(styleContent)) !== null) {
        // Skip if the rule includes background-image
        if (!match[0].includes('background-image')) {
          addColorWithWeight(match[1], 10, 'background', match[0]);
        }
      }
      
      // Header background selectors - only solid background colors
      const headerCssRegex = /(?:header|\.header|\.hero|\.banner)[^{]*{[^}]*\bbackground(?:-color)?\s*:\s*((?:#[a-fA-F0-9]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\)))[^}]*}/gi;
      while ((match = headerCssRegex.exec(styleContent)) !== null) {
        // Skip if the rule includes background-image
        if (!match[0].includes('background-image')) {
          addColorWithWeight(match[1], 11, 'background', match[0]);
        }
      }
    }
    
    // We're removing the fallback color extraction that scans the entire document
    // This way we only get colors from the specific UI elements requested
    // No fallback extraction means we won't accidentally include colors from images
    
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
      
      for (const [existingColor, existingWeight] of Array.from(groupedColors.entries())) {
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
    
    // Define a confidence threshold - colors with weight below this are not considered brand colors
    // This ensures we only return colors we're confident about
    const BRAND_COLOR_CONFIDENCE_THRESHOLD = 10;
    
    // For debugging: console log the color weights
    console.log('Found color candidates with weights:');
    finalColorEntries.forEach(([color, weight]) => {
      console.log(`${color}: ${weight}`);
    });
    
    // First, get all colors that meet our confidence threshold
    const confidentColors = finalColorEntries
      .filter(([_, weight]) => weight >= BRAND_COLOR_CONFIDENCE_THRESHOLD)
      .map(([color]) => color);
    
    // Log how many colors met our confidence threshold  
    console.log(`Found ${confidentColors.length} brand colors that meet confidence threshold.`);
    
    // Take only the top 3 colors that meet our threshold
    let colors = confidentColors.slice(0, 3);
    
    // If we don't have at least one color that meets our threshold, take the top one
    // But only if it has a minimum acceptable weight
    if (colors.length === 0 && finalColorEntries.length > 0) {
      const topColorWeight = finalColorEntries[0][1];
      if (topColorWeight >= 8) { // Only use top color if it has at least some reasonable weight
        colors.push(finalColorEntries[0][0]);
        console.log(`Added top color as fallback: ${finalColorEntries[0][0]} with weight ${topColorWeight}`);
      }
    }
    
    // If we have fewer than 3 colors but at least one, log that we're only using what we found
    if (colors.length > 0 && colors.length < 3) {
      console.log(`Only found ${colors.length} confident brand colors, will only use these for ad creatives`);
    }
    
    // Log the final selected colors
    console.log('Final colors selected for ad creatives:');
    colors.forEach(color => console.log(color));

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