'use client'

import type React from 'react'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import Image from 'next/image'
import { FileInfo } from '@/lib/types'
import { validateFileDimensions } from '@/lib/helpers/file-dimensions/validate-file-dimensions'
import { useToast } from './ui/use-toast'

interface EditAdModalProps {
  open: boolean
  onClose: () => void
  onUpdate: (data: { title: string; text: string; media?: FileInfo[] }) => void
  initialData: {
    title: string
    text: string
    media?: FileInfo[]
  }
}

export function EditAdModal({
  open,
  onClose,
  onUpdate,
  initialData
}: EditAdModalProps) {
  const [formData, setFormData] = useState(initialData)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      const validFiles: FileInfo[] = []

      for (const file of fileArray) {
        const fileInfo = await validateFileDimensions(file)
        if (fileInfo) {
          validFiles.push(fileInfo)
        } else {
          toast({
            title: 'Error',
            description: 'File dimensions should be 1080x1080 or 1080x1920',
            variant: 'destructive'
          })
        }
      }

      if (validFiles.length > 0) {
        setFormData({ ...formData, media: validFiles })
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // onUpdate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Ad</DialogTitle>
          <DialogDescription className="bg-foreground/10 px-3 py-2 rounded-md flex items-center">
            <Info size={17} className="text-foreground" />
            <p className="text-sm text-foreground ml-2">
              <strong>1:1</strong> is used for for posts and{' '}
              <strong>9:16</strong> is used for reels and story.
            </p>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-2">
            <div className="flex flex-col items-center justify-center">
              {formData.media && formData.media?.length > 0 ? (
                <>
                  {formData.media.map((media, index) => (
                    <>
                      {media.type.startsWith('image/') ? (
                        <Image
                          key={index}
                          src={media.url}
                          alt="Ad preview"
                          width={300}
                          height={300}
                          className="w-60 h-60 rounded-sm"
                        />
                      ) : (
                        <video
                          key={index}
                          src={media.url}
                          className="w-60 h-60 rounded-sm"
                          controls={false}
                          loop
                          autoPlay
                        />
                      )}
                    </>
                  ))}
                </>
              ) : (
                <div className="text-gray-400">No media selected</div>
              )}
              <Button
                type="button"
                variant="default"
                size="sm"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace Media
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*, video/*"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="title">Title</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The title and text is shared among all the media</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="text">Text</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the main content of your ad</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="text"
                value={formData.text}
                onChange={e =>
                  setFormData({ ...formData, text: e.target.value })
                }
                placeholder="Enter text"
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Preview</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
