"use client";
import React, { useState, useEffect } from "react";
import { IconSpinner } from "@/components/ui/icons";
import { getCampaignSummary } from "@/lib/api/fasty-bot/get-campaign-summary";
import { getCampaignHistoricalMetrics } from "@/lib/api/fasty-bot/helpers/get-campaign-historical-metrics";
import { getAllAdMetricsByCampaignId } from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Brain, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getUserDetail } from "@/app/actions"; // Hypothetical server action

// -------------- Type Definitions -----------------------------

interface IAICampaignAnalysisProps {
  campaignId: string;
  isActive?: boolean; // indicates auto-load or not
}

/** Basic shape of your campaign summary. */
interface ICampaignSummary {
  campaign_id: string;
  campaign_name: string;
  total_leads: number;
  total_spent: number;
  creation_date: string;
  status: string;
  clicks: number;
  ctr: number;
  frequency: number;
  impressions: number;
  reach: number;
  unique_clicks: number;
  objective?: string; // Added to support campaign objective checks
  other_campaign_insights?: Record<string, any>; // Other insights from the campaign
}

/** Historical metrics including advanced data. */
interface IHistoricalMetrics {
  campaign_id: string;
  timeline: string;
  summary: {
    total_leads: number;
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    total_reach: number;
    average_ctr: number;
    average_cpc: number;
    average_cpm: number;
    average_cpa: number;
    average_frequency: number;
    days_count: number;
  };
  advanced_metrics?: {
    time_of_day?: Record<string, { impressions?: number; spend?: number; actions?: number }>;
    platforms?: Record<string, { impressions?: number; spend?: number; actions?: number }>;
    demographics?: Record<string, { impressions?: number; spend?: number; actions?: number }>;
  };
}

/** Ad creatives metrics from the creative results component */
/** Raw Creative structure */
interface RawCreative {
  id: string;
  name: string;
  status: string;
  object_type: "VIDEO" | "IMAGE" | "SHARE";
  thumbnail_url?: string;
  video_url?: string;
  object_story_spec: {
    page_id: string;
    video_data?: {
      video_id: string;
      title: string;
      message: string;
      image_url: string;
      image_hash: string;
    };
    link_data?: {
      name: string;
      message: string;
      link: string;
      image_hash: string;
    };
  };
}

/** Calculate performance score for a creative - exact same logic as in campaignresults-creatives */
function getPerformanceScore(creative: AdCreativeMetrics): number {
  const m = creative.metrics;
  // watchTime is in seconds
  return (
    m.engagement * 2 +
    m.impressions * 0.3 +
    m.watchTime * 0.03 +
    m.reach * 0.1 -
    m.costPerClick * 5
  );
}

/** Gets the best performer ID for a specific metric - exact same logic as in campaignresults-creatives */
function getBestPerformerIdForMetric(
  creatives: AdCreativeMetrics[],
  metric: string
): string {
  if (!creatives.length) return "";

  const costMetrics = [
    "costPerClick",
    "cpp",
    "cpm",
    "spend",
    "costPerLead",
    "costPerConversion",
  ];

  const isLowerBetter = costMetrics.includes(metric);

  return [...creatives]
    .sort((a, b) => {
      return isLowerBetter
        ? Number(a.metrics[metric as keyof typeof a.metrics] || 0) -
        Number(b.metrics[metric as keyof typeof b.metrics] || 0)
        : Number(b.metrics[metric as keyof typeof b.metrics] || 0) -
        Number(a.metrics[metric as keyof typeof a.metrics] || 0);
    })[0]?.id || "";
}

/** Ad Creative with metrics structure, matches exactly what's used in campaignresults-creatives */
interface AdCreativeMetrics {
  id: string;
  name: string;
  creativeName?: string;
  status: string;
  type: "image" | "video";
  url?: string;
  videoId?: string;
  object_story_spec: any;
  metrics: {
    impressions: number;
    reach: number;
    spend: number;
    engagement: number;
    watchTime: number;
    conversionRate: number;
    clickThroughRate: number;
    costPerClick: number;
    frequency: number;
    cpp: number;
    cpm: number;
    inlineLinkClicks: number;
    inlineLinkClickRate: number;
    outboundClicks: number;
    outboundClickRate: number;
    uniqueClicks: number;
    uniqueClickRate: number;
    websiteCtr: number;
    leads: number;
    conversions: number;
    costPerLead: number;
    costPerConversion: number;
    conversionValue: number;
    roi: number;
    objective: string;
    optimizationGoal: string;
  };
}

