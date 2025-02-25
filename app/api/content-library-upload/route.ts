import { NextResponse } from "next/server"
import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand
} from "@aws-sdk/client-s3"
import { sanitizeFileNameForUrl } from "@/lib/utils"

const s3Client = new S3Client({
  region: "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  }
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const userId = formData.get("userId")?.toString() || "unknown-user"
    const type = formData.get("type")?.toString() || "image"
    const files = formData.getAll("files")

    const uploadPromises = files.map(async (file) => {
      const currentFile = Array.isArray(file) ? file[0] : file
      const arrayBuffer = await currentFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const safeName = sanitizeFileNameForUrl(currentFile.name)
      const key = `public/${userId}/${type}/${Date.now()}_${safeName}`

      const uploadParams = {
        Bucket: "aicontentlibrary",
        Key: key,
        Body: buffer,
        ContentType: currentFile.type,
        CacheControl: 'max-age=31536000',
      }

      const command = new PutObjectCommand(uploadParams)
      await s3Client.send(command)

      // Return the regional URL format
      return `https://aicontentlibrary.s3.eu-central-1.amazonaws.com/${key}`
    })

    const urls = await Promise.all(uploadPromises)
    return NextResponse.json({ urls }, { status: 200 })
  } catch (error) {
    console.error("Error uploading to content library:", error)
    return NextResponse.json(
      { error: "Failed to upload content" },
      { status: 500 }
    )
  }
}