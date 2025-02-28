import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Welcome to Reeply AI
        </h1>
        <p className="leading-normal text-muted-foreground">
          This AI can help your marketing, helping you run Campaigns efficiently while having more time for your business!{' '}
          <ExternalLink href="https://reeply.ai"> Click here for more Infos on Reeply AI</ExternalLink>, the{' '}
          <ExternalLink href="https://reeply.ai">
            AI for your Marketing
          </ExternalLink>
        </p>

  
      </div>
    </div>
  )
}
