import { auth } from '@/auth'
import CampaignOptimizationWrapper from './active-ui-wrapper'

export default async function CampaignOptimizationComponent() {
  const session = await auth()
  const userEmail = session?.user?.email || ''

  return <CampaignOptimizationWrapper userEmail={userEmail} />
}