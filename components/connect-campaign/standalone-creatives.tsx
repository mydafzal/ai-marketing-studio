'use client'

import { toggleAdCreativeStatus } from "@/app/api/fasty-bot/toggle-ad-creative-status";
import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react"
import Image from "next/image"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Award, ChevronLeft, ChevronRight, ThumbsUp, Eye, Clock, DollarSign, Target, Brain, Users, Sparkles, BarChart3, Zap } from "lucide-react"
import { StandaloneCampaignContext } from "@/components/connect-campaign/standalone-context"
import { VideoPlayer } from "@/components/stocks/video-player"

// Import your existing metrics function & types
import { getAllAdMetricsByCampaignId } from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"

// Import sub-components
import { AdPreview } from "../stocks/campaignresults-creatives/AdPreview"
import { EnhancedMetricItem } from "../stocks/campaignresults-creatives/EnhancedMetricItem"
import { 
  AdCreative, 
  RawCreative, 
  getPerformanceScore, 
  getCombinedMetrics,
  IMAGE_AD_FORMATS, 
  VIDEO_AD_FORMATS, 
  AD_FORMAT_LABELS 
} from "../stocks/campaignresults-creatives/types"

const FB_API_KEY = process.env.NEXT_PUBLIC_FB_API_KEY || ""

// Applying new style variables
const STYLES = {
  colors: {
    background: "#0D1117",
    cardBg: "#1E2433",
    primary: "#4FD1C5", // Teal/aqua
    secondary: "#F8836B", // Coral/peach
    purple: "#9F7AEA",
    blue: "#63B3ED",
    green: "#68D391",
    text: "#FFFFFF",
    textSecondary: "#A0AEC0",
    border: "#2D3748",
  },
  borderRadius: "0.75rem",
  spacing: {
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  }
};

// Creative Card Props Interface
interface CreativeCardProps {
  creative: AdCreative;
  isTopPerformer: boolean;
  isSecondBest: boolean;
  onTogglePublish: () => void;
  windowWidth: number;
}

