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
import { Brain, BarChart2, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// The user’s session info for retrieving the language
interface UserSession {
  preferred_language?: string;
}

// Props for your AI campaign analysis board
interface IAICampaignAnalysisProps {
  campaignId: string;
  isActive?: boolean;
  userSession?: UserSession; // <— important
}

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
    time_of_day?: Record<
      string,
      { impressions?: number; spend?: number; actions?: number }
    >;
    platforms?: Record<
      string,
      { impressions?: number; spend?: number; actions?: number }
    >;
    demographics?: Record<
      string,
      { impressions?: number; spend?: number; actions?: number }
    >;
  };
}

interface IAIAnalysis {
  shortText: string;
}

// Helper to get top segments
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

export default function AICampaignAnalysisBoard({
  campaignId,
  isActive,
  userSession
}: IAICampaignAnalysisProps) {
  const [isActivated, setIsActivated] = useState<boolean>(!!isActive);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [campaignSummary, setCampaignSummary] = useState<ICampaignSummary | null>(null);
  const [historicalMetrics, setHistoricalMetrics] = useState<IHistoricalMetrics | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<IAIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Tab for advanced metrics
  const [segmentTab, setSegmentTab] = useState<"timeOfDay"|"platforms"|"demographics">("timeOfDay");

  // 1) The user’s chosen language, from the session or fallback to "en"
  const userLang = userSession?.preferred_language || "en";

  // 2) Activate data fetching
  const handleActivate = () => setIsActivated(true);

  useEffect(() => {
    if (!campaignId || !isActivated) return;

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // 1) Basic campaign summary
        const summaryData = await getCampaignSummary(campaignId);
        setCampaignSummary(summaryData);

        // 2) Historical with advanced metrics
        const histData = await getCampaignHistoricalMetrics(
          campaignId,
          "last_year",
          true
        );
        setHistoricalMetrics(histData);

        // 3) Real AI analysis (using userLang!)
        setAiLoading(true);
        const analysisText = await getRealAIAnalysis(summaryData, histData, userLang);
        setAiAnalysis({ shortText: analysisText });
      } catch (err) {
        console.error("Error loading campaign data:", err);
      } finally {
        setIsLoading(false);
        setAiLoading(false);
      }
    };

    void fetchAllData();
  }, [campaignId, isActivated, userLang]);

  /**
   * Actually call your backend AI endpoint, e.g. `/api/analyze-campaign`,
   * passing both the data and the desired language.
   */
  async function getRealAIAnalysis(
    summary: ICampaignSummary,
    hist: IHistoricalMetrics,
    language: string
  ): Promise<string> {
    const prompt = `
Please respond in ${language}, analyzing these campaign metrics:

Campaign name: ${summary.campaign_name}
Total leads: ${summary.total_leads}
Total spent: ${summary.total_spent.toFixed(2)}
CTR: ${summary.ctr.toFixed(2)}%
Reach: ${summary.reach}
Frequency: ${summary.frequency.toFixed(2)}

We also have advanced data on time-of-day, platforms, and demographics.
Write a concise analysis, referencing key numbers, and giving actionable suggestions in ${language}.
    `.trim();

    try {
      const resp = await fetch("/api/analyze-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // <-- pass the user's chosen language in the body
        body: JSON.stringify({ prompt, language })
      });

      if (!resp.ok) {
        throw new Error("AI endpoint returned an error: " + resp.status);
      }

      const data = await resp.json();
      return data.content || "No AI content returned.";
    } catch (error) {
      console.error("Error calling AI analysis endpoint:", error);
      return "Failed to retrieve AI analysis.";
    }
  }

  function renderSegmentData() {
    if (!historicalMetrics?.advanced_metrics) {
      return (
        <div className="flex items-center justify-center h-64 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-400">No advanced metrics available</p>
        </div>
      );
    }

    let data: Array<{ segmentKey: string; actions: number }> = [];
    let title = "";

    if (segmentTab === "timeOfDay") {
      const segments = historicalMetrics.advanced_metrics.time_of_day || {};
      data = getTopSegments(segments, 5);
      title = "Time of Day";
    } else if (segmentTab === "platforms") {
      const segments = historicalMetrics.advanced_metrics.platforms || {};
      data = getTopSegments(segments, 5);
      title = "Platforms";
    } else {
      // "demographics"
      const segments = historicalMetrics.advanced_metrics.demographics || {};
      data = getTopSegments(segments, 5);
      title = "Demographics";
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <p className="text-sm text-zinc-400">No data available for {title}</p>
        </div>
      );
    }

    const chartData = data.map((item) => ({
      name: item.segmentKey,
      leads: item.actions
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">
            Top {title} Performance
          </p>
          <span className="text-xs text-zinc-500">Showing top 5 segments</span>
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
              <Bar dataKey="leads" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // *** RENDER-LOGIC ***
  if (!isActivated) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <button
          onClick={handleActivate}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700 transition-all hover:scale-105"
        >
          <Brain className="size-5" />
          Analyze Campaign
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <IconSpinner className="size-8 animate-spin text-emerald-500" />
          <p className="text-sm text-zinc-400">Loading campaign data...</p>
        </div>
      </div>
    );
  }

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

  // *** MAIN UI ***
  return (
    <div className="space-y-6 p-6 bg-zinc-950 text-zinc-100 rounded-lg">
      {/* 1) Campaign Info Card */}
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
                {campaignSummary.frequency.toFixed(1)} impressions per user
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2) Segments Card */}
      <Card className="border-zinc-800/50 bg-zinc-900 shadow-xl rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <BarChart2 className="size-5 text-zinc-400" />
            Segment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            {[
              { id: "timeOfDay", label: "Time of Day" },
              { id: "platforms", label: "Platforms" },
              { id: "demographics", label: "Demographics" }
            ].map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  segmentTab === tab.id
                    ? "bg-zinc-800 text-zinc-100 shadow-lg shadow-zinc-950/50"
                    : "text-zinc-400 hover:bg-zinc-800/50"
                )}
                onClick={() =>
                  setSegmentTab(tab.id as "timeOfDay" | "platforms" | "demographics")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
          {renderSegmentData()}
        </CardContent>
      </Card>

      {/* 3) AI Analysis Card */}
      <Card className="border-zinc-800/50 bg-zinc-900 shadow-xl rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Brain className="size-5 text-blue-400" />
            AI Campaign Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <div className="flex items-center gap-3 p-4">
              <IconSpinner className="size-4 animate-spin text-blue-500" />
              <p className="text-sm text-zinc-400">Analyzing campaign data...</p>
            </div>
          ) : aiAnalysis ? (
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
                className="text-sm leading-relaxed [&>h3:first-child]:mt-0"
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
