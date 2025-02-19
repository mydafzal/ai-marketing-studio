import { CampaignFormData } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'

interface CampaignObjectiveProps {
  formData: CampaignFormData
  updateFormData: (data: Partial<CampaignFormData>) => void
}

function CampaignObjective({
  formData,
  updateFormData
}: CampaignObjectiveProps) {
  return (
    <>
      <h3 className="text-lg font-semibold">Campaign Objective</h3>

      <div>
        <h3 className="text-base my-4 font-medium">
          What's the primary goal of your campaign?
        </h3>

        <RadioGroup
          value={formData.objective}
          onValueChange={(value: CampaignFormData['objective']) =>
            updateFormData({ objective: value })
          }
          className="space-y-2"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="lead-generation" id="lead" />
            <Label htmlFor="lead">Lead Generation</Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="recruitment" id="recruitment" />
            <Label htmlFor="recruitment">Recruitment</Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="conversions" id="conversions" />
            <Label htmlFor="conversions">Conversions</Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="brand-awareness" id="brand" />
            <Label htmlFor="brand">Brand Awareness</Label>
          </div>
        </RadioGroup>
      </div>
    </>
  )
}

export default CampaignObjective
