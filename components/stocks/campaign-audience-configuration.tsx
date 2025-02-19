import { Audience, CampaignFormData } from '@/lib/types'
import React, { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../ui/collapsible'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { RangeSlider } from '../ui/range-slider'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'

interface CampaignAudienceConfigurationProps {
  formData: CampaignFormData
  updateFormData: (data: Partial<CampaignFormData>) => void
}

function CampaignAudienceConfiguration({
  formData,
  updateFormData
}: CampaignAudienceConfigurationProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const updateAudience = (index: number, audienceData: Partial<Audience>) => {
    const newAudiences = [...formData.audiences]
    newAudiences[index] = { ...newAudiences[index], ...audienceData }
    updateFormData({ audiences: newAudiences })
  }

  const handleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Audience</h2>

      {formData.audiences.map((audience, index) => (
        <Collapsible
          key={index}
          open={expandedIndex === index}
          onOpenChange={() => handleExpand(index)}
          className="space-y-2 border-b border-foreground/80 py-2"
        >
          <CollapsibleTrigger asChild>
            <div className="flex justify-between items-center cursor-pointer hover:underline">
              <h3 className="text-base font-medium">Audience {index + 1}</h3>
              {expandedIndex === index ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4">
            <div>
              <Label className="font-semibold">Location</Label>
              <Input
                placeholder="Enter location"
                value={audience.location}
                onChange={e =>
                  updateAudience(index, { location: e.target.value })
                }
              />
            </div>

            <div>
              <Label className="font-semibold">Age Range</Label>
              <div className="pt-2">
                <RangeSlider
                  value={audience.ageRange}
                  min={13}
                  max={65}
                  step={1}
                  onValueChange={value =>
                    updateAudience(index, {
                      ageRange: value as [number, number]
                    })
                  }
                />
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Age {audience.ageRange[0]} to {audience.ageRange[1]}
              </div>
            </div>

            {audience.targeting && (
              <div>
                <Label className="font-semibold">Targeting Filters</Label>
                <Input
                  placeholder="Enter targeting keywords"
                  value={audience.targeting.join(', ')}
                  onChange={e =>
                    updateAudience(index, {
                      targeting: e.target.value.split(',').map(s => s.trim())
                    })
                  }
                />
              </div>
            )}
            {audience.advantage && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={audience.advantage}
                  defaultChecked={audience.advantage}
                  onCheckedChange={checked =>
                    updateAudience(index, { advantage: checked as boolean })
                  }
                />
                <Label className="font-semibold">Advantage+</Label>
              </div>
            )}

            <div>
              <Label className="font-semibold">Ad Placements</Label>
              <div className="space-y-2 mt-2">
                {Object.entries(audience.placements).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${index}-${key}`}
                      checked={value}
                      onCheckedChange={checked =>
                        updateAudience(index, {
                          placements: {
                            ...audience.placements,
                            [key]: checked as boolean
                          }
                        })
                      }
                    />
                    <Label htmlFor={`${index}-${key}`}>
                      {key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="font-semibold">Budget</Label>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  defaultValue="15"
                  placeholder="Enter budget"
                  className=" pr-12"
                  value={audience.budget}
                  onChange={e =>
                    updateAudience(index, { budget: e.target.value })
                  }
                />
                <Badge className="absolute right-3 p-1 font-medium">USD</Badge>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}

export default CampaignAudienceConfiguration
