import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Bookmark,
  Edit,
  Heart,
  LucideGlobe2,
  MessageCircle,
  MessageSquare,
  Send,
  Share2,
  ThumbsUp,
  User,
  User2,
  UserCircle
} from 'lucide-react'
import { Textarea } from '../ui/textarea'
import Image from 'next/image'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface CampaignAdPreviewProps {
  heading: string
  description: string
  setHeading: (value: string) => void
  setDescription: (value: string) => void
  handleTabChange: (value: string) => void
}

function CampaignAdPreview({
  heading,
  description,
  setHeading,
  setDescription,
  handleTabChange
}: CampaignAdPreviewProps) {
  const [isEditingDescription, setIsEditingDescription] = React.useState(false)
  const [isEditingHeading, setIsEditingHeading] = React.useState(false)

  return (
    <>
      <h3 className="text-lg font-bold">Ad Preview</h3>

      <Tabs
        defaultValue="facebook"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="w-full">
          <TabsTrigger
            value="facebook"
            className="flex-1 data-[state=active]:bg-foreground data-[state=active]:text-background "
          >
            Facebook Feed
          </TabsTrigger>
          <TabsTrigger
            value="instagram-feed"
            className="flex-1 data-[state=active]:bg-foreground data-[state=active]:text-background "
          >
            Instagram Feed
          </TabsTrigger>
          <TabsTrigger
            value="instagram-story"
            className="flex-1 data-[state=active]:bg-foreground data-[state=active]:text-background "
          >
            Instagram Story
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facebook" className="mt-4 text-black">
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
              {isEditingDescription ? (
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="outline-none resize-none text-black max-h-[100px]"
                  onBlur={() => setIsEditingDescription(false)}
                  autoFocus
                />
              ) : (
                <div className="flex items-center">
                  <p className="text-sm">{description}</p>
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="ml-2"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <Image
              src="/Reeply-logo-schwarz.png"
              alt="Ad preview"
              width={400}
              height={225}
              className="h-52 w-full bg-zinc-200"
            />

            <div className="px-4 pb-4 pt-3">
              {isEditingHeading ? (
                <Input
                  value={heading}
                  onChange={e => setHeading(e.target.value)}
                  className="text-black"
                  onBlur={() => setIsEditingHeading(false)}
                  autoFocus
                />
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{heading}</h3>
                  <button
                    onClick={() => setIsEditingHeading(true)}
                    className="ml-2"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
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
        </TabsContent>

        <TabsContent value="instagram-feed" className="mt-4 text-black">
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
              className="h-52 w-full bg-zinc-200"
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
        </TabsContent>

        <TabsContent
          value="instagram-story"
          className="mt-4 flex flex-col items-center"
        >
          <div className="bg-white rounded-md border border-white overflow-hidden w-[390px] h-[640px] self-center">
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center w-full h-full relative">
                <Image
                  src="/Reeply-logo-schwarz.png"
                  alt="Story preview"
                  layout="fill"
                  // objectFit="cover"
                />
              </div>

              <div className="p-6 bg-gradient-to-b from-white to-black h-[50%] items-end justify-end flex flex-col">
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
        </TabsContent>
      </Tabs>

      <Button size={'lg'} onClick={() => {}} className="w-full">
        Publish Campaign
      </Button>
    </>
  )
}

export default CampaignAdPreview
