import { ExternalLink } from '@/components/external-link'

export function AccountNotConnected() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">Welcome to Reeply AI</h1>
        <p className="leading-normal text-muted-foreground">
          The AI Marketing Manager tool feature is coming soon! You are
          currently subscribed to use our AI Creatives Generator tool. Click
          here to navigate to the Ai Creatives Generator tool.
          <ExternalLink href="https://reeply.ai">
            {' '}
            Click here for more Infos on Reeply AI
          </ExternalLink>
          , the{' '}
          <ExternalLink href="https://reeply.ai">
            AI for your Marketing
          </ExternalLink>
        </p>
      </div>
    </div>
  )
}


