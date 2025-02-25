import { FileInfo } from '@/lib/types'

export const validateFileDimensions = (
  file: File
): Promise<FileInfo | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => {
      const url = event.target?.result as string
      if (file.type.startsWith('image/')) {
        const img = new Image()
        img.onload = () => {
          if (
            (img.width === 1080 && img.height === 1080) ||
            (img.width === 1080 && img.height === 1920)
          ) {
            resolve({
              file,
              type: file.type,
              url,
              name: file.name,
              dimensions:
                img.width === 1080 && img.height === 1080 ? '1:1' : '9:16',
              size: file.size
            })
          } else {
            resolve(null)
          }
        }
        img.src = url
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.onloadedmetadata = () => {
          if (
            (video.videoWidth === 1080 && video.videoHeight === 1080) ||
            (video.videoWidth === 1080 && video.videoHeight === 1920)
          ) {
            resolve({
              file,
              type: file.type,
              url,
              name: file.name,
              dimensions:
                video.videoWidth === 1080 && video.videoHeight === 1080
                  ? '1:1'
                  : '9:16',
              size: file.size
            })
          } else {
            resolve(null)
          }
        }
        video.src = url
      } else {
        resolve(null)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const filterInvalidFiles = (files: File[]): File[] => {
  return files.filter(
    file => !file.type.startsWith('image/') && !file.type.startsWith('video/')
  )
}
