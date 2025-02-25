import React from 'react'
import {
  Bookmark,
  Heart,
  LucideGlobe2,
  MessageCircle,
  MessageSquare,
  Send,
  Share2,
  ThumbsUp,
  User
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '../ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../ui/accordion'
import { EditAdModal } from '../edit-campaign-settings-modal'
import { FileInfo } from '@/lib/types'

interface CampaignAdPreviewProps {
  heading: string
  description: string
  setHeading: (value: string) => void
  setDescription: (value: string) => void
}
interface PreviewData {
  title: string
  text: string
  media?: FileInfo[]
}

function CampaignAdPreview({
  heading,
  description,
  setHeading,
  setDescription
}: CampaignAdPreviewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const previewData: PreviewData = {
    title: heading,
    text: description,
    media: [
      {
        url: '/dummy-1080x1920-video.mp4',
        type: 'video/jpg',
        dimensions: '1:1',
        name: 'Xbox Controller',
        size: 1000,
        file: new File([''], 'Xbox Controller', { type: 'image/jpeg' })
      }
    ]
  }

  const handleUpdatePreview = (data: Partial<PreviewData>) => {
    setHeading(data?.title || heading)
    setDescription(data.text || description)
    setIsEditModalOpen(false)
  }

  return (
    <>
      <h3 className="text-lg font-bold">Ad Preview</h3>

      <Accordion
        type="single"
        collapsible
        defaultValue="facebook"
        className="w-full"
      >
        <AccordionItem value="facebook">
          <AccordionTrigger>Facebook</AccordionTrigger>
          <AccordionContent className="text-black">
            <div className="flex justify-between items-center mb-2">
              <p className="text-md font-bold text-foreground">
                Facebook Post Preview
              </p>
              <Button
                size="sm"
                className="ml-2"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Ad
              </Button>
            </div>
            <div className="bg-white rounded-lg border border-2 border-black/10">
              <div className="flex items-center gap-2 px-4 pt-4">
                <div className="w-10 h-10 rounded-full">
                  <Image
                    src="/fb-profile-picture.svg"
                    alt="Profile Picture"
                    width={40}
                    height={40}
                    className="h-10 w-10"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#395996]">
                    Page_Name
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    Sponsored
                    <span className="text-[10px]">•</span>
                    <LucideGlobe2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm">{description}</p>
              </div>

              <Image
                src="/Reeply-logo-schwarz.png"
                alt="Ad preview"
                width={400}
                height={225}
                className="h-52 w-full bg-zinc-200"
              />

              <div className="px-4 pb-4 pt-3">
                <h3 className="text-sm font-medium">{heading}</h3>
              </div>

              <div className="flex items-center justify-between px-4 pb-4">
                <span className="flex items-center gap-2 text-sm">
                  <ThumbsUp className="w-4 h-4" />
                  Like
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4" />
                  Comment
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <Share2 className="w-4 h-4" />
                  Share
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="instagram-feed">
          <AccordionTrigger>Instagram</AccordionTrigger>
          <AccordionContent className="text-black">
            <div className="flex justify-between items-center mb-2">
              <p className="text-md font-bold text-foreground">
                Instagram Post Preview
              </p>
              <Button
                size="sm"
                className="ml-2"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Ad
              </Button>
            </div>
            <div className="bg-white rounded-lg border border-2 border-black/10">
              <div className="flex items-center gap-2 mb-3 px-4 pt-4">
                <div className="w-10 h-10 rounded-full border border-2 border-[#606770] flex items-center justify-center">
                  <User
                    className="w-10 h-10 -ml-1/2"
                    fill="#606770"
                    stroke="#606770"
                    strokeWidth={1}
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#395996]">
                    Page_Name
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1">
                    Sponsored
                  </div>
                </div>
              </div>

              <Image
                src="/Reeply-logo-schwarz.png"
                alt="Ad preview"
                width={400}
                height={225}
                className="w-full bg-zinc-200"
              />
              <div className="flex items-center justify-between pt-3 px-4 pb-4">
                <div className="flex items-center space-x-4">
                  <Heart className="w-5 h-5 text-[#797596]" />
                  <MessageCircle className="w-5 h-5 text-[#797596]" />
                  <Send className="w-5 h-5 text-[#797596]" />
                </div>
                <Bookmark className="w-5 h-5 text-[#797596]" />
              </div>

              <div className="px-4 pb-4">
                <h3 className="text-sm font-medium">{heading}</h3>
              </div>

              <div className="mb-4 px-4">
                <p className="text-sm">{description}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="instagram-story">
          <AccordionTrigger>Instagram Story</AccordionTrigger>

          <AccordionContent className="">
            <div className="flex justify-between items-center mb-2">
              <p className="text-md font-bold text-foreground">
                Instagram Story Preview
              </p>
              <Button
                size="sm"
                className="ml-2"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Ad
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-md border border-white overflow-hidden w-[390px] h-[640px] self-center relative">
                <video
                  src="/dummy-1080x1920-video.mp4"
                  className="w-full h-full object-cover"
                  loop
                  autoPlay
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent to-black/70 p-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">
                      {heading}
                    </h3>
                    <p className="text-sm text-white/90">{description}</p>
                    <Button
                      size="sm"
                      className="bg-white text-black hover:bg-white/90 rounded-md px-4 py-1.5 text-sm font-medium"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button size={'lg'} onClick={() => {}} className="w-full">
        Publish Campaign
      </Button>

      <EditAdModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdatePreview}
        initialData={previewData}
      />
    </>
  )
}

export default CampaignAdPreview