/** AI analysis shape. */
interface IAIAnalysis {
  shortText: string;
}

// -------------- Localized “thinking” messages ---------------
const thinkingMessagesDict: Record<string, string[]> = {
  en: ["Let me check your campaign data... 🤔", "These metrics look intriguing...", "Almost done, hang tight!"],
  de: ["Lass mich kurz deine Kampagnendaten ansehen... 🤔", "Oh, das sieht spannend aus...", "Gleich fertig, halte durch!"],
  fr: ["Laisse-moi vérifier tes données de campagne... 🤔", "Oh, c’est intéressant...", "Presque fini, tiens bon !"],
  es: ["Déjame revisar los datos de tu campaña... 🤔", "Vaya, esto se ve interesante...", "Casi listo, ¡ten paciencia!"],
  it: ["Dammi un attimo per controllare i dati della campagna... 🤔", "Oh, sembra interessante...", "Quasi fatto, resisti!"],
  nl: ["Laat me even je campagnedata checken... 🤔", "Hmm, dit ziet er interessant uit...", "Bijna klaar, nog even geduld!"]
};

// -------------- Localized “fetching data” messages ----------
const fetchingDataDict: Record<string, string> = {
  en: "Putting together some nice insights! 🏗️",
  de: "Erstelle gerade ein paar coole Einblicke! 🏗️",
  fr: "Je prépare quelques informations intéressantes ! 🏗️",
  es: "¡Armando algunos datos interesantes! 🏗️",
  it: "Sto assemblando alcune informazioni interessanti! 🏗️",
  nl: "Even wat leuke inzichten in elkaar zetten! 🏗️"
};

// -------------- Constants ----------------------------------
const FB_API_KEY = process.env.NEXT_PUBLIC_FB_API_KEY || "";

