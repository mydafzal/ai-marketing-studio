import Onboarding from './OnboardingContainer'
import { OnboardingProvider, useOnboarding } from './OnboardingContext'
import BenefitsPanel from './BenefitsPanel'
import StepContent from './StepContent'
import { STEPS, SEGMENT_OPTIONS, GOAL_OPTIONS } from './types'
import type { 
  OnboardingProps, 
  Details, 
  InputErrors, 
  WebsiteAnalysisData 
} from './types'

export { 
  Onboarding,
  OnboardingProvider,
  useOnboarding,
  BenefitsPanel,
  StepContent,
  STEPS,
  SEGMENT_OPTIONS,
  GOAL_OPTIONS
}

export type {
  OnboardingProps,
  Details,
  InputErrors,
  WebsiteAnalysisData
}

// Default export for backward compatibility
export default Onboarding