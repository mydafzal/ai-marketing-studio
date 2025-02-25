'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ImagePlus, X, Info } from 'lucide-react'
import { CampaignCreationFormData } from '@/lib/types'
import { campaignSchema } from '@/lib/schema/campaign-schema'
import { useEffect, useState } from 'react'
import { Label } from '../ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import FileInputModal from '../file-input-modal'

interface CampaignCreationFormProps {
  onSubmit: (formData: CampaignCreationFormData) => void
}

export function CampaignCreationForm({ onSubmit }: CampaignCreationFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<CampaignCreationFormData>({
    resolver: zodResolver(campaignSchema)
  })
  const [openFileInputModal, setOpenFileInputModal] = useState(false)

  const onSubmitForm = handleSubmit(data => {
    console.log('Submitted data:', data)
    onSubmit(data)
  })

  return (
    <form
      onSubmit={onSubmitForm}
      className="h-full p-6 overflow-y-auto space-y-4"
    >
      <div className="flex items-center justify-end">
        <X className="cursor-pointer" onClick={() => console.log('close')} />
      </div>

      <FileInputModal
        name="mediaFiles"
        control={control}
        openModal={openFileInputModal}
        setOpenModal={setOpenFileInputModal}
        trigger={
          <div className="border rounded-md py-7 flex flex-col items-center justify-center w-full">
            <ImagePlus size={36} />
            <h2 className="font-medium text-xl mt-1">Upload Media</h2>
          </div>
        }
      />
      {errors.mediaFiles && (
        <p className="text-red-500 text-sm mt-1">{errors.mediaFiles.message}</p>
      )}

      <Controller
        name="url"
        control={control}
        render={({ field }) => (
          <div>
            <Label
              htmlFor="url"
              className="font-semibold flex items-center mb-1 text-base"
            >
              Link
              <Tooltip>
                <TooltipTrigger className="text-sm">
                  <Info size={17} className="ml-2 " />
                </TooltipTrigger>
                <TooltipContent>Link.</TooltipContent>
              </Tooltip>
            </Label>

            <Input
              {...field}
              id="url"
              type="url"
              placeholder="Enter the link to what you'd like to advertise"
              className="h-10 text-base"
            />
            {errors.url && (
              <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>
            )}
          </div>
        )}
      />

      <div>
        <Controller
          name="budget"
          control={control}
          render={({ field }) => (
            <>
              <Label
                htmlFor="budget"
                className="font-semibold flex items-center mb-1 text-base"
              >
                Ad Budget (Daily)
                <Tooltip>
                  <TooltipTrigger className="text-sm">
                    <Info size={17} className="ml-2 " />
                  </TooltipTrigger>
                  <TooltipContent>Ad daily budget.</TooltipContent>
                </Tooltip>
              </Label>

              <div className="relative w-full">
                <Input
                  {...field}
                  id="budget"
                  type="number"
                  placeholder="Enter daily budget"
                  className="h-10 text-base pr-12"
                />
                <Badge className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 font-medium">
                  USD
                </Badge>
              </div>
              {errors.budget && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.budget.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <div>
            <Label
              htmlFor="description"
              className="font-semibold flex items-center mb-1 text-base"
            >
              Campaign Description
              <Tooltip>
                <TooltipTrigger className="text-sm">
                  <Info size={17} className="ml-2 " />
                </TooltipTrigger>
                <TooltipContent>Campaign Description.</TooltipContent>
              </Tooltip>
            </Label>

            <Textarea
              {...field}
              id="description"
              placeholder="Describe your campaign (optional)"
              className="h-24 text-base resize-none"
            />
          </div>
        )}
      />

      <Button type="submit" className="w-full" size="lg">
        Create Campaign with AI
      </Button>
    </form>
  )
}
