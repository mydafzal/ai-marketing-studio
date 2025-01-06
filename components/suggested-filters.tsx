'use client'

import { ToolContent } from 'ai'
import { readStreamableValue, useActions, useAIState, useUIState } from 'ai/rsc'
import * as React from 'react'
import { useState, useContext, useCallback, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatNumberDigit } from '@/lib/utils'
import { Adset, FlexibleSpec, ReachEstimateResult } from '@/lib/types'
import { IconSpinner } from '@/components/ui/icons'
import { builQueryString } from '@/lib/utils'
import { SuggestedFiltersResult } from './suggested-filters-result'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Target, Users, TrendingUp, CheckCircle, BrainCircuit } from 'lucide-react'
import { type AI } from '@/lib/chat/actions'

interface SuggestedFiltersProps {
    toolCallId: string
    suggestedFitlers: string[]
    uiProps?: {
        suggestedFilter: FlexibleSpec
        success: boolean
    }
    isReadOnly?: boolean
}

const SuggestedFilterItem = ({
    estimate,
    isChecked,
    onChange
}: {
    isChecked: boolean,
    estimate: ReachEstimateResult
    onChange: () => void
}) => {
    const lowerBound = formatNumberDigit(estimate?.result.users_lower_bound || 0)
    const upperBound = formatNumberDigit(estimate?.result.users_upper_bound || 0)
    
    return (
        <Card className="overflow-hidden border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors">
            <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow space-y-4">
                        <div className="flex items-center gap-3">
                            <Target className="h-5 w-5 text-blue-500" />
                            <h3 className="font-medium text-gray-900 dark:text-zinc-100">
                                {estimate?.targeting_spec?.flexible_spec?.[0]?.interests
                                    .map(e => e.name)
                                    .join(', ')}
                            </h3>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                                <Users className="h-4 w-4" />
                                <span>Target Audience Size for this Filter</span>
                            </div>
                            <div className="pl-6 space-y-1">
                                <div className="flex items-baseline gap-1 text-gray-700 dark:text-zinc-300">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <span className="font-semibold text-lg">{lowerBound}</span>
                                    <span className="text-gray-500 dark:text-zinc-500">to</span>
                                    <span className="font-semibold text-lg">{upperBound}</span>
                                    <span className="text-gray-500 dark:text-zinc-500 text-sm ml-1">users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-1">
                        <Checkbox
                            id={`filter-${estimate?.targeting_spec?.flexible_spec?.[0]?.interests[0].id}`}
                            checked={isChecked}
                            onCheckedChange={onChange}
                            className="h-6 w-6 border-2 border-gray-300 dark:border-zinc-600 rounded-full
                                     data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500
                                     transition-colors hover:border-blue-500 dark:hover:border-blue-400"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function SuggestedFilters({
    toolCallId,
    suggestedFitlers,
    isReadOnly,
    uiProps
}: SuggestedFiltersProps) {
    const { adset, setAdset } = useContext(CampaignContext)
    const [isLoading, setLoading] = useState<boolean>(false)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const { confirmUpdateAdset, syncMessages } = useActions()
    const [aiState, setAIState] = useAIState()
    const [_, setMessages] = useUIState<typeof AI>()
    const [estimates, setEstimates] = useState<ReachEstimateResult[]>([])
    const [filterIdxs, setFilterIdxs] = useState<number[]>([])
    const [suggestedFiltersUI, setSuggestedFiltersUI] =
        useState<null | React.ReactNode>(
            uiProps ? <SuggestedFiltersResult {...uiProps} /> : null
        )

    const handleChange = (idx: number) => {
        if (!filterIdxs.includes(idx)) {
            setFilterIdxs([...filterIdxs, idx])
        } else {
            setFilterIdxs([...filterIdxs.filter(index => index != idx)])
        }
    }

    const handleUpdateAdset = async () => {
        let seletedinterests: {
            id: string
            name: string
        }[] = []
        
        estimates
            .filter((estimate, idx) => filterIdxs.includes(idx))
            .map((estimate, idx) => {
                if (estimate.targeting_spec.flexible_spec) {
                    estimate.targeting_spec.flexible_spec?.map(estimate => {
                        seletedinterests = [...seletedinterests, ...estimate.interests]
                    })
                }
            })
            
        if (!adset || filterIdxs.length === 0) return
        setIsSubmitting(true)
        
        const response = await confirmUpdateAdset(
            toolCallId,
            adset.id,
            {
                targeting: {
                    ...adset.targeting,
                    flexible_spec: [
                        {
                            interests: seletedinterests
                        }
                    ]
                }
            },
            'suggested_filters'
        )
        
        setMessages(currentMessages => [
            ...currentMessages,
            response.newMessage
        ])
        
        for await (const updatedAdset of readStreamableValue<Adset>(
            response.response
        )) {
            if (updatedAdset) {
                const flexible_spec = updatedAdset?.targeting
                    ?.flexible_spec as FlexibleSpec[]

                const messages = aiState.messages
                const lastMessage = messages.slice(-1)[0]
                if (!lastMessage || lastMessage.id !== toolCallId) {
                    return console.error(
                        'Exception: last message is empty or not matching to toolCallId in suggested-filters component.',
                        lastMessage
                    )
                }
                
                const content = (lastMessage.content as ToolContent)[0]
                if (content.type !== 'tool-result') {
                    return console.error(
                        'Exception: content type is not tool-result in suggested-filters component.',
                        lastMessage
                    )
                }
                
                if (content.toolName !== 'showSuggestedFilters') {
                    return console.error(
                        'Exception: tool name not matching in suggested-filters component.',
                        lastMessage
                    )
                }
                
                content.result = {
                    ...(content.result as Object),
                    uiProps: {
                        success: true,
                        targeting: updatedAdset.targeting,
                        suggestedFilter:
                            updatedAdset.targeting.flexible_spec?.[0]
                    }
                }
                
                setAIState({
                    ...aiState,
                    messages: [...messages]
                })
                
                setAdset(updatedAdset)
                setSuggestedFiltersUI(
                    <SuggestedFiltersResult
                        success={true}
                        suggestedFilter={flexible_spec[0]}
                    />
                )
                await syncMessages()
            }
        }
        setIsSubmitting(false)
    }

    const getReachEstimates = async (targeting: any, filters: any) => {
        if (isLoading) return
        setLoading(true)
        const params = {
            targeting_spec: JSON.stringify(targeting),
            filters: JSON.stringify(filters)
        }
        
        try {
            const response = await fetch(
                `/api/fasty-bot/proxy-reach-estimate${builQueryString(params)}`
            )
            const data = (await response.json()) as ReachEstimateResult[]
            setEstimates(data)
        } catch (error) {
            console.error('Error fetching results:', error)
        } finally {
            setLoading(false)
        }
        return []
    }

    useEffect(() => {
        if (!isReadOnly && adset && suggestedFitlers.length > 0) {
            getReachEstimates(adset?.targeting, suggestedFitlers)
        }
    }, [isReadOnly, adset, suggestedFitlers])

    return suggestedFiltersUI ? (
        suggestedFiltersUI
    ) : (
        <Card className="bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-zinc-100">
                    <BrainCircuit className="h-5 w-5 text-blue-500" />
                    AI-Suggested Targeting Filters
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <IconSpinner className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                ) : !isReadOnly ? (
                    <div className="space-y-6">
                        <p className="text-gray-600 dark:text-zinc-400">
                            I have analyzed your campaign and found the following targeting filters that can help you reach more users. Please click the ones that you like most:
                        </p>
                        <div className="space-y-4">
                            {estimates.map((estimate, key) => (
                                <SuggestedFilterItem
                                    key={key}
                                    isChecked={filterIdxs.includes(key)}
                                    estimate={estimate}
                                    onChange={() => handleChange(key)}
                                />
                            ))}
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button
                                disabled={isSubmitting || filterIdxs.length === 0}
                                onClick={handleUpdateAdset}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <IconSpinner className="h-4 w-4 animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Apply Selected Filters</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center text-gray-500 dark:text-zinc-400">
                        Error: Failed to load targeting filters. Please try again later.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default SuggestedFilters;