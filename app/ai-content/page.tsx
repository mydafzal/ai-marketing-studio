'use client'

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Twitter, Linkedin, Instagram, Copy, Check } from "lucide-react"
import { generateContent } from "@/app/actions/generate"
import { generateImages } from "@/app/actions/generate-image"

export default function AiContentPage() {
  const [textPrompt, setTextPrompt] = React.useState("")
  const [imagePrompt, setImagePrompt] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = React.useState(false)
  const [generatedImages, setGeneratedImages] = React.useState<string[]>([])
  const [copiedStates, setCopiedStates] = React.useState({
    twitter: false,
    linkedin: false,
    instagram: false
  })
  const [content, setContent] = React.useState({
    twitter: "Here you can see how your Twitter post will look like",
    linkedin: "Here you can see how your LinkedIn post will look like",
    instagram: "Here you can see how your Instagram post will look like"
  })
  const { toast } = useToast()

  const handleCopy = async (platform: 'twitter' | 'linkedin' | 'instagram') => {
    await navigator.clipboard.writeText(content[platform])
    setCopiedStates(prev => ({ ...prev, [platform]: true }))
    
    toast({
      title: "Copied!",
      description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} content copied to clipboard`,
    })

    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [platform]: false }))
    }, 2000)
  }

  const handleGenerate = async () => {
    if (!textPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const generatedContent = await generateContent(textPrompt)
      setContent(generatedContent)
      toast({
        title: "Success",
        description: "Generated social media content successfully",
      })
    } catch (error) {
      console.error('Error generating content:', error)
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageGenerate = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive"
      })
      return
    }
  
    setIsGeneratingImages(true)
    try {
      const result = await generateImages(imagePrompt)
      console.log('Generation result:', JSON.stringify(result));
      
      if (result.success && result.images && result.images.length > 0) {
        // Ensure we're working with an array of strings
        const validUrls = result.images.filter(url => typeof url === 'string');
        setGeneratedImages(validUrls);
        
        toast({
          title: "Success",
          description: `Generated ${validUrls.length} image(s) successfully`,
        })
      } else {
        throw new Error(result.error || 'Failed to generate images')
      }
    } catch (error) {
      console.error('Error in handleImageGenerate:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate images. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingImages(false)
    }
  }
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">AI Content Generation</h1>
          <p className="text-muted-foreground">
            Create various types of AI-generated content for your campaigns
          </p>
        </div>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ugc">AI UGC Video</TabsTrigger>
            <TabsTrigger value="image">AI Image Creatives</TabsTrigger>
            <TabsTrigger value="text">AI Text Content</TabsTrigger>
          </TabsList>

          <TabsContent value="ugc">
            <Card>
              <CardHeader>
                <CardTitle>AI UGC Video Generation</CardTitle>
                <CardDescription>
                  Create engaging user-generated style videos using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-96 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  <span className="text-muted-foreground">
                    UGC Video Generation Interface Coming Soon
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle>AI Image Creatives</CardTitle>
                <CardDescription>
                  Generate custom images and visual assets for your marketing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side - Input */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="imagePrompt" className="text-sm font-medium">
                        Enter your image prompt
                      </label>
                      <Textarea
                        id="imagePrompt"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the images you want to generate..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleImageGenerate}
                      disabled={isGeneratingImages}
                    >
                      {isGeneratingImages ? "Generating..." : "Generate Images"}
                    </Button>
                  </div>

                  {/* Right side - Image Previews */}
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.length > 0 ? (
                      generatedImages.map((imageUrl, index) => (
                        <div 
                          key={index}
                          className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
                        >
                          <Image
                            src={imageUrl}
                            alt={`Generated image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      // Placeholder grid
                      Array.from({ length: 4 }).map((_, index) => (
                        <div 
                          key={index}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center"
                        >
                          <span className="text-muted-foreground text-sm">
                            Image {index + 1}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text">
            <Card>
              <CardHeader>
                <CardTitle>AI Text Content</CardTitle>
                <CardDescription>
                  Generate engaging social media posts using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side - Input */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="textPrompt" className="text-sm font-medium">
                        Enter your content prompt
                      </label>
                      <Textarea
                        id="textPrompt"
                        value={textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                        placeholder="Describe what kind of content you want to generate..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Generate Content"}
                    </Button>
                  </div>

                  {/* Right side - Previews */}
                  <div className="space-y-6">
                    {/* Twitter Preview */}
                    <div className="relative border rounded-xl p-4 space-y-3 bg-white dark:bg-gray-800">
                      <div className="absolute top-4 right-4">
                        <Twitter className="size-5 text-[#1DA1F2]" />
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="size-10 rounded-full overflow-hidden">
                          <Image
                            src="/Reeplylogoicon.png"
                            alt="Reeply Logo"
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold">Reeply AI</div>
                          <div className="text-gray-500">@reeplyai</div>
                        </div>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">
                        {content.twitter}
                      </div>
                      <div className="text-gray-500 text-sm">
                        12:00 PM · Jan 1, 2024
                      </div>
                      <button
                        onClick={() => handleCopy('twitter')}
                        className="absolute bottom-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Copy content"
                      >
                        {copiedStates.twitter ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {/* LinkedIn Preview */}
                    <div className="relative border rounded-xl p-4 space-y-3 bg-white dark:bg-gray-800">
                      <div className="absolute top-4 right-4">
                        <Linkedin className="size-5 text-[#0A66C2]" />
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="size-12 rounded-full overflow-hidden">
                          <Image
                            src="/Reeplylogoicon.png"
                            alt="Reeply Logo"
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold">Reeply AI</div>
                          <div className="text-gray-500 text-sm">AI-Powered Marketing Solutions</div>
                        </div>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                        {content.linkedin}
                      </div>
                      <div className="flex items-center space-x-4 text-gray-500 text-sm">
                        <span>1,234 reactions</span>
                        <span>·</span>
                        <span>100 comments</span>
                      </div>
                      <button
                        onClick={() => handleCopy('linkedin')}
                        className="absolute bottom-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Copy content"
                      >
                        {copiedStates.linkedin ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {/* Instagram Preview */}
                    <div className="relative border rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                      <div className="absolute top-4 right-4">
                        <Instagram className="size-5 text-[#E4405F]" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="size-8 rounded-full overflow-hidden">
                            <Image
                              src="/Reeplylogoicon.png"
                              alt="Reeply Logo"
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <div className="font-bold">reeplyai</div>
                        </div>
                        <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                          {content.instagram}
                        </div>
                      </div>
                      <div className="border-t p-4 space-y-2">
                        <div className="flex space-x-4">
                          <span>❤️ 1,234 likes</span>
                        </div>
                        <div className="text-gray-500 text-sm">
                          2 HOURS AGO
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy('instagram')}
                        className="absolute bottom-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Copy content"
                      >
                        {copiedStates.instagram ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}