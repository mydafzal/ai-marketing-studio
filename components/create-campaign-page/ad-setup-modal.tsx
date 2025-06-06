import React from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the legacy AdSetupModal so it is not included in initial JS bundle
const LegacyAdSetupModal = dynamic(() => import('@/components/stocks/create-campaign-screen/components/AdSetupModal').then(m => m.AdSetupModal), { ssr: false })

// Re-exporting prop types as "any" to avoid heavy dependency graph
export interface AdSetupModalWrapperProps {
  isOpen: boolean
  onOpenChange: (v: boolean) => void
  [key: string]: any // Forward all other props
}

export function AdSetupModal(props: AdSetupModalWrapperProps) {
  // Cast to any to avoid TypeScript complaining about missing legacy props
  const ModalComponent: any = LegacyAdSetupModal
  return <ModalComponent {...props} />
} 