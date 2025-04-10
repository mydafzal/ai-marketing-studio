"use client"

import React, { useState, useEffect, useRef } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { IMAGE_AD_FORMATS, VIDEO_AD_FORMATS, AD_FORMAT_LABELS } from "./types"

interface AdPreviewProps {
  creativeId: string
  type: "image" | "video"
  adFormat?: string
}

export const AdPreview: React.FC<AdPreviewProps> = ({ creativeId, type, adFormat: propsAdFormat }) => {
  const [adFormat, setAdFormat] = useState(propsAdFormat || (type === 'video' ? 'INSTAGRAM_REELS' : 'INSTAGRAM_STANDARD'))
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const formats = type === 'video' ? VIDEO_AD_FORMATS : IMAGE_AD_FORMATS

  // Process HTML to prevent auto-scaling/resizing and hide scrollbars
  const processHtml = (html: string) => {
    // First, check if the HTML contains the Instagram Actor ID error message and replace it with a blank preview
    if (html.includes('Instagram Actor ID is required') || html.includes('Select an Instagram account')) {
      // Return a simple placeholder that won't show the error
      return `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: #1A1D29;
                color: white;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .preview-placeholder {
                width: 313px;
                height: 534px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                text-align: center;
                padding: 1rem;
                position: relative;
              }
              .ad-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
              }
              .ad-text {
                font-size: 14px;
                color: #ccc;
              }
            </style>
          </head>
          <body>
            <div class="preview-placeholder">
              <div class="ad-title">Ad Preview</div>
              <div class="ad-text">Ad preview will appear here</div>
            </div>
          </body>
        </html>
      `;
    }
    
    return html
      .replace(/(<iframe[^>]*)(width="[^"]*"|height="[^"]*")/g, '$1')
      .replace(/(<iframe[^>]*)(style="[^"]*")/g, (match, p1, p2) => {
        return p1 + 'style="width:313px;height:534px;border:none;overflow:hidden;-ms-overflow-style:none;scrollbar-width:none;"';
      })
      .replace(/(<iframe[^>]*)(scrolling="[^"]*")/g, '$1 scrolling="no"')
      .replace(/scale\([^)]*\)/g, 'scale(1)')
      .replace(/transform:[^;]*;/g, 'transform:none;')
      .replace(/zoom:[^;]*;/g, 'zoom:1;')
      // Add CSS to hide scrollbars
      .replace(/<head>/g, '<head><style>::-webkit-scrollbar{display:none;width:0;height:0;}body::-webkit-scrollbar{display:none;}</style>');
  };

  useEffect(() => {
    const fetchPreview = async () => {
      if (!creativeId) return

      setIsLoading(true)
      setError(null)

      try {
        // Add a small delay to ensure account credentials are loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creativeId}&ad_format=${adFormat}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch preview: ${response.statusText}`)
        }

        const data = await response.json()
        if (data.success && data.preview_html) {
          // Pre-process HTML to prevent scaling issues
          setPreviewHtml(processHtml(data.preview_html))
        } else {
          throw new Error("Preview data not available")
        }
      } catch (err) {
        console.error("Error fetching preview:", err)
        setError(err instanceof Error ? err.message : "Failed to load preview")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [creativeId, adFormat])

  // Safely render HTML content
  const renderHtml = () => {
    return { __html: previewHtml }
  }

  // Update adFormat when propsAdFormat changes
  useEffect(() => {
    if (propsAdFormat && propsAdFormat !== adFormat) {
      setAdFormat(propsAdFormat);
    }
  }, [propsAdFormat, adFormat]);

  // Modify iframes to be fixed size
  useEffect(() => {
    if (previewRef.current && !isLoading && previewHtml) {
      const iframes = previewRef.current.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        // Set fixed dimensions
        iframe.setAttribute('scrolling', 'no');
        iframe.style.width = '313px';
        iframe.style.height = '534px';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.transform = 'none';
        iframe.style.transition = 'none';
        // Add CSS to hide scrollbars
        iframe.style.setProperty('-ms-overflow-style', 'none'); // IE and Edge
        iframe.style.scrollbarWidth = 'none'; // Firefox
        
        // Handle load event to reapply styles
        iframe.onload = () => {
          // Force the iframe to maintain our dimensions
          iframe.style.width = '313px';
          iframe.style.height = '534px';
          iframe.style.transform = 'none';
          
          // Try to access iframe content if possible
          try {
            if (iframe.contentWindow && iframe.contentWindow.document) {
              const doc = iframe.contentWindow.document;
              const style = doc.createElement('style');
              style.textContent = `
                html, body { 
                  width: 313px !important; 
                  height: 534px !important; 
                  transform: none !important; 
                  zoom: 1 !important;
                  overflow: hidden !important;
                  -ms-overflow-style: none !important;
                  scrollbar-width: none !important;
                }
                ::-webkit-scrollbar {
                  display: none !important;
                  width: 0 !important;
                  height: 0 !important;
                }
              `;
              doc.head.appendChild(style);
            }
          } catch (e) {
            console.log("Couldn't access iframe content:", e);
          }
        };
      });
    }
  }, [previewHtml, isLoading]);

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <div className="relative w-[313px] mx-auto bg-[#0F1117] rounded-md overflow-hidden min-h-[534px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center size-full">
            <div className="animate-spin rounded-full size-12 border-b-2 border-[#4BF29C]"></div>
          </div>
        ) : error ? (
          <div className="text-[#FF7D5A] p-4 text-center">
            {error}
          </div>
        ) : (
          <div 
            ref={previewRef}
            className="size-full flex items-center justify-center" 
            dangerouslySetInnerHTML={renderHtml()} 
            style={{ 
              width: '313px',
              height: '534px',
              overflow: 'hidden',
              transformOrigin: '0 0',
              transform: 'none',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          />
        )}
      </div>
      <div className="text-[#8A8F99] text-xs">
        {adFormat && AD_FORMAT_LABELS[adFormat as keyof typeof AD_FORMAT_LABELS]} Preview
      </div>
    </div>
  )
}