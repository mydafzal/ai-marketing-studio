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
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    : isPositive
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm transition-all hover:shadow-md dark:bg-zinc-800">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-blue-500 dark:text-blue-400">{icon}</span>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
        </div>
        <div
          className={`flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pillClasses}`}
        >
          {isUp ? "↑" : "↓"} {Math.abs(percent)}%
        </div>
      </div>
      <div className="mb-2 text-xl font-semibold text-zinc-800 dark:text-white">
        {value}
      </div>

      {/* Mini chart placeholders (no actual chart) */}
      <div className="flex h-8 w-full items-end overflow-hidden rounded-md bg-slate-100 dark:bg-zinc-700">
        {miniChart === "sparkline" && (
          <div className="flex h-full w-full items-end">
            <div className="h-3/10 w-1/6 bg-blue-400" />
            <div className="h-2/5 w-1/6 bg-blue-400" />
            <div className="h-3/5 w-1/6 bg-blue-400" />
            <div className="h-1/2 w-1/6 bg-blue-400" />
            <div className="h-7/10 w-1/6 bg-blue-400" />
            <div className="h-4/5 w-1/6 bg-blue-400" />
          </div>
        )}
        {miniChart === "bar" && (
          <div className="flex h-full w-full items-end">
            <div className="mx-0.5 h-3/5 w-1/5 bg-indigo-400" />
            <div className="mx-0.5 h-2/5 w-1/5 bg-indigo-400" />
            <div className="mx-0.5 h-7/10 w-1/5 bg-indigo-400" />
            <div className="mx-0.5 h-1/2 w-1/5 bg-indigo-400" />
            <div className="mx-0.5 h-4/5 w-1/5 bg-indigo-400" />
          </div>
        )}
        {miniChart === "area" && (
          <div className="relative h-full w-full bg-gradient-to-t from-purple-400/30 to-purple-400/5">
            <div className="absolute inset-x-0 bottom-0 h-8 border-t border-purple-400" />
          </div>
        )}
        {miniChart === "line" && (
          <div className="relative h-full w-full">
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400" />
          </div>
        )}
      </div>
    </div>
  )
}