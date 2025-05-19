import { S3Client, S3ClientConfig, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'
import { sanitizeFileNameForUrl } from '@/lib/utils'
import { auth } from '@/auth'

const s3Config: S3ClientConfig = {
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  }
}

const s3Client = new S3Client(s3Config)

export async function POST(req: Request) {
  try {
    // Get user session
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = session.user.id
    console.log('Authenticated user ID:', userId)

    const formData = await req.formData()
    const type = formData.get('type')
    
    const files = formData.getAll('files')
    console.log(`Uploading ${files.length} files`)
    
    if (!files.length) {
      return NextResponse.json({ error: 'No files found in request' }, { status: 400 })
    }

    const fileUploadPromises = Object.values(files).map(async file => {
      try {
        const currentFile = Array.isArray(file) ? file[0] : file
        console.log('Processing file:', currentFile.name, 'Type:', currentFile.type)
        
        // Determine content type from file
        const fileType = currentFile.type.startsWith('image') ? 'image' : 'video'
        
        const buffer = Buffer.from(await currentFile.arrayBuffer())
        const timestamp = Date.now()
        const sanitizedName = sanitizeFileNameForUrl(currentFile?.name) || 'unnamed-file'
        
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET as string,
          Key: `public/${userId}/${fileType}/${timestamp}_${sanitizedName}`,
          Body: buffer,
          ContentType: currentFile.type as string
        }

        console.log('Uploading to S3 path:', uploadParams.Key)
        const command = new PutObjectCommand(uploadParams)
        await s3Client.send(command)
        return `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${uploadParams.Key}`
      } catch (fileError) {
        console.error('Error uploading individual file:', fileError)
        throw fileError
      }
    })

    const urls = await Promise.all(fileUploadPromises)
    console.log('Upload successful, urls:', urls)
    return NextResponse.json({ urls }, { status: 200 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error uploading files' },
      { status: 500 }
    )
  }
}
