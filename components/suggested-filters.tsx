'use client'

import { ToolContent } from 'ai'
import { readStreamableValue, useActions, useAIState, useUIState } from 'ai/rsc'
import * as React from 'react'
import { useState, useContext, useCallback, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { Button } from '@/components/ui/button'
import { formatNumberDigit } from '@/lib/utils'
import { Adset, FlexibleSpec, ReachEstimateResult } from '@/lib/types'
import { IconSpinner } from '@/components/ui/icons'
import { builQueryString } from '@/lib/utils'
import { SuggestedFiltersResult } from './suggested-filters-result'

import { type AI } from '@/lib/chat/actions'

interface SuggestedFiltersProps {
    toolCallId: string
    suggestedFitlers: string[][]
    uiProps?: {
        suggestedFilter: FlexibleSpec
        success: boolean
    }
    isReadOnly?: boolean
}
const SuggestedFilterItem = ({
    estimate,
    handleUpdateAdset
}: {
    estimate: ReachEstimateResult
    handleUpdateAdset: (estimate: ReachEstimateResult) => void
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    return (
        <div className="bg-zinc-50 dark:bg-zinc-700 p-4 rounded-md shadow-md overflow-hidden flex justify-between items-center ">
            <div className="text-left">
                <h5 className="font-semibold dark:text-zinc-200">
                    {estimate?.targeting_spec?.flexible_spec?.[0]?.interests
                        .map(e => e.name)
                        .join(', ')}
                </h5>
                <div className="mt-4">
                    <p>Reach estimate:</p>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                        Between{' '}
                        <span className="font-semibold">
                            {formatNumberDigit(
                                estimate?.result.users_lower_bound || 0
                            )}
                        </span>{' '}
                        and{' '}
                        <span className="font-semibold">
                            {formatNumberDigit(
                                estimate?.result.users_upper_bound || 0
                            )}
                        </span>{' '}
                        users
                    </p>
                </div>
            </div>
            <div className="text-right gap-2 mb-2 justify-end">
                <Button
                    disabled={isSubmitting}
                    onClick={() => {
                        setIsSubmitting(true)
                        handleUpdateAdset(estimate)
                    }}
                    variant={'default'}
                    size="sm"
                >
                    {isSubmitting && <IconSpinner />}
                    {!isSubmitting && 'Accept'}
                </Button>
            </div>
        </div>
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

    const [suggestedFiltersUI, setSuggestedFiltersUI] =
        useState<null | React.ReactNode>(
            uiProps ? <SuggestedFiltersResult {...uiProps} /> : null
        )

    const handleUpdateAdset = async (estimateResult: ReachEstimateResult) => {
        if (!adset || !estimateResult) return
        setIsSubmitting(true)
        const response = await confirmUpdateAdset(
            adset.id,
            {
                targeting: {
                    ...adset.targeting,
                    flexible_spec: estimateResult.targeting_spec.flexible_spec
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
        console.log('reach estimate result', params)
        try {
            const response = await fetch(
                `/api/fasty-bot/proxy-reach-estimate${builQueryString(params)}`
            )
            const data = (await response.json()) as ReachEstimateResult[]
            console.log('reach estimate result', JSON.stringify(data))
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
    ) : isLoading ? (
        <IconSpinner />
    ) : !isReadOnly ? (
        <div className="p-0">
            <div className="text-lg font-medium text-gray-900 dark:text-zinc-300 mb-2">
                Let&apos;s pick some filters to target your audience
            </div>
            <div className="grid md:grid-cols-1 gap-4">
                {estimates.map((estimate, key) => (
                    <SuggestedFilterItem
                        key={key}
                        estimate={estimate}
                        handleUpdateAdset={handleUpdateAdset}
                    />
                ))}
            </div>
        </div>
    ) : (
        <div className="p-0">
            Error: Failed to set filter. Please try again later.
        </div>
    )
}
