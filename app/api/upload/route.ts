import { S3Client, S3ClientConfig, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const s3Config: S3ClientConfig = {
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  }
}

export const config = {
  api: {
    bodyParser: false // Disable the built-in body parser to handle file uploads manually
  }
}

const s3Client = new S3Client(s3Config)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const id = formData.get('id');
    const files = formData.getAll('files')
    const fileUploadPromises = Object.values(files).map(async file => {
      const currentFile = Array.isArray(file) ? file[0] : file
      const buffer = Buffer.from(await currentFile.arrayBuffer())
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET as string,
        Key: `public/${id}/${Date.now()}_${currentFile?.name || ''}`,
        Body: buffer,
        ContentType: currentFile.type as string
      }

      const command = new PutObjectCommand(uploadParams)
      await s3Client.send(command)
      return `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${uploadParams.Key}`
    })

    const urls = await Promise.all(fileUploadPromises)
    return NextResponse.json({ urls }, { status: 200 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error uploading files' },
      { status: 500 }
    )
  }
}
