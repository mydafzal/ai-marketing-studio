import { z } from 'zod'
import { ModuleConfigBuilder } from '../moduleConfigBuilder'
import dynamic from 'next/dynamic'

const CampaignOptimizationComponent = dynamic(
  () => import('@/components/stocks/campaign-optimization'),
  {
    ssr: false,
    loading: () => <div className="p-4">Loading campaign optimization settings...</div>
  }
)

const campaignOptimizationModule = new ModuleConfigBuilder('showCampaignOptimization')
  .setDescription('Display a UI for managing campaign optimization subscriptions')
  .setParameters(
    z.object({
      toolCallId: z.string().describe('The ID of the tool call')
    })
  )
  .setComponent(async () => {
    return <CampaignOptimizationComponent />
  })
  .build()

export default campaignOptimizationModule