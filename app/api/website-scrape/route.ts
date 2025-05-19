import { NextRequest, NextResponse } from 'next/server';

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
    
    // Use block_resources=false to ensure we can get images
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodedUrl}&render_js=true&block_resources=false`;

    // Make the request to ScrapingBee
    const response = await fetch(scrapingBeeUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to scrape website: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Extract hex color codes
    const colorRegex = /#([a-fA-F0-9]{3}){1,2}\b/g;
    const colors = Array.from(new Set(html.match(colorRegex) || []));

    // Extract font information
    const fontFamilyRegex = /font-family:\s*([^;}]+)/g;
    let fontMatches;
    const fonts = new Set();
    while ((fontMatches = fontFamilyRegex.exec(html)) !== null) {
      if (fontMatches[1]) {
        fonts.add(fontMatches[1].trim());
      }
    }

    // Extract a sample of the content text
    const bodyText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const contentSample = bodyText.substring(0, 500) + (bodyText.length > 500 ? '...' : '');
    
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
    
    while ((imgMatches = imgRegex.exec(html)) !== null && images.length < 5) {
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
    
    // Deduplicate images
    const uniqueImages = Array.from(new Set(images)).slice(0, 5);

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