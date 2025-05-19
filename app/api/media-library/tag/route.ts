import { NextResponse } from "next/server"
import { auth } from "@/auth"

// In-memory tag storage - in production, use a database
let mediaTagsMap: Record<string, string[]> = {}

export async function POST(req: Request) {
  try {
    // Get user from session
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Parse request body
    const { mediaId, tag } = await req.json()
    
    if (!mediaId || !tag) {
      return NextResponse.json({ error: "mediaId and tag are required" }, { status: 400 })
    }

    // Add tag to media (in-memory for now)
    if (!mediaTagsMap[mediaId]) {
      mediaTagsMap[mediaId] = []
    }
    
    // Don't add duplicate tags
    if (!mediaTagsMap[mediaId].includes(tag)) {
      mediaTagsMap[mediaId].push(tag)
    }

    return NextResponse.json({ 
      success: true,
      tags: mediaTagsMap[mediaId]
    }, { status: 200 })
  } catch (error) {
    console.error("Error adding tag:", error)
    return NextResponse.json(
      { error: "Failed to add tag" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    // Get user from session
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Parse request body
    const { mediaId, tag } = await req.json()
    
    if (!mediaId || !tag) {
      return NextResponse.json({ error: "mediaId and tag are required" }, { status: 400 })
    }

    // Remove tag from media
    if (mediaTagsMap[mediaId]) {
      mediaTagsMap[mediaId] = mediaTagsMap[mediaId].filter(t => t !== tag)
    }

    return NextResponse.json({ 
      success: true,
      tags: mediaTagsMap[mediaId] || []
    }, { status: 200 })
  } catch (error) {
    console.error("Error removing tag:", error)
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    )
  }
}