// -------------- The Main Component --------------------------
export default function AICampaignAnalysisBoard({
  campaignId,
  isActive
}: IAICampaignAnalysisProps) {
  const [isActivated, setIsActivated] = useState<boolean>(!!isActive);

  // Step-based “thinking” for fancy messages
  const [thinkingStep, setThinkingStep] = useState(0);
  // Actual data fetch in progress
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Final data
  const [campaignSummary, setCampaignSummary] = useState<ICampaignSummary | null>(null);
  const [historicalMetrics, setHistoricalMetrics] = useState<IHistoricalMetrics | null>(null);
  const [rawCreatives, setRawCreatives] = useState<RawCreative[]>([]);
  const [adCreativeMetrics, setAdCreativeMetrics] = useState<AdCreativeMetrics[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<IAIAnalysis | null>(null);

  // The user’s real language fallback to "en"
  const [userLang, setUserLang] = useState<string>("en");

  /** 1) Activation => get user language => start “thinking”. */
  useEffect(() => {
    if (!isActivated) return;
    if (thinkingStep > 0) return; // Only do once

    (async () => {
      // A) fetch user detail
      try {
        const detailResp = await getUserDetail();
        if (!detailResp.error && detailResp.user?.preferred_language) {
          setUserLang(detailResp.user.preferred_language);
        }
      } catch (err) {
        console.error("Error retrieving user detail for language:", err);
      }

      // B) Start the “thinking” steps
      let currentStep = 0;
      const intervalId = setInterval(() => {
        currentStep += 1;
        setThinkingStep(currentStep);
        if (currentStep === 3) {
          clearInterval(intervalId);
        }
      }, 1500);
    })();
  }, [isActivated, thinkingStep]);

  /** 2) After 3rd step => fetch real data & AI. */
  useEffect(() => {
    if (thinkingStep === 3) {
      setIsFetchingData(true);
      void fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinkingStep]);

  /** Actually fetch aggregator, historical, ad creative metrics and AI. */
  async function fetchAllData() {
    try {
      // 1) aggregator
      const summaryData = await getCampaignSummary(campaignId);
      if (!summaryData || !summaryData.campaign_id) {
        console.error("Failed to fetch campaign summary, received:", summaryData);
        throw new Error("Campaign summary is empty or undefined");
      }

      setCampaignSummary(summaryData);

      // 2) historical
      const histData = await getCampaignHistoricalMetrics(campaignId, "last_year", true);
      setHistoricalMetrics(histData);

      // 3) fetch raw creatives first - with proper error handling
      let mergedCreatives: AdCreativeMetrics[] = [];
      try {
        console.log("Fetching raw creatives for campaign:", campaignId);
        const res = await fetch(
          `/api/fasty-bot/proxy-get-adcreatives?campaignId=${campaignId}`,
          {
            headers: {
              "fb-api-key": FB_API_KEY,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch raw ad creatives: ${await res.text()}`);
        }

        const data = await res.json();

        const items = data?.data?.data ?? [];
        const flattened = items.map((item: any) => ({
          id: item.id,
          name: item.creative.name,
          status: item.creative.status,
          object_type: item.creative.object_type,
          thumbnail_url: item.creative.thumbnail_url,
          video_url: item.creative.video_url,
          object_story_spec: item.creative.object_story_spec,
        })) as RawCreative[];

        setRawCreatives(flattened);

        // 4) Now fetch metrics and merge with raw creatives
        console.log("Raw creatives fetched, now fetching metrics for campaign:", campaignId);
        const metricsResponse = await getAllAdMetricsByCampaignId(campaignId);

        if (!metricsResponse || !metricsResponse.adCreatives) {
          console.error("Failed to get ad metrics, response:", metricsResponse);
          throw new Error("Metrics array is empty or undefined");
        }

        const metricsArray = metricsResponse.adCreatives;
        console.log("Metrics fetched successfully, found", metricsArray.length, "ad metrics");

        mergedCreatives = flattened.map((rc) => {
          const match = metricsArray.find((m: any) => m.id === rc.id);
          if (match) {
            console.log("Found matching metrics for creative:", rc.id, match.name);
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
            };
          } else {
            console.warn("No matching metrics found for creative:", rc.id, rc.name);
            const fallbackType: "video" | "image" =
              rc.object_type === "VIDEO" ? "video" : "image";
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
            };
          }
        });

        console.log("Successfully merged creatives with metrics, total:", mergedCreatives.length);

        // Check for zero metrics to help with debugging
        const hasZeroMetrics = mergedCreatives.some(c =>
          c.metrics.impressions === 0 &&
          c.metrics.reach === 0 &&
          c.metrics.spend === 0
        );

        if (hasZeroMetrics) {
          console.warn("Warning: Some creatives have zero metrics",
            mergedCreatives.filter(c =>
              c.metrics.impressions === 0 &&
              c.metrics.reach === 0 &&
              c.metrics.spend === 0
            ).map(c => c.name)
          );
        }

        // Set the merged creative metrics
        setAdCreativeMetrics(mergedCreatives);

      } catch (adMetricsErr) {
        console.error("Error fetching and processing ad creative metrics:", adMetricsErr);
        // Still continue with the AI analysis even if creative metrics failed
      }

      // 5) Add a short delay to ensure state updates have propagated
      // This is important because getRealAIAnalysis uses the state directly
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 6) AI: Get updated metrics data directly as a parameter rather than relying on state
      console.log("Starting AI analysis with metrics for creatives:", mergedCreatives.length);
      const aiText = await getRealAIAnalysis(summaryData, histData, userLang, mergedCreatives);
      setAiAnalysis({ shortText: aiText });
    } catch (err) {
      console.error("Error fetching campaign data or AI:", err);
    } finally {
      setIsFetchingData(false);
    }
  }

  /**
   * AI call with advanced data included in prompt
   */
  async function getRealAIAnalysis(
    summary: ICampaignSummary,
    hist: IHistoricalMetrics,
    language: string,
    creativeMetrics: AdCreativeMetrics[] = [] // Accept metrics directly
  ): Promise<string> {
    // Extract advanced data if present
    const advData = hist.advanced_metrics || {};
    const advTime = JSON.stringify(advData.time_of_day || {});
    const advPlat = JSON.stringify(advData.platforms || {});
    const advDemo = JSON.stringify(advData.demographics || {});

    // Use passed creatives if available, otherwise fall back to state
    const effectiveCreatives = creativeMetrics.length > 0 ? creativeMetrics : adCreativeMetrics;

    console.log("AI Analysis using creatives count:", effectiveCreatives.length);

    // Log some metrics to verify data
    if (effectiveCreatives.length > 0) {
      console.log("Sample metrics from first creative:",
        JSON.stringify({
          name: effectiveCreatives[0].name,
          impressions: effectiveCreatives[0].metrics.impressions,
          spend: effectiveCreatives[0].metrics.spend,
          clicks: effectiveCreatives[0].metrics.inlineLinkClicks,
          ctr: effectiveCreatives[0].metrics.clickThroughRate
        })
      );
    }

    // Determine campaign objective/type from either source
    let campaignObjective = summary.objective || "";
    if (!campaignObjective && effectiveCreatives.length > 0 && effectiveCreatives[0].metrics.objective) {
      campaignObjective = effectiveCreatives[0].metrics.objective;
    }

    // Create combined metrics from all ad creatives (like in the types.ts getCombinedMetrics function)
    const combinedCreativeMetrics = effectiveCreatives.length > 0 ?
      effectiveCreatives.reduce((combined, creative) => {
        // Initialize with first creative's metrics if this is the first one
        if (!combined) {
          return { ...creative.metrics };
        }

        // Add metrics from this creative
        combined.impressions += creative.metrics.impressions || 0;
        combined.reach += creative.metrics.reach || 0;
        combined.spend += creative.metrics.spend || 0;
        combined.engagement += creative.metrics.engagement || 0;
        combined.watchTime += creative.metrics.watchTime || 0;
        combined.inlineLinkClicks += creative.metrics.inlineLinkClicks || 0;
        combined.outboundClicks += creative.metrics.outboundClicks || 0;
        combined.uniqueClicks += creative.metrics.uniqueClicks || 0;
        combined.leads += creative.metrics.leads || 0;
        combined.conversions += creative.metrics.conversions || 0;
        combined.conversionValue += creative.metrics.conversionValue || 0;

        // Return the updated combined metrics
        return combined;
      }, null as any) : null;

    // Identify top performers - exactly as done in the creative results component
    const sortedByPerformance = [...effectiveCreatives].sort(
      (a, b) => getPerformanceScore(b) - getPerformanceScore(a)
    );
    const topPerformer = sortedByPerformance.length > 0 ? sortedByPerformance[0] : null;
    const secondBest = sortedByPerformance.length > 1 ? sortedByPerformance[1] : null;

    // Get best performers for specific important metrics
    const bestCtrId = getBestPerformerIdForMetric(effectiveCreatives, "clickThroughRate");
    const bestCpcId = getBestPerformerIdForMetric(effectiveCreatives, "costPerClick");
    const bestCplId = getBestPerformerIdForMetric(effectiveCreatives, "costPerLead");
    const bestConversionRateId = getBestPerformerIdForMetric(effectiveCreatives, "conversionRate");

    // Use proper message contents from ad creatives and add performance rankings
    const adCreativeContents = effectiveCreatives.map(creative => {
      const message = creative.object_story_spec?.video_data?.message ||
        creative.object_story_spec?.link_data?.message || "";
      // Add performance info
      const isTopPerformer = topPerformer && creative.id === topPerformer.id;
      const isSecondBest = secondBest && creative.id === secondBest.id;
      const isBestCtr = creative.id === bestCtrId;
      const isBestCpc = creative.id === bestCpcId;
      const isBestCpl = creative.id === bestCplId;
      const isBestConversionRate = creative.id === bestConversionRateId;
      // Calculate performance score using the same formula
      const performanceScore = getPerformanceScore(creative);
      return {
        id: creative.id,
        name: creative.name,
        creativeName: creative.creativeName,
        type: creative.type,
        status: creative.status,
        message: message,
        isTopPerformer: isTopPerformer,
        isSecondBest: isSecondBest,
        isBestCtr: isBestCtr,
        isBestCpc: isBestCpc,
        isBestCpl: isBestCpl,
        isBestConversionRate: isBestConversionRate,
        performanceScore: performanceScore,
        metrics: {
          impressions: creative.metrics.impressions,
          reach: creative.metrics.reach,
          spend: creative.metrics.spend,
          engagement: creative.metrics.engagement,
          clickThroughRate: creative.metrics.clickThroughRate,
          costPerClick: creative.metrics.costPerClick,
          inlineLinkClicks: creative.metrics.inlineLinkClicks,
          leads: creative.metrics.leads,
          conversions: creative.metrics.conversions,
          costPerLead: creative.metrics.costPerLead,
          costPerConversion: creative.metrics.costPerConversion,
          roi: creative.metrics.roi
        }
      };
    });

    // Create a clearer top performers summary
    const topPerformerSummary = topPerformer ? {
      id: topPerformer.id,
      name: topPerformer.name,
      type: topPerformer.type,
      status: topPerformer.status,
      isTopPerformer: true,
      performanceScore: getPerformanceScore(topPerformer),
      message: topPerformer.object_story_spec?.video_data?.message ||
        topPerformer.object_story_spec?.link_data?.message || "",
      metrics: {
        impressions: topPerformer.metrics.impressions,
        engagement: topPerformer.metrics.engagement,
        reach: topPerformer.metrics.reach,
        clickThroughRate: topPerformer.metrics.clickThroughRate,
        costPerClick: topPerformer.metrics.costPerClick,
        leads: topPerformer.metrics.leads,
        conversions: topPerformer.metrics.conversions,
        costPerLead: topPerformer.metrics.costPerLead,
        costPerConversion: topPerformer.metrics.costPerConversion
      }
    } : null;

    const secondBestSummary = secondBest ? {
      id: secondBest.id,
      name: secondBest.name,
      type: secondBest.type,
      status: secondBest.status,
      isSecondBest: true,
      performanceScore: getPerformanceScore(secondBest),
      message: secondBest.object_story_spec?.video_data?.message ||
        secondBest.object_story_spec?.link_data?.message || "",
      metrics: {
        impressions: secondBest.metrics.impressions,
        engagement: secondBest.metrics.engagement,
        reach: secondBest.metrics.reach,
        clickThroughRate: secondBest.metrics.clickThroughRate,
        costPerClick: secondBest.metrics.costPerClick,
        leads: secondBest.metrics.leads,
        conversions: secondBest.metrics.conversions,
        costPerLead: secondBest.metrics.costPerLead,
        costPerConversion: secondBest.metrics.costPerConversion
      }
    } : null;

    // Get metrics winners for clear highlighting
    const bestCtrCreative = effectiveCreatives.find(c => c.id === bestCtrId);
    const bestCpcCreative = effectiveCreatives.find(c => c.id === bestCpcId);
    const bestCplCreative = effectiveCreatives.find(c => c.id === bestCplId);
    const bestConversionRateCreative = effectiveCreatives.find(c => c.id === bestConversionRateId);

    // Log key information about top performers for diagnostics
    console.log("Top performer information:",
      topPerformer ? {
        id: topPerformer.id,
        name: topPerformer.name,
        performanceScore: getPerformanceScore(topPerformer),
        metrics: {
          impressions: topPerformer.metrics.impressions,
          ctr: topPerformer.metrics.clickThroughRate
        }
      } : "No top performer found"
    );

    // Check if the identified best creatives are valid
    console.log("Best CTR Creative:", bestCtrCreative ? bestCtrCreative.name : "None");
    console.log("Best CPC Creative:", bestCpcCreative ? bestCpcCreative.name : "None");
    const prompt = `
Please respond in ${language}, using a friendly, informal tone${language === "de" ? " (use 'Du' for the user)" : ""
      }, with some emojis. Analyze these campaign metrics and comparison with other campaigns:

DIAGNOSTIC INFO (for debugging, ignore): Using ${effectiveCreatives.length} creatives, top performer: ${topPerformer?.name || "None"}

Campaign name: ${summary.campaign_name}
Campaign objective: ${campaignObjective || "Unknown"}
Total spent: ${summary.total_spent.toFixed(2)}
CTR: ${summary.ctr.toFixed(2)}%
Reach: ${summary.reach}
Frequency: ${summary.frequency.toFixed(2)}
Total leads: ${summary.total_leads}
Total clicks: ${summary.clicks}
Impressions: ${summary.impressions}

IMPORTANT - TOP PERFORMING CREATIVES:
-------------------------
TOP PERFORMER: ${topPerformerSummary ? JSON.stringify(topPerformerSummary, null, 2) : "No top performer found"}
-------------------------
RUNNER-UP (SECOND BEST): ${secondBestSummary ? JSON.stringify(secondBestSummary, null, 2) : "No runner-up found"}
-------------------------
BEST CTR CREATIVE: ${bestCtrCreative ? bestCtrCreative.name + " (CTR: " + bestCtrCreative.metrics.clickThroughRate.toFixed(2) + "%)" : "None"}
BEST COST-PER-CLICK CREATIVE: ${bestCpcCreative ? bestCpcCreative.name + " (CPC: $" + bestCpcCreative.metrics.costPerClick.toFixed(2) + ")" : "None"}
BEST COST-PER-LEAD CREATIVE: ${bestCplCreative ? bestCplCreative.name + " (CPL: $" + bestCplCreative.metrics.costPerLead.toFixed(2) + ")" : "None"}
BEST CONVERSION RATE CREATIVE: ${bestConversionRateCreative ? bestConversionRateCreative.name + " (Conv. Rate: " + bestConversionRateCreative.metrics.conversionRate.toFixed(2) + "%)" : "None"}
-------------------------

We also have advanced data on time-of-day, platforms, and demographics. 
Here is the advanced data in JSON form (time_of_day, platforms, demographics):
time_of_day: ${advTime}
platforms: ${advPlat}
demographics: ${advDemo}

All Ad Creative Metrics (total: ${adCreativeMetrics.length}):
${JSON.stringify(adCreativeContents, null, 2)}

Combined Ad Creative Metrics (aggregated from all creatives):
${JSON.stringify(combinedCreativeMetrics, null, 2)}

Write a concise analysis, referencing key numbers, and giving actionable suggestions in ${language}.

IMPORTANT INSTRUCTIONS BASED ON CAMPAIGN TYPE:
- If this is a sales/conversion campaign (objective contains "CONVERSIONS", "SALES", or "PURCHASE"), focus on conversions metrics and ROI. Do NOT focus on leads as the primary metric.
- If this is a lead generation campaign (objective contains "LEAD" or "FORM"), focus on leads, cost per lead, and lead quality metrics.
- If this is a traffic or engagement campaign (objective contains "TRAFFIC", "ENGAGEMENT", "AWARENESS", "REACH"), focus on link clicks, impressions, and reach as the primary metrics. Do NOT discuss leads or conversions as primary metrics.

Then share Comparative Analysis with Numbers and proofs:
COMPARISON WITH OTHER CAMPAIGNS: 
${summary.other_campaign_insights ? JSON.stringify(summary.other_campaign_insights, null, 2) : "No other campaigns data available"}
- Compare this campaign's performance with other campaigns in the same account.
- Highlight any trends in performance across different campaigns.
- Identify which campaigns had the best ROI based on their objectives.
- Identify which campaigns had the best CTR, CPC, CPL, and conversion rates.
- Identify which campaigns had the best performance in terms of reach, impressions, and engagement.
It should cover comparative analysis of CAMPAIGN_NAME, OBJECTIVE, CTR, TYPE, BUDGET etc.
COMPARE BUDGET, AUDIENCE, AND PERFORMANCE with other campaigns. 

CREATIVE PERFORMANCE ANALYSIS:
- Each creative has "isTopPerformer" and "isSecondBest" flags to indicate overall performance.
- Each creative also has flags for specific metrics: "isBestCtr", "isBestCpc", "isBestCpl", and "isBestConversionRate".
- The "performanceScore" is a weighted calculation based on engagement, impressions, watch time, reach, and cost per click.
- Make sure to clearly identify which ad creative is the top performer and explain why.
- Compare the content and characteristics of top-performing creatives versus lower-performing ones.
- Note any patterns in what makes creatives successful (e.g., video vs. image, messaging themes, etc.)

The goal is that the user learns:
- Which platform delivers best ROI based on campaign objective (for conversion campaigns: lowest cost per conversion; for lead campaigns: lowest cost per lead; for traffic: lowest cost per click).
- Which time of day performs best for engagement/conversions.
- Which demographics yield the best results.
- How the different ad creatives compare in performance and WHY certain creatives perform better than others.
- User can see the comparison with other campaigns to understand what works best in the history.

Then recommend:
1. Which specific ad creatives should receive more budget allocation (refer to them by name).
2. Where to allocate more budget (platforms, demographics, or times).
3. Specific adjustments or scaling strategies to improve performance.
4. How to create future ad creatives based on what's working in the top-performing ads.
5. How to maximize KPIs relevant to the campaign objective for future campaigns.
`.trim();

    try {
      const resp = await fetch("/api/analyze-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      if (!resp.ok) {
        throw new Error("AI endpoint error: " + resp.status);
      }
      const data = await resp.json();
      return data.content || "No AI content returned.";
    } catch (error) {
      console.error("Error calling AI analysis endpoint:", error);
      return "AI analysis failed.";
    }
  }

  // Removed advanced data chart function

  // ----------------- Render Logic ------------------

  // 1) Not activated => show button
  if (!isActivated) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <button
          onClick={() => setIsActivated(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700 transition-all hover:scale-105"
        >
          <Brain className="size-5" />
          Analyze Campaign
        </button>
      </div>
    );
  }

  // 2) If thinkingStep < 3 => show thinking message
  const thinkingMessages = thinkingMessagesDict[userLang] || thinkingMessagesDict["en"];
  if (thinkingStep < 3) {
    const showIndex = Math.max(0, Math.min(thinkingStep - 1, thinkingMessages.length - 1));
    const messageToShow = thinkingStep === 0 ? "" : thinkingMessages[showIndex];
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <Brain className="size-8 text-emerald-500 animate-bounce" />
          {messageToShow && (
            <p className="text-sm text-zinc-400">{messageToShow}</p>
          )}
        </div>
      </div>
    );
  }

  // 3) If we are fetching => show localizable “fetching data...”
  if (isFetchingData) {
    const fetchMsg = fetchingDataDict[userLang] || fetchingDataDict.en;
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <Brain className="size-8 text-blue-400 animate-spin" />
          <p className="text-sm text-zinc-400">{fetchMsg}</p>
        </div>
      </div>
    );
  }

  // 4) No aggregator => error or no data
  if (!campaignSummary) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" />
          <p>No campaign data available</p>
        </div>
      </div>
    );
  }

  // 5) Finally show results
  return (
    <div className="space-y-6 p-6 bg-zinc-950 text-zinc-100 rounded-lg">
      {/* AI Analysis - Only keeping the text analysis */}
      <Card className="border-zinc-800/50 bg-zinc-900 shadow-xl rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Brain className="size-5 text-blue-400" />
              AI Campaign Analysis
            </CardTitle>
            {campaignSummary && (
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  campaignSummary.status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                )}
              >
                {campaignSummary.status}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {aiAnalysis ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h3: ({ children }) => (
                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 mt-6 first:mt-0">
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-2 mb-6">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                      <ChevronRight className="size-4 mt-1 shrink-0 text-zinc-500" />
                      <span>{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-emerald-400">{children}</strong>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm leading-relaxed text-zinc-300 mb-4">{children}</p>
                  )
                }}
              >
                {aiAnalysis.shortText}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 p-4">No AI insights available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
