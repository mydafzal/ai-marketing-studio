import { cn } from '@/lib/utils'

interface CampaignStepsProps {
  currentStep: number
  steps: { number: number; title: string }[]
}

export function CampaignSettingsSteps({
  currentStep,
  steps
}: CampaignStepsProps) {
  return (
    <div
      className={`flex ${steps.length > 2 ? 'justify-between' : 'justify-center'} mb-6`}
    >
      {steps.map((step, i) => (
        <div key={step.number} className="flex">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                currentStep >= step.number
                  ? 'bg-black text-white'
                  : 'bg-foreground/30 text-background'
              )}
            >
              {step.number}
            </div>
            <span className="text-sm mt-1 max-w-24 text-center">
              {step.title}
            </span>
          </div>
          <div className="flex self-center pb-9">
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-24 mx-2',
                  currentStep > i + 1 ? 'bg-primary' : 'bg-foreground/20'
                )}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