// Custom styled Creative Card component - now vertical
const CreativeCard = ({ creative, isTopPerformer, isSecondBest, onTogglePublish, windowWidth }: CreativeCardProps) => {
  // Determine status badge color
  const statusColor = creative.status === "ACTIVE" 
    ? STYLES.colors.green 
    : "#8A8F99";
  
  // Determine performance badge
  const performanceBadge = isTopPerformer ? {
    text: "Top Performer",
    color: STYLES.colors.green
  } : isSecondBest ? {
    text: "Runner Up",
    color: STYLES.colors.blue
  } : null;

  return (
    <div style={{
      backgroundColor: STYLES.colors.cardBg,
      borderRadius: STYLES.borderRadius,
      border: `1px solid ${STYLES.colors.border}`,
      height: "100%", 
      minHeight: windowWidth < 640 ? "700px" : "800px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Status badge & Performance badge - Top header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        padding: STYLES.spacing.md,
        borderBottom: `1px solid ${STYLES.colors.border}`
      }}>
        <div style={{ 
          backgroundColor: `${statusColor}20`,
          color: statusColor,
          padding: `${STYLES.spacing.sm} ${STYLES.spacing.md}`,
          borderRadius: "1rem",
          fontSize: "0.75rem",
          fontWeight: 500,
          display: "inline-block"
        }}>
          {creative.status}
        </div>
        
        {performanceBadge && (
          <div style={{ 
            backgroundColor: `${performanceBadge.color}20`,
            color: performanceBadge.color,
            padding: `${STYLES.spacing.sm} ${STYLES.spacing.md}`,
            borderRadius: "1rem",
            fontSize: "0.75rem",
            fontWeight: 500,
            display: "inline-block"
          }}>
            {performanceBadge.text}
          </div>
        )}
      </div>
      
      {/* Creative Preview Section */}
      <div style={{ 
        backgroundColor: STYLES.colors.background,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: `1px solid ${STYLES.colors.border}`,
        minHeight: "534px"
      }}>
        <AdPreview 
          creativeId={creative.id} 
          type={creative.type} 
          adFormat={creative.type === "video" ? "INSTAGRAM_REELS" : "INSTAGRAM_STANDARD"} 
        />
      </div>
      
      {/* Creative Info Section */}
      <div style={{ 
        padding: STYLES.spacing.md,
        borderBottom: `1px solid ${STYLES.colors.border}`
      }}>
        <h3 style={{ 
          fontSize: "1.25rem", 
          fontWeight: 600, 
          marginBottom: STYLES.spacing.sm,
          color: STYLES.colors.text,
          fontFamily: "'Inter', 'SF Pro Display', sans-serif",
          lineHeight: 1.2
        }}>
          {creative.name}
        </h3>
        
        <p style={{ 
          fontSize: "0.875rem", 
          color: STYLES.colors.textSecondary,
          // Limit to 2 lines with ellipsis
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
          height: "2.5rem" // Approximately 2 lines
        }}>
          {creative.type === "video"
            ? creative.object_story_spec?.video_data?.message || "No description available"
            : creative.object_story_spec?.link_data?.message || "No description available"}
        </p>
      </div>
      
      {/* Metrics Grid */}
      <div style={{ 
        padding: STYLES.spacing.md,
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ 
          display: "grid",
          gridTemplateColumns: windowWidth < 400 ? "repeat(1, 1fr)" : "repeat(2, 1fr)",
          gap: windowWidth < 400 ? STYLES.spacing.sm : STYLES.spacing.md,
          marginBottom: STYLES.spacing.md
        }}>
          <MetricCard 
            icon={<Eye size={16} style={{ color: STYLES.colors.primary }} />}
            label="Impressions" 
            value={creative.metrics.impressions.toLocaleString()} 
          />
          <MetricCard 
            icon={<Users size={16} style={{ color: STYLES.colors.purple }} />}
            label="Reach" 
            value={creative.metrics.reach.toLocaleString()} 
          />
          <MetricCard 
            icon={<ThumbsUp size={16} style={{ color: STYLES.colors.secondary }} />}
            label="Engagement" 
            value={creative.metrics.engagement.toLocaleString()} 
          />
          <MetricCard 
            icon={<Clock size={16} style={{ color: STYLES.colors.green }} />}
            label="Frequency" 
            value={creative.metrics.frequency.toFixed(2)} 
          />
          <MetricCard 
            icon={<DollarSign size={16} style={{ color: STYLES.colors.green }} />}
            label="CPC" 
            value={`$${creative.metrics.costPerClick.toFixed(2)}`} 
          />
          <MetricCard 
            icon={<Target size={16} style={{ color: STYLES.colors.blue }} />}
            label="CTR" 
            value={`${creative.metrics.clickThroughRate.toFixed(2)}%`} 
          />
        </div>
      </div>
      
      {/* Button Section */}
      <div style={{ 
        padding: STYLES.spacing.md,
        borderTop: `1px solid ${STYLES.colors.border}`
      }}>
        <button
          onClick={onTogglePublish}
          style={{
            backgroundColor: "transparent",
            border: `1px solid ${STYLES.colors.border}`,
            borderRadius: STYLES.borderRadius,
            padding: `${STYLES.spacing.sm} ${STYLES.spacing.md}`,
            color: STYLES.colors.textSecondary,
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s",
            width: "100%",
            fontWeight: 500
          }}
        >
          {creative.status === "ACTIVE" ? "Pause Creative" : "Activate Creative"}
        </button>
      </div>
    </div>
  );
};

// Metric Card Props Interface
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

// Simple metric card component
const MetricCard = ({ icon, label, value }: MetricCardProps) => (
  <div style={{
    backgroundColor: `${STYLES.colors.background}`,
    borderRadius: STYLES.borderRadius,
    padding: STYLES.spacing.md,
    border: `1px solid ${STYLES.colors.border}`
  }}>
    <div style={{ display: "flex", alignItems: "center", marginBottom: STYLES.spacing.sm }}>
      {icon}
      <span style={{ 
        marginLeft: STYLES.spacing.sm,
        fontSize: "0.75rem",
        color: STYLES.colors.textSecondary
      }}>
        {label}
      </span>
    </div>
    <div style={{ 
      fontSize: "1.25rem", 
      fontWeight: "600",
      color: STYLES.colors.text
    }}>
      {value}
    </div>
  </div>
);

