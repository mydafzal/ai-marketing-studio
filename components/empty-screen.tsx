import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="max-w-2xl px-4 mx-auto">
      <div className="flex flex-col gap-4 rounded-xl border border-[#2A2E3A] bg-[#151925] p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-white">
          Welcome to Reeply AI
        </h1>
        <p className="text-base leading-relaxed text-[#ADB0B8]">
          This AI can help your marketing, helping you run Campaigns efficiently while having more time for your business!{' '}
          <ExternalLink href="https://reeply.ai" className="text-[#4BF29C] hover:text-[#5cffad] transition-colors"> Click here for more Infos on Reeply AI</ExternalLink>, the{' '}
          <ExternalLink href="https://reeply.ai" className="text-[#4BF29C] hover:text-[#5cffad] transition-colors">
            AI for your Marketing
          </ExternalLink>
        </p>
      </div>
    </div>
  )
}