'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImagePlus, FilmIcon } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'

interface CampaignCreationFormProps {
  onSubmit: (formData: CampaignCreationFormData) => void
}

export interface CampaignCreationFormData {
  instaImage1080x1080: FileList | null
  instaVideo9x16: FileList | null
  fbImage1080x1080: FileList | null
  fbVideo9x16: FileList | null
  url: string
  budget: string
  description?: string
}

export function CampaignCreationForm({ onSubmit }: CampaignCreationFormProps) {
  const [formData, setFormData] = useState<CampaignCreationFormData>({
    instaImage1080x1080: null,
    fbImage1080x1080: null,
    instaVideo9x16: null,
    fbVideo9x16: null,
    url: '',
    budget: '',
    description: ''
  })

  const handleFileChange = (
    type: keyof CampaignCreationFormData,
    fileList: FileList | null,
    dimensions?: { width: number; height: number }
  ) => {
    if (fileList && fileList.length > 0 && dimensions) {
      const file = fileList[0]
      const reader = new FileReader()
      reader.onload = e => {
        const url = e.target?.result as string
        if (file.type.startsWith('image/')) {
          const img = new Image()
          img.onload = () => {
            if (
              img.width === dimensions.width &&
              img.height === dimensions.height
            ) {
              setFormData(prev => ({ ...prev, [type]: fileList }))
            } else {
              alert(
                `The file dimensions should be ${dimensions.width}x${dimensions.height}px`
              )
            }
          }
          img.src = url
        } else if (file.type.startsWith('video/')) {
          const video = document.createElement('video')
          video.onloadedmetadata = () => {
            if (
              video.videoWidth === dimensions.width &&
              video.videoHeight === dimensions.height
            ) {
              setFormData(prev => ({ ...prev, [type]: fileList }))
            } else {
              alert(
                `The file dimensions should be ${dimensions.width}x${dimensions.height}px`
              )
            }
          }
          video.src = url
        }
      }
      reader.readAsDataURL(file)
    } else {
      setFormData(prev => ({ ...prev, [type]: fileList }))
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    const {
      instaImage1080x1080,
      instaVideo9x16,
      fbImage1080x1080,
      fbVideo9x16,
      url,
      budget
    } = formData

    if (
      !instaImage1080x1080 ||
      !instaVideo9x16 ||
      !fbImage1080x1080 ||
      !fbVideo9x16 ||
      !url ||
      !budget
    ) {
      alert('All image, video, URL, and budget fields are required.')
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="h-full p-6 overflow-y-auto ">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Complete the steps on the right side of the screen to create your
          campaign
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h4 className="text-lg font-semibold text-center">Instagram</h4>
          </div>

          <FileInput
            id="instaImage1080x1080"
            heading="Ad post"
            label="Add Image"
            subLabel="1080x1080px"
            icon={ImagePlus}
            accept="image/*"
            files={formData.instaImage1080x1080}
            onChange={e =>
              handleFileChange('instaImage1080x1080', e.target.files, {
                width: 1080,
                height: 1080
              })
            }
          />
          <FileInput
            id="instaVideo9x16"
            label="Add Video"
            heading="Story post"
            subLabel="1080x1920 px"
            icon={FilmIcon}
            accept="video/*"
            files={formData.instaVideo9x16}
            onChange={e =>
              handleFileChange('instaVideo9x16', e.target.files, {
                width: 1080,
                height: 1920
              })
            }
          />

          <div className="col-span-2">
            <h4 className="text-lg font-semibold text-center">Facebook</h4>
          </div>

          <FileInput
            id="fbImage1080x1080"
            label="Add Image"
            subLabel="1080x1080px"
            heading="Ad Post"
            icon={ImagePlus}
            accept="image/*"
            files={formData.fbImage1080x1080}
            onChange={e =>
              handleFileChange('fbImage1080x1080', e.target.files, {
                width: 1080,
                height: 1080
              })
            }
          />
          <FileInput
            id="fbVideo9x16"
            label="Add Video"
            heading="Story Post"
            subLabel="1080x1920 px"
            icon={FilmIcon}
            files={formData.fbVideo9x16}
            accept="video/*"
            onChange={e =>
              handleFileChange('fbVideo9x16', e.target.files, {
                width: 1080,
                height: 1920
              })
            }
          />
        </div>

        <Input
          id="url"
          name="url"
          type="url"
          placeholder="Enter the link to what you'd like to advertise"
          value={formData.url}
          onChange={handleInputChange}
          className="h-10 text-base"
        />

        <div className="relative flex items-center">
          <Input
            id="budget"
            name="budget"
            type="number"
            placeholder="Enter daily budget"
            value={formData.budget}
            onChange={handleInputChange}
            className="h-10 text-base pr-12"
          />
          <Badge className="absolute right-3 p-1 font-medium">USD</Badge>
        </div>

        <Textarea
          id="description"
          name="description"
          placeholder="Describe your campaign (optional)"
          value={formData.description}
          onChange={handleInputChange}
          className="h-24 text-base resize-none"
        />

        <Button className="w-full" size="lg" onClick={handleSubmit}>
          Create Campaign with AI
        </Button>
      </div>
    </div>
  )
}

const FileInput = ({
  id,
  label,
  heading,
  subLabel,
  icon: Icon,
  accept,
  files,
  onChange
}: {
  id: string
  label: string
  heading: string
  subLabel: string
  icon: React.ElementType
  accept: string
  files: FileList | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
  <div
    className="p-5 border rounded-lg cursor-pointer items-center justify-center flex flex-col space-y-2"
    onClick={() => document.getElementById(id)?.click()}
  >
    <Label htmlFor={id} className="font-semibold">
      {heading}
    </Label>
    <Icon className="mr-2 h-6 w-6" />
    {files && files.length > 0 ? (
      <div className="space-y-1 w-full">
        {Array.from(files).map(file => (
          <div key={file.name} className="truncate w-full text-center">
            {file.name}
          </div>
        ))}
      </div>
    ) : (
      <>
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        <p className="font-normal text-xs text-foreground/40">{subLabel}</p>
      </>
    )}
    <Input
      id={id}
      type="file"
      accept={accept}
      multiple
      className="hidden"
      onChange={onChange}
    />
  </div>
)