// Main Dashboard
export function StandaloneAdCreativesComparison() {
  const { id: campaignId } = useContext(StandaloneCampaignContext)

  const [rawCreatives, setRawCreatives] = useState<RawCreative[]>([])
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sliderIndex, setSliderIndex] = useState(0)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  // State for viewing creative details
  const [viewingCreative, setViewingCreative] = useState<AdCreative | null>(null)
  const [adFormat, setAdFormat] = useState<string>("INSTAGRAM_STANDARD")

  // State for editing creative
  const [editingCreative, setEditingCreative] = useState<AdCreative | null>(null)
  const [editName, setEditName] = useState("")
  const [editMessage, setEditMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [imagePermalinkUrl, setImagePermalinkUrl] = useState<string>("")

  const initialFetchDone = useRef(false)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Get image details when editing a creative
  const getImageDetail = useCallback((imageHash: string) => {
    fetch(`/api/fasty-bot/proxy-get-image-detail?image_hash=${imageHash}`)
      .then((response) => response.json())
      .then((imageDetail) => {
        if (editingCreative) {
          setImagePermalinkUrl(imageDetail?.permalink_url)
        }
      })
      .catch((error) => {
        console.error("Error fetching image detail:", error)
      })
  }, [editingCreative])

  // Get image when editing
  useEffect(() => {
    if (
      editingCreative &&
      editingCreative.type === "image" &&
      editingCreative.object_story_spec?.link_data?.image_hash
    ) {
      getImageDetail(editingCreative.object_story_spec.link_data.image_hash)
    }
    if (!editingCreative) {
      setImagePermalinkUrl("")
    }
  }, [editingCreative, getImageDetail])

  // 1) Fetch raw creatives
  useEffect(() => {
    if (!campaignId) {
      setError("No campaign ID available")
      return
    }

    const fetchRawCreatives = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/fasty-bot/proxy-get-adcreatives?campaignId=${campaignId}`,
          {
            headers: {
              "fb-api-key": FB_API_KEY,
            },
          }
        )
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`Failed to fetch raw ad creatives: ${txt}`)
        }
        const data = await res.json()

        const items = data?.data?.data ?? []
        const flattened = items.map((item: any) => ({
          id: item.id,
          name: item.creative.name,
          status: item.creative.status,
          object_type: item.creative.object_type,
          thumbnail_url: item.creative.thumbnail_url,
          video_url: item.creative.video_url,
          object_story_spec: item.creative.object_story_spec,
        })) as RawCreative[]

        setRawCreatives(flattened)
      } catch (err) {
        console.error("Error fetching raw creatives:", err)
        setError(
          err instanceof Error ? err.message : "Failed to load raw creatives"
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchRawCreatives()
  }, [campaignId])

  // 2) Fetch metrics & merge
  const fetchMetrics = useCallback(async () => {
    if (!campaignId) return
    try {
      const { adCreatives: metricsArray } = await getAllAdMetricsByCampaignId(
        campaignId
      )

      const merged = rawCreatives.map((rc) => {
        const match = metricsArray.find((m: any) => m.id === rc.id)
        if (match) {
          return {
            id: rc.id,
            name: match.name, // Use ad name from metrics
            creativeName: rc.name, // Store original creative name
            status: rc.status,
            type: match.type,
            url: rc.thumbnail_url,
            videoId: rc.object_story_spec?.video_data?.video_id,
            object_story_spec: rc.object_story_spec,
            metrics: match.metrics,
          }
        } else {
          const fallbackType: "video" | "image" =
            rc.object_type === "VIDEO" ? "video" : "image"
          return {
            id: rc.id,
            name: rc.name, // Fallback to creative name if no metrics match
            creativeName: rc.name,
            status: rc.status,
            type: fallbackType,
            url: rc.thumbnail_url,
            videoId: rc.object_story_spec?.video_data?.video_id,
            object_story_spec: rc.object_story_spec,
            metrics: {
              impressions: 0,
              reach: 0,
              spend: 0,
              engagement: 0,
              watchTime: 0,
              conversionRate: 0,
              clickThroughRate: 0,
              costPerClick: 0,
              frequency: 0,
              cpp: 0,
              cpm: 0,
              inlineLinkClicks: 0,
              inlineLinkClickRate: 0,
              outboundClicks: 0,
              outboundClickRate: 0,
              uniqueClicks: 0,
              uniqueClickRate: 0,
              websiteCtr: 0,
              leads: 0,
              conversions: 0,
              costPerLead: 0,
              costPerConversion: 0,
              conversionValue: 0,
              roi: 0,
              objective: "",
              optimizationGoal: "",
            },
          }
        }
      })
      setAdCreatives(merged)
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch metrics")
    }
  }, [campaignId, rawCreatives])

  // 3) Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && campaignId && rawCreatives.length > 0) {
      initialFetchDone.current = true
      fetchMetrics()
    }
  }, [campaignId, rawCreatives, fetchMetrics])

  // 4) Periodic refresh
  useEffect(() => {
    if (!campaignId) return
    const intervalId = setInterval(fetchMetrics, CACHE_DURATION)
    return () => clearInterval(intervalId)
  }, [campaignId, fetchMetrics, CACHE_DURATION])
  
  // Reset slider when campaign changes
  useEffect(() => {
    setSliderIndex(0)
  }, [campaignId])
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Reset slider index when changing breakpoints to avoid layout issues
      const previousVisibleItems = windowWidth < 768 ? 1 : windowWidth < 1024 ? 2 : 3;
      const currentVisibleItems = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
      
      if (previousVisibleItems !== currentVisibleItems) {
        setSliderIndex(0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth]);

  // Sorted creatives for display
  const sortedCreatives = useMemo(() => {
    return [...adCreatives].sort((a, b) => getPerformanceScore(b) - getPerformanceScore(a))
  }, [adCreatives])

  // Top performers
  const topPerformerID = sortedCreatives[0]?.id
  const secondBestID = sortedCreatives[1]?.id

  // Toggle active/inactive status of creative
  const togglePublish = async (id: string) => {
    try {
      const creative = adCreatives.find((c) => c.id === id);
      if (!creative) return;

      // Use the toggle status service
      const result = await toggleAdCreativeStatus(id);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to toggle creative status");
      }

      // Update creative status in state
      setAdCreatives((prevCreatives) =>
        prevCreatives.map((c) =>
          c.id === id ? { 
            ...c, 
            status: result.new_status || (c.status === "ACTIVE" ? "PAUSED" : "ACTIVE") 
          } : c
        )
      );
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  }

  if (!campaignId) {
    return (
      <div style={{ 
        padding: STYLES.spacing.lg, 
        textAlign: "center", 
        backgroundColor: STYLES.colors.cardBg, 
        borderRadius: STYLES.borderRadius,
        border: `1px solid ${STYLES.colors.border}`
      }}>
        <div style={{ color: STYLES.colors.textSecondary }}>
          Please connect to a campaign first to view ad creative statistics.
        </div>
      </div>
    )
  }

  // Combined metrics section
  const CombinedMetricsSection = () => {
    const combinedMetrics = getCombinedMetrics(adCreatives);
    
    return (
      <div style={{ 
        padding: STYLES.spacing.lg,
        backgroundColor: STYLES.colors.cardBg,
        borderRadius: STYLES.borderRadius,
        border: `1px solid ${STYLES.colors.border}`,
        marginBottom: STYLES.spacing.xl
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          marginBottom: STYLES.spacing.lg 
        }}>
          <div style={{ 
            borderRadius: STYLES.borderRadius, 
            backgroundColor: `${STYLES.colors.primary}15`,
            padding: STYLES.spacing.md,
            marginRight: STYLES.spacing.md
          }}>
            <BarChart3 size={24} style={{ color: STYLES.colors.primary }} />
          </div>
          <div>
            <h2 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700", 
              color: STYLES.colors.text,
              fontFamily: "'Inter', 'SF Pro Display', sans-serif",
              marginBottom: "0.25rem"
            }}>
              Campaign Overview
            </h2>
            <p style={{ color: STYLES.colors.textSecondary, fontSize: "0.875rem" }}>
              Combined results for all {adCreatives.length} creatives
            </p>
          </div>
        </div>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: windowWidth < 640 ? "repeat(1, 1fr)" : 
                               windowWidth < 1024 ? "repeat(2, 1fr)" : 
                               "repeat(4, 1fr)", 
          gap: STYLES.spacing.md 
        }}>
          <div style={{ 
            backgroundColor: STYLES.colors.background,
            borderRadius: STYLES.borderRadius,
            padding: STYLES.spacing.lg,
            border: `1px solid ${STYLES.colors.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: STYLES.spacing.md }}>
              <Eye size={18} style={{ color: STYLES.colors.primary }} />
              <span style={{ 
                marginLeft: STYLES.spacing.md,
                fontSize: "0.875rem",
                color: STYLES.colors.textSecondary,
                fontWeight: 500
              }}>
                Impressions
              </span>
            </div>
            <div style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700",
              color: STYLES.colors.text
            }}>
              {combinedMetrics.impressions.toLocaleString()}
            </div>
            <div style={{ 
              marginTop: STYLES.spacing.sm,
              height: "4px",
              backgroundColor: `${STYLES.colors.primary}30`,
              borderRadius: "2px",
              overflow: "hidden"
            }}>
              <div style={{ 
                width: "80%", 
                height: "100%", 
                background: `linear-gradient(to right, ${STYLES.colors.primary}, ${STYLES.colors.blue})`,
                borderRadius: "2px"
              }}></div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: STYLES.colors.background,
            borderRadius: STYLES.borderRadius,
            padding: STYLES.spacing.lg,
            border: `1px solid ${STYLES.colors.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: STYLES.spacing.md }}>
              <Users size={18} style={{ color: STYLES.colors.purple }} />
              <span style={{ 
                marginLeft: STYLES.spacing.md,
                fontSize: "0.875rem",
                color: STYLES.colors.textSecondary,
                fontWeight: 500
              }}>
                Reach
              </span>
            </div>
            <div style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700",
              color: STYLES.colors.text
            }}>
              {combinedMetrics.reach.toLocaleString()}
            </div>
            <div style={{ 
              marginTop: STYLES.spacing.sm,
              height: "4px",
              backgroundColor: `${STYLES.colors.purple}30`,
              borderRadius: "2px",
              overflow: "hidden"
            }}>
              <div style={{ 
                width: "65%", 
                height: "100%", 
                background: `linear-gradient(to right, ${STYLES.colors.purple}, ${STYLES.colors.blue})`,
                borderRadius: "2px"
              }}></div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: STYLES.colors.background,
            borderRadius: STYLES.borderRadius,
            padding: STYLES.spacing.lg,
            border: `1px solid ${STYLES.colors.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: STYLES.spacing.md }}>
              <ThumbsUp size={18} style={{ color: STYLES.colors.secondary }} />
              <span style={{ 
                marginLeft: STYLES.spacing.md,
                fontSize: "0.875rem",
                color: STYLES.colors.textSecondary,
                fontWeight: 500
              }}>
                Engagement
              </span>
            </div>
            <div style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700",
              color: STYLES.colors.text
            }}>
              {combinedMetrics.engagement.toLocaleString()}
            </div>
            <div style={{ 
              marginTop: STYLES.spacing.sm,
              height: "4px",
              backgroundColor: `${STYLES.colors.secondary}30`,
              borderRadius: "2px",
              overflow: "hidden"
            }}>
              <div style={{ 
                width: "75%", 
                height: "100%", 
                background: `linear-gradient(to right, ${STYLES.colors.secondary}, ${STYLES.colors.purple})`,
                borderRadius: "2px"
              }}></div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: STYLES.colors.background,
            borderRadius: STYLES.borderRadius,
            padding: STYLES.spacing.lg,
            border: `1px solid ${STYLES.colors.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: STYLES.spacing.md }}>
              <DollarSign size={18} style={{ color: STYLES.colors.green }} />
              <span style={{ 
                marginLeft: STYLES.spacing.md,
                fontSize: "0.875rem",
                color: STYLES.colors.textSecondary,
                fontWeight: 500
              }}>
                Total Spend
              </span>
            </div>
            <div style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700",
              color: STYLES.colors.text
            }}>
              ${combinedMetrics.spend.toFixed(2)}
            </div>
            <div style={{ 
              marginTop: STYLES.spacing.sm,
              height: "4px",
              backgroundColor: `${STYLES.colors.green}30`,
              borderRadius: "2px",
              overflow: "hidden"
            }}>
              <div style={{ 
                width: "60%", 
                height: "100%", 
                background: `linear-gradient(to right, ${STYLES.colors.green}, ${STYLES.colors.primary})`,
                borderRadius: "2px"
              }}></div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: STYLES.colors.background,
            borderRadius: STYLES.borderRadius,
            padding: STYLES.spacing.lg,
            border: `1px solid ${STYLES.colors.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: STYLES.spacing.md }}>
              <Target size={18} style={{ color: STYLES.colors.blue }} />
              <span style={{ 
                marginLeft: STYLES.spacing.md,
                fontSize: "0.875rem",
                color: STYLES.colors.textSecondary,
                fontWeight: 500
              }}>
                Average CTR
              </span>
            </div>
            <div style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700",
              color: STYLES.colors.text
            }}>
              {combinedMetrics.clickThroughRate.toFixed(2)}%
            </div>
            <div style={{ 
              marginTop: STYLES.spacing.sm,
              height: "4px",
              backgroundColor: `${STYLES.colors.blue}30`,
              borderRadius: "2px",
              overflow: "hidden"
            }}>
              <div style={{ 
                width: "70%", 
                height: "100%", 
                background: `linear-gradient(to right, ${STYLES.colors.blue}, ${STYLES.colors.purple})`,
                borderRadius: "2px"
              }}></div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: STYLES.colors.background,
            borderRadius: STYLES.borderRadius,
            padding: STYLES.spacing.lg,
            border: `1px solid ${STYLES.colors.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: STYLES.spacing.md }}>
              <DollarSign size={18} style={{ color: STYLES.colors.secondary }} />
              <span style={{ 
                marginLeft: STYLES.spacing.md,
                fontSize: "0.875rem",
                color: STYLES.colors.textSecondary,
                fontWeight: 500
              }}>
                Cost Per Conversion
              </span>
            </div>
            <div style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700",
              color: STYLES.colors.text
            }}>
              ${combinedMetrics.costPerConversion.toFixed(2)}
            </div>
            <div style={{ 
              marginTop: STYLES.spacing.sm,
              height: "4px",
              backgroundColor: `${STYLES.colors.secondary}30`,
              borderRadius: "2px",
              overflow: "hidden"
            }}>
              <div style={{ 
                width: "55%", 
                height: "100%", 
                background: `linear-gradient(to right, ${STYLES.colors.secondary}, ${STYLES.colors.green})`,
                borderRadius: "2px"
              }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      width: "100%",
      maxWidth: "100%",
      backgroundColor: STYLES.colors.background,
      borderRadius: STYLES.borderRadius,
      padding: windowWidth < 768 ? STYLES.spacing.md : STYLES.spacing.xl,
      overflow: "auto"
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: STYLES.spacing.xl
      }}>
        <div style={{
          display: "flex",
          alignItems: "center"
        }}>
          <div style={{ 
            borderRadius: STYLES.borderRadius,
            padding: STYLES.spacing.md,
            backgroundColor: `${STYLES.colors.primary}15`,
            marginRight: STYLES.spacing.md
          }}>
            <Award size={24} style={{ color: STYLES.colors.primary }} />
          </div>
          <div>
            <h1 style={{ 
              fontSize: "1.75rem", 
              fontWeight: "700", 
              marginBottom: "0.25rem",
              color: STYLES.colors.primary,
              fontFamily: "'Inter', 'SF Pro Display', sans-serif"
            }}>
              Analytics & Insights
            </h1>
            <p style={{ 
              fontSize: "0.875rem", 
              color: STYLES.colors.textSecondary 
            }}>
              Analyze performance metrics across all your ad creatives
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {error && (
          <div style={{
            padding: STYLES.spacing.md,
            marginBottom: STYLES.spacing.lg,
            backgroundColor: `${STYLES.colors.secondary}15`,
            borderRadius: STYLES.borderRadius,
            border: `1px solid ${STYLES.colors.secondary}30`,
            color: STYLES.colors.secondary
          }}>
            {error}
          </div>
        )}

        {isLoading && (
          <div style={{
            padding: STYLES.spacing.lg,
            textAlign: "center",
            color: STYLES.colors.textSecondary
          }}>
            Loading campaign data...
          </div>
        )}

        {adCreatives.length > 0 && !isLoading && !error && (
          <>
            {/* Combined metrics overview at the top */}
            <CombinedMetricsSection />
            
            {/* Section title for creatives */}
            <div style={{ 
              marginBottom: STYLES.spacing.lg,
              display: "flex",
              alignItems: "center"
            }}>
              <h2 style={{ 
                fontSize: "1.25rem", 
                fontWeight: "600", 
                color: STYLES.colors.secondary,
                fontFamily: "'Inter', 'SF Pro Display', sans-serif"
              }}>
                Data Visualization
              </h2>
              <div style={{ 
                height: "1px", 
                backgroundColor: STYLES.colors.border,
                flexGrow: 1,
                marginLeft: STYLES.spacing.md
              }}></div>
            </div>
            
            {/* Creative cards carousel */}
            <div style={{ position: "relative" }}>
              {/* Navigation buttons */}
              {/* Navigation buttons - adjust based on screen size */}
              {((windowWidth < 768 && sortedCreatives.length > 1) ||
                (windowWidth < 1024 && sortedCreatives.length > 2) ||
                (sortedCreatives.length > 3)) && (
                <>
                  <button 
                    onClick={() => setSliderIndex(Math.max(0, sliderIndex - 1))}
                    disabled={sliderIndex === 0}
                    style={{
                      position: "absolute",
                      left: windowWidth < 640 ? "5px" : "-20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: windowWidth < 640 ? "30px" : "40px",
                      height: windowWidth < 640 ? "30px" : "40px",
                      borderRadius: "50%",
                      backgroundColor: sliderIndex === 0 ? STYLES.colors.border : STYLES.colors.cardBg,
                      border: `1px solid ${STYLES.colors.border}`,
                      cursor: sliderIndex === 0 ? "default" : "pointer",
                      opacity: sliderIndex === 0 ? 0.5 : 1
                    }}
                  >
                    <ChevronLeft size={windowWidth < 640 ? 16 : 20} style={{ color: STYLES.colors.text }} />
                  </button>
                  
                  <button 
                    onClick={() => {
                      const visibleItems = windowWidth < 768 ? 1 : windowWidth < 1024 ? 2 : 3;
                      setSliderIndex(Math.min(sortedCreatives.length - visibleItems, sliderIndex + 1));
                    }}
                    disabled={
                      windowWidth < 768 
                        ? sliderIndex >= sortedCreatives.length - 1
                        : windowWidth < 1024
                          ? sliderIndex >= sortedCreatives.length - 2
                          : sliderIndex >= sortedCreatives.length - 3
                    }
                    style={{
                      position: "absolute",
                      right: windowWidth < 640 ? "5px" : "-20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: windowWidth < 640 ? "30px" : "40px",
                      height: windowWidth < 640 ? "30px" : "40px",
                      borderRadius: "50%",
                      backgroundColor: (
                        windowWidth < 768 
                          ? sliderIndex >= sortedCreatives.length - 1
                          : windowWidth < 1024
                            ? sliderIndex >= sortedCreatives.length - 2
                            : sliderIndex >= sortedCreatives.length - 3
                      ) ? STYLES.colors.border : STYLES.colors.cardBg,
                      border: `1px solid ${STYLES.colors.border}`,
                      cursor: (
                        windowWidth < 768 
                          ? sliderIndex >= sortedCreatives.length - 1
                          : windowWidth < 1024
                            ? sliderIndex >= sortedCreatives.length - 2
                            : sliderIndex >= sortedCreatives.length - 3
                      ) ? "default" : "pointer",
                      opacity: (
                        windowWidth < 768 
                          ? sliderIndex >= sortedCreatives.length - 1
                          : windowWidth < 1024
                            ? sliderIndex >= sortedCreatives.length - 2
                            : sliderIndex >= sortedCreatives.length - 3
                      ) ? 0.5 : 1
                    }}
                  >
                    <ChevronRight size={windowWidth < 640 ? 16 : 20} style={{ color: STYLES.colors.text }} />
                  </button>
                </>
              )}
              
              {/* Slider container */}
              <div style={{ 
                overflow: "hidden", 
                margin: "0 10px",
                position: "relative"
              }}>
                <div style={{ 
                  display: "flex",
                  transform: windowWidth < 768 
                    ? `translateX(-${sliderIndex * 100}%)` 
                    : windowWidth < 1024 
                      ? `translateX(-${sliderIndex * 50}%)` 
                      : `translateX(-${sliderIndex * 33.33}%)`,
                  transition: "transform 0.3s ease-in-out"
                }}>
                  {sortedCreatives.map((creative) => (
                    <div key={creative.id} style={{ 
                      flex: windowWidth < 768 
                        ? "0 0 100%" 
                        : windowWidth < 1024 
                          ? "0 0 calc(50% - 20px)" 
                          : "0 0 calc(33.33% - 20px)",
                      padding: "0 10px",
                      minWidth: windowWidth < 640 ? "280px" : "330px",
                      maxWidth: windowWidth < 640 ? "100%" : "400px"
                    }}>
                      <CreativeCard
                        creative={creative}
                        isTopPerformer={creative.id === topPerformerID}
                        isSecondBest={creative.id === secondBestID}
                        onTogglePublish={() => togglePublish(creative.id)}
                        windowWidth={windowWidth}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination indicators - responsive */}
              {((windowWidth < 768 && sortedCreatives.length > 1) ||
                (windowWidth < 1024 && sortedCreatives.length > 2) ||
                (sortedCreatives.length > 3)) && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  marginTop: STYLES.spacing.lg 
                }}>
                  {Array.from({ 
                    length: Math.ceil(sortedCreatives.length / 
                      (windowWidth < 768 ? 1 : windowWidth < 1024 ? 2 : 3))
                  }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSliderIndex(index)}
                      style={{
                        width: windowWidth < 640 ? "6px" : "8px",
                        height: windowWidth < 640 ? "6px" : "8px",
                        borderRadius: "50%",
                        backgroundColor: sliderIndex === index ? STYLES.colors.primary : STYLES.colors.border,
                        margin: "0 4px",
                        border: "none",
                        padding: 0,
                        cursor: "pointer"
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        {adCreatives.length === 0 && !isLoading && !error && (
          <div style={{
            padding: STYLES.spacing.xl,
            textAlign: "center",
            backgroundColor: STYLES.colors.cardBg,
            borderRadius: STYLES.borderRadius,
            border: `1px solid ${STYLES.colors.border}`,
            color: STYLES.colors.textSecondary
          }}>
            No ad creatives found for this campaign.
          </div>
        )}
      </main>
    </div>
  )
}