"use client";
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { IconSpinner } from "@/components/ui/icons";
import { getCampaignSummary } from "@/lib/api/fasty-bot/get-campaign-summary";
import { getCampaignHistoricalMetrics } from "@/lib/api/fasty-bot/helpers/get-campaign-historical-metrics";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Brain, BarChart2, AlertTriangle, ChevronRight, Globe2 } from "lucide-react";
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

/** AI analysis shape. */
interface IAIAnalysis {
  shortText: string;
}

// -------------- Helper: Retrieve top segments ---------------
function getTopSegments(
  segments: Record<string, { actions?: number }> | undefined,
  topN: number
) {
  if (!segments) return [];
  const arr = Object.entries(segments).map(([key, val]) => ({
    segmentKey: key,
    actions: val.actions || 0
  }));
  arr.sort((a, b) => b.actions - a.actions);
  return arr.slice(0, topN);
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
  const [aiAnalysis, setAiAnalysis] = useState<IAIAnalysis | null>(null);

  // The user’s real language fallback to "en"
  const [userLang, setUserLang] = useState<string>("en");

  // We have 3 sub-tabs for advanced data
  type AdvancedTab = "timeOfDay" | "platforms" | "demographics";
  const [advTab, setAdvTab] = useState<AdvancedTab>("timeOfDay");

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

  /** Actually fetch aggregator, historical, AI. */
  async function fetchAllData() {
    try {
      // 1) aggregator
      const summaryData = await getCampaignSummary(campaignId);
      setCampaignSummary(summaryData);

      // 2) historical
      const histData = await getCampaignHistoricalMetrics(campaignId, "last_year", true);
      setHistoricalMetrics(histData);

      // 3) AI: pass advanced data too
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

    const prompt = `
Please respond in ${language}, using a friendly, informal tone${
  language === "de" ? " (use 'Du' for the user)" : ""
}, with some emojis. Analyze these campaign metrics:

Campaign name: ${summary.campaign_name}
Total leads: ${summary.total_leads}
Total spent: ${summary.total_spent.toFixed(2)}
CTR: ${summary.ctr.toFixed(2)}%
Reach: ${summary.reach}
Frequency: ${summary.frequency.toFixed(2)}

We also have advanced data on time-of-day, platforms, and demographics. 
Here is the advanced data in JSON form (time_of_day, platforms, demographics):
time_of_day: ${advTime}
platforms: ${advPlat}
demographics: ${advDemo}

Write a concise analysis, referencing key numbers, and giving actionable suggestions in ${language}.

The goal is that the user learns:
- Which platform delivers best ROI (lowest cost per lead, highest CTR).
- Which time of day performs best for engagement/conversions.
- Which demographics yield the best results.

Then recommend:
1. Where to allocate more budget (platforms, demographics, or times).
2. Specific adjustments or scaling strategies to improve performance.
3. How to maximize CTR and reduce costs for future campaigns.
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

  // Render advanced data chart based on advTab
  function renderAdvancedChart() {
    if (!historicalMetrics?.advanced_metrics) {
      return (
        <div className="flex items-center justify-center h-64 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-400">No advanced metrics available</p>
        </div>
      );
    }

    // Decide which data we show
    let segments: Record<string, { actions?: number }> | undefined;
    let labelTitle = "Time of Day";

    if (advTab === "timeOfDay") {
      segments = historicalMetrics.advanced_metrics.time_of_day;
      labelTitle = "Time of Day";
    } else if (advTab === "platforms") {
      segments = historicalMetrics.advanced_metrics.platforms;
      labelTitle = "Platforms";
    } else {
      segments = historicalMetrics.advanced_metrics.demographics;
      labelTitle = "Demographics";
    }

    const data = getTopSegments(segments, 5);
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-400">No data available for {labelTitle}</p>
        </div>
      );
    }

    // Build chart data
    const chartData = data.map((item) => ({
      name: item.segmentKey,
      leads: item.actions
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">Top {labelTitle} Segments</p>
          <span className="text-xs text-zinc-500">Top 5 by leads</span>
        </div>
        <div className="h-64 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
              <XAxis
                dataKey="name"
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#666" }}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#666" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
                labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
                itemStyle={{ color: "#e4e4e7", padding: "2px 0" }}
              />
              <Bar dataKey="leads" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

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
      {/* Campaign Info Card */}
      <Card className="border-zinc-800/50 bg-gradient-to-b from-zinc-900 to-zinc-900/95 shadow-xl rounded-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-zinc-100">
              {campaignSummary.campaign_name}
            </CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs uppercase text-zinc-500">Created</p>
              <p className="text-sm text-zinc-300">
                {format(new Date(campaignSummary.creation_date), "MMM d, yyyy HH:mm")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-zinc-500">Performance</p>
              <p className="text-sm">
                <span className="text-emerald-400 font-medium">
                  {campaignSummary.total_leads} leads
                </span>
                <span className="text-zinc-600 mx-2">|</span>
                <span className="text-blue-400 font-medium">
                  €{campaignSummary.total_spent.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-zinc-500">Reach & CTR</p>
              <p className="text-sm">
                <span className="text-zinc-300">
                  {campaignSummary.reach.toLocaleString()}
                </span>
                <span className="text-zinc-600 mx-2">|</span>
                <span className="text-purple-300">
                  {campaignSummary.ctr.toFixed(2)}%
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-zinc-500">Frequency</p>
              <p className="text-sm text-zinc-300">
                {campaignSummary.frequency.toFixed(1)} impressions/user
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Metrics Tabs */}
      <Card className="border-zinc-800/50 bg-zinc-900 shadow-xl rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Globe2 className="size-5 text-zinc-400" />
            Advanced Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {[
              { id: "timeOfDay" as AdvancedTab, label: "Time of Day" },
              { id: "platforms" as AdvancedTab, label: "Platforms" },
              { id: "demographics" as AdvancedTab, label: "Demographics" }
            ].map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  advTab === tab.id
                    ? "bg-zinc-800 text-zinc-100 shadow-lg shadow-zinc-950/50"
                    : "text-zinc-400 hover:bg-zinc-800/50"
                )}
                onClick={() => setAdvTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {renderAdvancedChart()}
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card className="border-zinc-800/50 bg-zinc-900 shadow-xl rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Brain className="size-5 text-blue-400" />
            AI Campaign Analysis
          </CardTitle>
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
