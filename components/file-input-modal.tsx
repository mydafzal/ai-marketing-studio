import React, { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter
} from './ui/dialog'
import { AlertTriangle, ImagePlus, Info, X } from 'lucide-react'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { useToast } from './ui/use-toast'
import {
  validateFileDimensions,
  filterInvalidFiles
} from '@/lib/helpers/file-dimensions/validate-file-dimensions'
import { CampaignCreationFormData, FileInfo } from '@/lib/types'
import { Button } from './ui/button'
import { Control, useController } from 'react-hook-form'
import { Badge } from './ui/badge'

interface FileInputModalProps {
  trigger: React.ReactNode
  control: Control<CampaignCreationFormData>
  name: keyof CampaignCreationFormData
  openModal?: boolean
  setOpenModal?: React.Dispatch<React.SetStateAction<boolean>>
}

function FileInputModal({
  trigger,
  control,
  name,
  openModal,
  setOpenModal
}: FileInputModalProps) {
  const [fileEnter, setFileEnter] = useState(false)
  const [files, setFiles] = useState<FileInfo[]>([])
  const { toast } = useToast()
  const {
    field,
    fieldState: { error }
  } = useController({ name, control })

  const handleAddFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const invalidFiles = filterInvalidFiles(fileArray)

    if (invalidFiles.length > 0) {
      toast({
        title: 'Error',
        description: 'Only images and videos are allowed',
        variant: 'destructive'
      })
      return
    }

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

    if (validFiles.length + files.length > 5) {
      toast({
        title: 'Error',
        description: "You can't upload more than 5 files",
        variant: 'destructive'
      })
      return
    }

    setFiles(prevFiles => {
      const updatedFiles: FileInfo[] = [...prevFiles, ...validFiles]
      field.onChange(updatedFiles)
      return updatedFiles
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleAddFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setFileEnter(false)
    if (e.dataTransfer.items) {
      const validFiles = Array.from(e.dataTransfer.items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null)
      handleAddFiles(validFiles)
    } else {
      handleAddFiles(e.dataTransfer.files)
    }
  }

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger className="w-full">{trigger}</DialogTrigger>
      <DialogContent className="dark:bg-[#19191C] md:min-w-[550px]">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription className="bg-foreground/10 px-3 py-2 rounded-md flex items-center">
            <Info size={17} className="text-foreground" />
            <p className="text-sm text-foreground ml-2">
              <strong>1:1</strong> is used for for posts and{' '}
              <strong>9:16</strong> is used for reels and story.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={e => {
            e.preventDefault()
            setFileEnter(true)
          }}
          onDragLeave={() => setFileEnter(false)}
          onDrop={handleDrop}
          className={`${
            fileEnter ? 'border-4' : 'border-2'
          } mx-auto rounded-xl flex-col w-full py-4 px-2 border-dashed items-center justify-center`}
        >
          <Label
            htmlFor={name}
            className="h-full items-center flex flex-col justify-center text-center"
          >
            <ImagePlus size={36} />
            <h2 className="font-medium text-xl mt-1">Upload Media</h2>
            <span className="text-sm text-foreground mt-3">
              Upload up to 5 Images or Videos of the following resolutions
            </span>
            <span className="text-foreground/70 text-xs mt-1">1:1 or 9:16</span>
          </Label>
          <Input
            id={name}
            type="file"
            name={name}
            accept="image/*, video/*"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
        </div>

        {files.length > 0 && (
          <div
            className={`${
              files.every(
                file =>
                  file.dimensions === '1:1' && file.type.startsWith('video/')
              )
                ? 'max-h-[12vh]'
                : 'max-h-[20vh]'
            } overflow-y-auto scrollbar-style space-y-2 bg-foreground/10 rounded-md p-3`}
          >
            {files.map((file, index) => (
              <>
                <div key={index} className="relative flex justify-between">
                  <div className="flex items-center">
                    <p className="text-md">
                      {file.type.startsWith('image/') ? 'IMG' : 'Video'} -{' '}
                      {file.dimensions}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const updatedFiles = files.filter(
                        (_, i: number) => i !== index
                      )
                      setFiles(updatedFiles)
                      field.onChange(updatedFiles)
                    }}
                    className="text-black rounded-full p-2 flex items-center justify-center"
                  >
                    <X className="text-foreground" />
                  </button>
                </div>
                {index !== files.length - 1 && (
                  <hr className="bg-foreground/70 h-px" />
                )}
              </>
            ))}
          </div>
        )}

        {files.length > 0 &&
          files.every(
            file => file.dimensions === '1:1' && file.type.startsWith('video/')
          ) && (
            <>
              <h3 className="text-sm text-foreground font-semibold">
                Can be used as:
              </h3>
              <div className="flex flex-wrap gap-y-2 ">
                {[
                  'Facebook Post',
                  'Facebook Story',
                  'Facebook Reels',
                  'Instagram Post',
                  'Instagram Story',
                  'Instagram Reels',
                  'Instagram Explore',
                  'Instagram Explore: Home'
                ].map((badge, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="mr-2 bg-foreground/10 text-foreground hover:bg-none font-medium text-sm"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </>
          )}

        {files.length > 0 && files.every(file => file.dimensions === '1:1') && (
          <div className="bg-foreground/10 px-3 py-2 rounded-md flex items-start">
            <AlertTriangle size={30} className="text-foreground h-5" />
            <p className="text-sm text-foreground ml-2">
              If you have media with a 9:16 aspect ratio, you can upload those
              as well to ensure your advertisement looks great on stories and
              reels.
            </p>
          </div>
        )}

        <DialogFooter className="w-full">
          <Button
            variant="outline"
            className="w-full rounded-sm bg-transparent border-foreground/30"
            onClick={() => {
              setFiles([])
              field.onChange([])
              setOpenModal?.(false)
            }}
          >
            Cancel
          </Button>
          <Button className="w-full rounded-sm">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FileInputModal
