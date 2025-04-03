"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Award, 
  Eye, 
  EyeOff, 
  Eye as EyeIcon,
} from "lucide-react"
import { AdCreative, formatAdName } from "./types"

interface CreativeDisplayProps {
  creative: AdCreative
  isTopPerformer: boolean
  isSecondBest: boolean
  onViewDetails: () => void
  onTogglePublish: () => void
}

export const CreativeDisplay: React.FC<CreativeDisplayProps> = ({
  creative,
  isTopPerformer,
  isSecondBest,
  onViewDetails,
  onTogglePublish,
}) => {
  // Allow selecting different formats instead of a fixed one
  const initialFormat = creative.type === 'video' ? 'INSTAGRAM_STANDARD' : 'INSTAGRAM_STANDARD'
  const [adFormat, setAdFormat] = useState<string>(initialFormat)
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  
  // Get the appropriate formats based on creative type
  const formats = creative.type === 'video' ? [
    "INSTAGRAM_STANDARD",
    "INSTAGRAM_STORY",
    "INSTAGRAM_EXPLORE_GRID_HOME",
    "INSTAGRAM_REELS",
    "FACEBOOK_PROFILE_FEED_MOBILE",
    "FACEBOOK_STORY_MOBILE",
    "FACEBOOK_REELS_MOBILE"
  ] : [
    "INSTAGRAM_STANDARD",
    "INSTAGRAM_STORY",
    "INSTAGRAM_EXPLORE_GRID_HOME",
    "FACEBOOK_PROFILE_FEED_MOBILE",
    "FACEBOOK_STORY_MOBILE"
  ]

  // Process HTML to prevent auto-scaling/resizing and hide scrollbars
  const processHtml = (html: string) => {
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

  // Update fetch function to use current adFormat
  const fetchPreview = useCallback(async () => {
    if (!creative.id) return
    
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Fetching preview for creative ${creative.id} with format ${adFormat}`)
      const response = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creative.id}&ad_format=${adFormat}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}):`, errorText)
        throw new Error(`Failed to fetch preview: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Handle possible response formats from the campaign-creation-flow endpoint
        let html = "";
        if (data.preview_html) {
          html = data.preview_html;
        } else if (data.response_data?.data?.[0]?.body) {
          html = data.response_data.data[0].body;
        } else {
          throw new Error("No preview HTML found in response")
        }
        
        // Check for Instagram Actor ID error
        if (html.includes('Instagram Actor ID is required') || html.includes('Select an Instagram account')) {
          // Return a simple placeholder that won't show the error
          html = `
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
                  <div class="ad-title">${creative.name}</div>
                  <div class="ad-text">Preview not available for this format</div>
                </div>
              </body>
            </html>
          `;
        }
        
        // Pre-process HTML to prevent scaling issues
        setPreviewHtml(processHtml(html))
      } else {
        console.error("Preview data invalid structure:", data)
        throw new Error(data.error || data.details || "Preview data not available")
      }
    } catch (err) {
      console.error("Error fetching preview:", err)
      setError(err instanceof Error ? err.message : "Failed to load preview")
    } finally {
      setIsLoading(false)
    }
  }, [creative.id, adFormat, creative.name])

  // Fetch preview when component mounts or format changes
  useEffect(() => {
    fetchPreview()
  }, [fetchPreview])

  // Safely render HTML content
  const renderHtml = () => {
    return { __html: previewHtml }
  }

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

  // Format truncated name
  const truncatedName = formatAdName(creative.name).length > 10 
    ? `${formatAdName(creative.name).substring(0, 10)}...` 
    : formatAdName(creative.name)

  return (
    <div
      className={`
        group mx-auto flex w-full flex-col
        overflow-hidden rounded-xl
        border border-[#2A2E3A] transition-all duration-300 hover:shadow-xl
        bg-[#0A0C14] 
        hover:scale-[1.02]
        ${
          isTopPerformer
            ? "bg-gradient-to-r from-[#151925] to-[#1A1D29] ring-1 ring-[#4BF29C]/30"
            : isSecondBest
            ? "bg-gradient-to-r from-[#151925] to-[#1A1D29] ring-1 ring-[#FF7D5A]/30"
            : "bg-[#0A0C14] shadow-lg"
        }
      `}
    >
      {/* HEADER: Title & Badges */}
      <div className="border-b border-[#2A2E3A] px-5 py-3">
        <div className="flex items-center space-x-2 mb-3">
          <h5 className="text-lg font-semibold text-white">
            {truncatedName}
          </h5>
          <Badge
            className={`
              text-xs font-medium ml-2
              ${
                creative.status === "ACTIVE"
                  ? "bg-[#4BF29C]/15 text-[#4BF29C] border border-[#4BF29C]/30"
                  : "bg-[#1A1D29] text-[#ADB0B8] border border-[#2A2E3A]"
              }
            `}
          >
            {creative.status === "ACTIVE" ? "Active" : "Inactive"}
          </Badge>
          
          {/* Performance badges */}
          {isTopPerformer && (
            <Badge className="bg-gradient-to-r from-[#4BF29C]/60 to-[#4BF29C]/40 ml-1 text-[#0A0C14]">
              <Award className="size-3 mr-1" />
              Top Performer
            </Badge>
          )}
          {isSecondBest && !isTopPerformer && (
            <Badge className="bg-gradient-to-r from-[#FF7D5A]/60 to-[#FF7D5A]/40 ml-1 text-[#0A0C14]">
              <Award className="size-3 mr-1" />
              Runner Up
            </Badge>
          )}
        </div>
        
        {/* Action buttons - moved below title */}
        <div className="flex space-x-2">
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="bg-[#151925] border-[#2A2E3A] text-[#ADB0B8] hover:bg-[#1A1D29] hover:text-white"
          >
            <Eye className="mr-1.5 size-4" />
            Details
          </Button>
          <Button
            onClick={onTogglePublish}
            variant={creative.status === "ACTIVE" ? "destructive" : "default"}
            size="sm"
            className={`
              ${
                creative.status !== "ACTIVE"
                ? "bg-[#4BF29C] hover:bg-[#4BF29C]/90 text-[#0A0C14]"
                : "bg-[#FF7D5A] hover:bg-[#FF7D5A]/90 text-[#0A0C14]"
              }
            `}
          >
            {creative.status === "ACTIVE" ? (
              <>
                <EyeOff className="mr-1.5 size-4" />
                Pause
              </>
            ) : (
              <>
                <EyeIcon className="mr-1.5 size-4" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* BODY: Full-width Preview */}
      <div className="relative p-4">
        {/* Vertical accent line */}
        <div className="absolute left-0 top-0 w-1 h-full bg-[#4BF29C]/20"></div>
        
        {/* Format selector */}
        <div className="mb-4 mx-auto" style={{ width: '313px' }}>
          <select
            value={adFormat}
            onChange={(e) => setAdFormat(e.target.value)}
            className="w-full bg-[#1A1D29] border border-[#2A2E3A] text-white p-2 rounded-md text-sm"
            aria-label="Ad format"
          >
            {formats.map(format => (
              <option key={format} value={format}>
                {format === "INSTAGRAM_STANDARD" ? "Instagram Feed" :
                 format === "INSTAGRAM_STORY" ? "Instagram Story" :
                 format === "INSTAGRAM_EXPLORE_GRID_HOME" ? "Instagram Explore" :
                 format === "INSTAGRAM_REELS" ? "Instagram Reels" :
                 format === "FACEBOOK_PROFILE_FEED_MOBILE" ? "Facebook Feed" :
                 format === "FACEBOOK_STORY_MOBILE" ? "Facebook Story" :
                 format === "FACEBOOK_REELS_MOBILE" ? "Facebook Reels" : format}
              </option>
            ))}
          </select>
        </div>
        
        <div className="h-full w-[313px] mx-auto flex items-center justify-center bg-[#0F1117] rounded-md overflow-hidden min-h-[534px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4BF29C]"></div>
            </div>
          ) : error ? (
            <div className="text-[#FF7D5A] p-4 text-center">
              {error}
            </div>
          ) : (
            <div 
              ref={previewRef}
              className="w-full h-full flex items-center justify-center" 
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
      </div>
    </div>
  )
}