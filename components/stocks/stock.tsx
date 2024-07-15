'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { scaleLinear } from 'd3-scale'
import { format, subDays } from 'date-fns'
import { useResizeObserver } from 'usehooks-ts'
import { useAIState } from 'ai/rsc'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export interface CampaignResult {
  name: string
  status: string
  daily_budget: string
  created_time: string
  id: string
  clicks: string
  impressions: string
  spend: string
  ctr: string
  reach: string
  frequency: string
  unique_clicks: string
  actions: { action_type: string; value: string }[]
  date_start: string
  date_stop: string
  device_platform: string
  historical_leads?: { date: string; leads: number }[] // New property for historical leads data
}

const generateDailyData = (start: string, stop: string, length: number = 30) => {
  const startDate = new Date(start)
  const stopDate = new Date(stop)
  const data = []
  let currentDate = startDate

  // Generate historical data
  for (let i = length; i >= 0; i--) {
    const historicalDate = subDays(stopDate, i)
    data.push({
      date: format(historicalDate, 'MMM d'),
      leads: Math.floor(Math.random() * 100) // Generate random leads data for illustration
    })
  }

  // Generate future data within the campaign period
  while (currentDate <= stopDate) {
    data.push({
      date: format(currentDate, 'MMM d'),
      leads: Math.floor(Math.random() * 100) // Generate random leads data for illustration
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return data
}

export function Stock({ props: campaignData }: { props: CampaignResult }) {
  const [aiState, setAIState] = useAIState()
  const id = useId()
  const [view, setView] = useState<'daily' | 'historical'>('daily')
  const [dataAtTime, setDataAtTime] = useState({
    time: '00:00',
    value: campaignData.spend,
    x: 0
  })

  const [startHighlight, setStartHighlight] = useState(0)
  const [endHighlight, setEndHighlight] = useState(0)

  const chartRef = useRef<HTMLDivElement>(null)
  const { width = 0 } = useResizeObserver({
    ref: chartRef,
    box: 'border-box'
  })

  const xToDate = scaleLinear(
    [0, width],
    [new Date(campaignData.date_start), new Date(campaignData.date_stop)]
  )
  const xToValue = scaleLinear(
    [0, width],
    [0, parseFloat(campaignData.spend) * 2]
  )

  useEffect(() => {
    if (startHighlight && endHighlight) {
      const message = {
        id,
        role: 'system' as const,
        content: `[User has highlighted dates between ${format(
          xToDate(startHighlight),
          'd LLL'
        )} and ${format(xToDate(endHighlight), 'd LLL, yyyy')}]`
      }

      if (aiState.messages[aiState.messages.length - 1]?.id === id) {
        setAIState({
          ...aiState,
          messages: [...aiState.messages.slice(0, -1), message]
        })
      } else {
        setAIState({
          ...aiState,
          messages: [...aiState.messages, message]
        })
      }
    }
  }, [startHighlight, endHighlight, id, aiState, setAIState, xToDate])

  const dailyData = generateDailyData(campaignData.date_start, campaignData.date_stop)
  const totalLeads = dailyData.reduce((sum, day) => sum + day.leads, 0)

  return (
    <div className="rounded-xl border bg-zinc-950 p-4 text-green-400">
      <div className="float-right inline-block rounded-full bg-white/10 px-2 py-1 text-xs">
        {campaignData.status}
      </div>
      <div className="text-lg text-zinc-300">{campaignData.name}</div>
      <div className="text-3xl font-bold">{totalLeads} Leads</div>
      <div className="text mt-1 text-xs text-zinc-500">
        Created: {format(new Date(campaignData.created_time), 'MMM d, yyyy HH:mm')}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-zinc-500">Clicks:</span> {campaignData.clicks}
        </div>
        <div>
          <span className="text-zinc-500">Impressions:</span> {campaignData.impressions}
        </div>
        <div>
          <span className="text-zinc-500">CTR:</span> {campaignData.ctr}%
        </div>
        <div>
          <span className="text-zinc-500">Reach:</span> {campaignData.reach}
        </div>
        <div>
          <span className="text-zinc-500">Frequency:</span> {campaignData.frequency}
        </div>
        <div>
          <span className="text-zinc-500">Unique Clicks:</span> {campaignData.unique_clicks}
        </div>
        <div>
          <span className="text-zinc-500">Device Platform:</span> {campaignData.device_platform}
        </div>
        {campaignData.actions.map((action, index) => (
          <div key={index}>
            <span className="text-zinc-500">{action.action_type}:</span> {action.value}
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between">
        <button
          className={`px-4 py-2 rounded-lg ${view === 'daily' ? 'bg-zinc-700' : 'bg-zinc-600'}`}
          onClick={() => setView('daily')}
        >
          Daily View
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${view === 'historical' ? 'bg-zinc-700' : 'bg-zinc-600'}`}
          onClick={() => setView('historical')}
        >
          Historical View
        </button>
      </div>

      <div className="relative mt-4" ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={view === 'daily' ? [dailyData[dailyData.length - 1]] : dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="leads" fill="#34a853" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
