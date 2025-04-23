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
interface AdCreativeMetrics {
  id: string;
  name: string;
  type: "image" | "video";
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
      setCampaignSummary(summaryData);

      // 2) historical
      const histData = await getCampaignHistoricalMetrics(campaignId, "last_year", true);
      setHistoricalMetrics(histData);

      // 3) fetch ad creative metrics (same as in campaignresults-creatives)
      try {
        const { adCreatives } = await getAllAdMetricsByCampaignId(campaignId);
        setAdCreativeMetrics(adCreatives);
      } catch (adMetricsErr) {
        console.error("Error fetching ad creative metrics:", adMetricsErr);
      }

      // 4) AI: pass all data for analysis
      const aiText = await getRealAIAnalysis(summaryData, histData, userLang);
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
    language: string
  ): Promise<string> {
    // Extract advanced data if present
    const advData = hist.advanced_metrics || {};
    const advTime = JSON.stringify(advData.time_of_day || {});
    const advPlat = JSON.stringify(advData.platforms || {});
    const advDemo = JSON.stringify(advData.demographics || {});

    // Determine campaign objective/type
    const campaignObjective = summary.objective || 
      (adCreativeMetrics.length > 0 ? adCreativeMetrics[0].metrics.objective : "");
    
    // Format the ad creative metrics for the AI
    const formattedAdCreatives = adCreativeMetrics.map(creative => ({
      id: creative.id,
      name: creative.name,
      type: creative.type,
      metrics: {
        impressions: creative.metrics.impressions,
        reach: creative.metrics.reach,
        spend: creative.metrics.spend,
        engagement: creative.metrics.engagement,
        watchTime: creative.metrics.watchTime,
        conversionRate: creative.metrics.conversionRate,
        clickThroughRate: creative.metrics.clickThroughRate,
        costPerClick: creative.metrics.costPerClick,
        frequency: creative.metrics.frequency,
        inlineLinkClicks: creative.metrics.inlineLinkClicks,
        uniqueClicks: creative.metrics.uniqueClicks,
        leads: creative.metrics.leads,
        conversions: creative.metrics.conversions,
        costPerLead: creative.metrics.costPerLead,
        costPerConversion: creative.metrics.costPerConversion
      }
    }));

    const prompt = `
Please respond in ${language}, using a friendly, informal tone${
  language === "de" ? " (use 'Du' for the user)" : ""
}, with some emojis. Analyze these campaign metrics:

Campaign name: ${summary.campaign_name}
Campaign objective: ${campaignObjective || "Unknown"}
Total spent: ${summary.total_spent.toFixed(2)}
CTR: ${summary.ctr.toFixed(2)}%
Reach: ${summary.reach}
Frequency: ${summary.frequency.toFixed(2)}
Total leads: ${summary.total_leads}
Total clicks: ${summary.clicks}
Impressions: ${summary.impressions}

We also have advanced data on time-of-day, platforms, and demographics. 
Here is the advanced data in JSON form (time_of_day, platforms, demographics):
time_of_day: ${advTime}
platforms: ${advPlat}
demographics: ${advDemo}

Ad Creative Metrics:
${JSON.stringify(formattedAdCreatives, null, 2)}

Write a concise analysis, referencing key numbers, and giving actionable suggestions in ${language}.

IMPORTANT INSTRUCTIONS BASED ON CAMPAIGN TYPE:
- If this is a sales/conversion campaign (objective contains "CONVERSIONS", "SALES", or "PURCHASE"), focus on conversions metrics and ROI. Do NOT focus on leads as the primary metric.
- If this is a lead generation campaign (objective contains "LEAD" or "FORM"), focus on leads, cost per lead, and lead quality metrics.
- If this is a traffic or engagement campaign (objective contains "TRAFFIC", "ENGAGEMENT", "AWARENESS", "REACH"), focus on link clicks, impressions, and reach as the primary metrics. Do NOT discuss leads or conversions as primary metrics.

The goal is that the user learns:
- Which platform delivers best ROI based on campaign objective (for conversion campaigns: lowest cost per conversion; for lead campaigns: lowest cost per lead; for traffic: lowest cost per click).
- Which time of day performs best for engagement/conversions.
- Which demographics yield the best results.
- How the different ad creatives compare in performance.

Then recommend:
1. Which ad creatives should receive more budget allocation.
2. Where to allocate more budget (platforms, demographics, or times).
3. Specific adjustments or scaling strategies to improve performance.
4. How to maximize KPIs relevant to the campaign objective for future campaigns.
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
