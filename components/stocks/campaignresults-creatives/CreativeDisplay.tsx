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
  // Use a fixed format to ensure we only fetch once
  const defaultFormat = creative.type === 'video' ? 'INSTAGRAM_REELS' : 'INSTAGRAM_REELS'
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

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

  // Keep the same fetch function but with fixed format
  const fetchPreview = useCallback(async () => {
    if (!creative.id) return
    
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Fetching preview for creative ${creative.id} with format ${defaultFormat}`)
      const response = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creative.id}&ad_format=${defaultFormat}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}):`, errorText)
        throw new Error(`Failed to fetch preview: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Preview response:", data)
      
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
  }, [creative.id, defaultFormat])

  // Only fetch once when component mounts
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
        border border-zinc-700 transition-all duration-300 hover:shadow-xl
        bg-[#111318] 
        hover:scale-[1.01]
        ${
          isTopPerformer
            ? "bg-gradient-to-r from-[#131419] to-[#151822] ring-2 ring-[#4AE04A]/40"
            : isSecondBest
            ? "bg-gradient-to-r from-[#131419] to-[#151720] ring-2 ring-blue-500/30"
            : "bg-[#111318] shadow-lg"
        }
      `}
    >
      {/* HEADER: Title & Badges */}
      <div className="border-b border-zinc-700/70 px-5 py-3">
        <div className="flex items-center space-x-2 mb-3">
          <h5 className="text-lg font-semibold text-white">
            {truncatedName}
          </h5>
          <Badge
            className={`
              text-xs font-medium ml-2
              ${
                creative.status === "ACTIVE"
                  ? "bg-[#4AE04A]/20 text-[#4AE04A] border border-[#4AE04A]/30"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-600"
              }
            `}
          >
            {creative.status === "ACTIVE" ? "Active" : "Inactive"}
          </Badge>
          
          {/* Performance badges */}
          {isTopPerformer && (
            <Badge className="bg-gradient-to-r from-[#4AE04A]/80 to-[#4AE04A]/60 ml-1 text-black">
              <Award className="size-3 mr-1" />
              Top Performer
            </Badge>
          )}
          {isSecondBest && !isTopPerformer && (
            <Badge className="bg-gradient-to-r from-blue-400/80 to-blue-500/60 ml-1 text-black">
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
            className="bg-[#1A1C24] border-zinc-700 text-zinc-200 hover:bg-[#22252F] hover:text-white"
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
                ? "bg-[#4AE04A]/90 hover:bg-[#4AE04A] text-black"
                : "bg-red-600 hover:bg-red-700 text-white"
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
        <div className="absolute left-0 top-0 w-1 h-full bg-[#4AE04A]/30"></div>
        
        <div className="h-full w-[313px] mx-auto flex items-center justify-center bg-[#111318] rounded-md overflow-hidden min-h-[534px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4AE04A]"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 p-4 text-center">
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