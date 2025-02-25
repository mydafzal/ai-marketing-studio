import React, { useState } from 'react'
import { Button } from '../ui/button'
import CampaignAdPreview from './campaign-ad-preview'
import { CampaignSettingsSteps } from './campaign-settings-steps'
import { CampaignFormData } from '@/lib/types'
import CampaignObjective from './campaign-objective'
import CampaignAudienceConfiguration from './campaign-audience-configuration'
import CampaignLeadForm from './campaign-lead-form'

const allSteps = [
  { number: 1, title: 'Campaign Objective' },
  { number: 2, title: 'Audience' },
  { number: 3, title: 'Lead Form' }
]

export function CampaignCreationFeedDisplay() {
  const [isEditingSettings, setIsEditingSettings] = useState(false)

  const [step, setStep] = useState<number>(1)
  const [formData, setFormData] = useState<CampaignFormData>({
    objective: 'lead-generation',
    audiences: [
      {
        location: '',
        ageRange: [19, 65],
        targeting: [],
        placements: {
          facebookFeed: true,
          instagramFeed: true,
          facebookStories: false,
          instagramStories: false,
          instagramExplore: false,
          instagramExploreHome: false,
          instagramReels: false
        },
        gender: {
          male: true,
          female: true
        },
        budget: '15'
      },
      {
        location: '',
        ageRange: [19, 65],
        advantage: true,
        placements: {
          facebookFeed: true,
          instagramFeed: true,
          facebookStories: false,
          instagramStories: false,
          instagramExplore: false,
          instagramExploreHome: false,
          instagramReels: false
        },
        gender: {
          male: true,
          female: true
        },
        budget: '15'
      }
    ],
    leadForm: {
      template: 'standard',
      title: '',
      description: '',
      thankYouText: '',
      dataUsePolicy: '',
      customQuestions: []
    },
    preview: {
      description:
        "Discover cutting-edge innovations that will transform your daily life. Join us in shaping tomorrow's technology landscape.",
      heading: 'Experience the Future of Tech'
    }
  })

  const handleEditSettings = () => {
    setIsEditingSettings(prev => !prev)
  }

  const handleSaveSettings = () => {
    setIsEditingSettings(false)
  }

  const updateFormData = (data: Partial<CampaignFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const updatePreview = (data: Partial<CampaignFormData['preview']>) => {
    setFormData(prev => ({
      ...prev,
      preview: { ...prev.preview, ...data }
    }))
  }

  const filteredSteps = allSteps.filter(step => {
    if (step.number === 3) {
      return (
        formData.objective === 'lead-generation' ||
        formData.objective === 'recruitment'
      )
    }
    return true
  })

  return (
    <div className="h-full p-6 overflow-y-auto space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Create Facebook Campaign</h3>
        <Button
          size={'sm'}
          onClick={handleEditSettings}
          className="bg-black text-white hover:bg-black/60 dark:hover:bg-gray-800"
        >
          {isEditingSettings ? 'Close Settings' : 'Edit Campaign Settings'}
        </Button>
      </div>

      {isEditingSettings ? (
        <div>
          <CampaignSettingsSteps currentStep={step} steps={filteredSteps} />

          <div className="">
            {step === 1 && (
              <CampaignObjective
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {step === 2 && (
              <CampaignAudienceConfiguration
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {step === 3 && (
              <CampaignLeadForm
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant={'default'}
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className={step === 1 ? 'cursor-not-allowed opacity-50' : ''}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (step === filteredSteps.length) {
                  console.log('Form submitted:', formData)
                  handleSaveSettings()
                } else {
                  setStep(step + 1)
                }
              }}
            >
              {step === filteredSteps.length ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      ) : (
        <CampaignAdPreview
          heading={formData.preview.heading}
          description={formData.preview.description}
          setHeading={heading => updatePreview({ heading })}
          setDescription={description => updatePreview({ description })}
        />
      )}
    </div>
  )
}
