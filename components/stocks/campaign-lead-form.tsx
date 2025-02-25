import { CampaignFormData } from '@/lib/types'
import React, { useState } from 'react'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Plus, X } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

interface CampaignLeadFormProps {
  formData: CampaignFormData
  updateFormData: (data: Partial<CampaignFormData>) => void
}

function CampaignLeadForm({ formData, updateFormData }: CampaignLeadFormProps) {
  const [isCustomQuestionsExpanded, setIsCustomQuestionsExpanded] =
    useState(true)

  const updateLeadForm = (data: Partial<typeof formData.leadForm>) => {
    updateFormData({ leadForm: { ...formData.leadForm, ...data } })
  }

  const addQuestion = () => {
    updateLeadForm({
      customQuestions: [...formData.leadForm.customQuestions, '']
    })
  }

  const removeQuestion = (index: number) => {
    const newQuestions = [...formData.leadForm.customQuestions]
    newQuestions.splice(index, 1)
    updateLeadForm({ customQuestions: newQuestions })
  }

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...formData.leadForm.customQuestions]
    newQuestions[index] = value
    updateLeadForm({ customQuestions: newQuestions })
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Lead Form</h2>

      <div className="">
        <Label className="font-semibold">Select from template</Label>

        <RadioGroup
          value={formData.leadForm.template}
          onValueChange={(value: 'basic' | 'standard') =>
            updateLeadForm({ template: value })
          }
          className="space-y-1 mt-1"
        >
          <TemplateOption
            value="basic"
            label="Basic"
            badges={['First Name', 'Last Name', 'Email']}
          />
          <TemplateOption
            value="standard"
            label="Standard"
            badges={['First Name', 'Last Name', 'Email', 'Phone Number']}
          />
        </RadioGroup>
      </div>

      <div>
        <Label className="font-semibold">Form Title</Label>
        <Input
          value={formData.leadForm.title}
          onChange={e => updateLeadForm({ title: e.target.value })}
          placeholder="Stay Updated with Tech Innovations"
        />
      </div>

      <div>
        <Label className="font-semibold">Form Description</Label>
        <Textarea
          value={formData.leadForm.description}
          className="resize-none"
          onChange={e => updateLeadForm({ description: e.target.value })}
          placeholder="Sign up to receive the latest updates on cutting-edge technology and innovations."
        />
      </div>

      <div>
        <Label className="font-semibold">Thank You Text</Label>
        <Textarea
          value={formData.leadForm.thankYouText}
          className="resize-none"
          onChange={e => updateLeadForm({ thankYouText: e.target.value })}
          placeholder="Thank you for signing up! We'll keep you updated with the latest tech innovations."
        />
      </div>

      <div>
        <Label className="font-semibold">
          Inform your clients how you will use this lead data
        </Label>
        <Textarea
          value={formData.leadForm.dataUsePolicy}
          className="resize-none"
          onChange={e => updateLeadForm({ dataUsePolicy: e.target.value })}
          placeholder="We will process this information based on our privacy policy seen on next page."
        />
      </div>

      <div>
        <Label className="font-semibold">Custom Questions</Label>
        <div className="space-y-2 mt-2">
          {formData.leadForm.customQuestions.map((question, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={question}
                onChange={e => updateQuestion(index, e.target.value)}
                placeholder="Enter your question"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(index)}
                className="h-10 w-10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={addQuestion}
            className="flex items-center gap-2 h-7"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CampaignLeadForm

const TemplateOption = ({
  value,
  label,
  badges
}: {
  value: 'basic' | 'standard'
  label: string
  badges: string[]
}) => (
  <div className="flex items-center space-x-3">
    <RadioGroupItem value={value} id={value} />
    <Label htmlFor={value}>
      {label}
      {badges.map(badge => (
        <Badge
          key={badge}
          variant="secondary"
          className="ml-2 bg-gray-200 dark:bg-[#27272A] rounded-full font-normal"
        >
          {badge}
        </Badge>
      ))}
    </Label>
  </div>
)
