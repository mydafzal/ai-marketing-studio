"use client"

import React from "react"

interface EnhancedMetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  percent: number
  miniChart: "sparkline" | "bar" | "area" | "line"
  isPositive?: boolean
}

export const EnhancedMetricItem: React.FC<EnhancedMetricItemProps> = ({
  icon,
  label,
  value,
  percent,
  miniChart,
  isPositive = true,
}) => {
  const isUp = percent > 0
  const pillClasses = isUp
    ? isPositive
      ? "bg-[#4AE04A]/20 text-[#4AE04A] border border-[#4AE04A]/30"
      : "bg-red-900/20 text-red-400 border border-red-800/30"
    : isPositive
    ? "bg-red-900/20 text-red-400 border border-red-800/30"
    : "bg-[#4AE04A]/20 text-[#4AE04A] border border-[#4AE04A]/30"

  return (
    <div className="rounded-xl bg-[#171920] p-3 shadow-md transition-all hover:shadow-lg">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>{icon}</span>
          <span className="text-sm text-zinc-300">{label}</span>
        </div>
        <div
          className={`flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pillClasses}`}
        >
          {isUp ? "↑" : "↓"} {Math.abs(percent)}%
        </div>
      </div>
      <div className="mb-2 text-xl font-semibold text-white">
        {value}
      </div>

      {/* Mini chart placeholders with updated styling */}
      <div className="flex h-8 w-full items-end overflow-hidden rounded-md bg-[#111318]">
        {miniChart === "sparkline" && (
          <div className="flex h-full w-full items-end">
            <div className="h-3/10 w-1/6 bg-[#4AE04A]/70" />
            <div className="h-2/5 w-1/6 bg-[#4AE04A]/70" />
            <div className="h-3/5 w-1/6 bg-[#4AE04A]/70" />
            <div className="h-1/2 w-1/6 bg-[#4AE04A]/70" />
            <div className="h-7/10 w-1/6 bg-[#4AE04A]/70" />
            <div className="h-4/5 w-1/6 bg-[#4AE04A]/70" />
          </div>
        )}
        {miniChart === "bar" && (
          <div className="flex h-full w-full items-end">
            <div className="mx-0.5 h-3/5 w-1/5 bg-[#4AE04A]/70" />
            <div className="mx-0.5 h-2/5 w-1/5 bg-[#4AE04A]/70" />
            <div className="mx-0.5 h-7/10 w-1/5 bg-[#4AE04A]/70" />
            <div className="mx-0.5 h-1/2 w-1/5 bg-[#4AE04A]/70" />
            <div className="mx-0.5 h-4/5 w-1/5 bg-[#4AE04A]/70" />
          </div>
        )}
        {miniChart === "area" && (
          <div className="relative h-full w-full bg-gradient-to-t from-[#4AE04A]/30 to-[#4AE04A]/5">
            <div className="absolute inset-x-0 bottom-0 h-8 border-t border-[#4AE04A]/50" />
          </div>
        )}
        {miniChart === "line" && (
          <div className="relative h-full w-full">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#4AE04A]/70" />
          </div>
        )}
      </div>
    </div>
  )
}