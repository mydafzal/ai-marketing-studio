import { NextResponse } from "next/server"
import { S3Client, S3ClientConfig, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { auth } from "@/auth"

// Configure S3 client
const s3Config: S3ClientConfig = {
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  }
}

const s3Client = new S3Client(s3Config)

// Sample tags data structure - in production, this would be in a database
let mediaTagsMap: Record<string, string[]> = {}

export async function GET() {
  try {
    console.log("Media library API called")
    
    // Get user from session
    const session = await auth()
    if (!session?.user) {
      console.log("No authenticated user found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id
    console.log("Fetching media for user:", userId)

    // List objects in the user's folder in S3
    const params = {
      Bucket: process.env.AWS_BUCKET as string,
      Prefix: `public/${userId}/`, // Only get the current user's files
    }

    console.log("S3 params:", params)
    const command = new ListObjectsV2Command(params)
    const response = await s3Client.send(command)
    console.log(`Found ${response.Contents?.length || 0} objects in S3`)

    const media = (response.Contents || [])
      .filter(item => item.Key && !item.Key.endsWith('/')) // Skip folders
      .map(item => {
        const key = item.Key as string
        const parts = key.split('/')
        const fileName = parts[parts.length - 1]
        const timestamp = fileName.split('_')[0]
        const name = fileName.split('_').slice(1).join('_')
        
        // Determine type from key
        let type = 'image'
        if (key.includes('/video/')) {
          type = 'video'
        }

        // Create a unique ID from the key
        const id = Buffer.from(key).toString('base64')

        return {
          id,
          url: `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${key}`,
          type,
          name,
          createdAt: item.LastModified ? item.LastModified.toISOString() : new Date(parseInt(timestamp)).toISOString(),
          tags: mediaTagsMap[id] || [] // Get tags for this media
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by date, newest first

    console.log(`Returning ${media.length} media items`)
    return NextResponse.json({ media }, { status: 200 })
  } catch (error) {
    console.error("Error fetching media library:", error)
    return NextResponse.json(
      { error: "Could not fetch media library", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}