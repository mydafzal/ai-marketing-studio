// app/content-folder/page.tsx

"use client"

import React, { useEffect, useState, FormEvent, ChangeEvent } from "react"
import NextImage from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// Define the shape of each saved asset
type SavedAsset = {
  url: string
  type: "image" | "video"
  // Add other fields like createdAt, name, etc. if desired
}

export default function ContentFolderPage() {
  const { toast } = useToast()

  // State for storing the user’s assets (images & videos)
  const [assets, setAssets] = useState<SavedAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // -------- NEW: State for uploading files --------
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadType, setUploadType] = useState<"image" | "video">("image")

  // -------- 1) Fetch the user's existing content --------
  async function fetchContent() {
    try {
      setIsLoading(true)
      setError(null)

      // Example: fetch from some custom endpoint that returns
      // all assets for the current user. Adjust path as needed.
      const res = await fetch("/api/user-content", {
        method: "GET",
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch user content: ${res.statusText}`)
      }

      const data = await res.json()
      // Expecting something like { assets: [{ url, type, ... }, ...] }
      setAssets(data.assets || [])
    } catch (err: any) {
      console.error("Error fetching content:", err)
      setError(err.message || "Could not load your saved content.")
      toast({
        title: "Error",
        description: "Could not load your saved content.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // -------- 2) Call fetchContent on mount --------
  useEffect(() => {
    fetchContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------- File Input Change Handler --------
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setSelectedFiles(Array.from(e.target.files))
  }

  // -------- 3) Upload to the new /api/content-library-upload route --------
  async function handleUpload(e: FormEvent) {
    e.preventDefault()

    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please pick at least one file before uploading.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const formData = new FormData()
      // For demonstration, pass a "userId" and "type"
      // In a real app, you'd get userId from session or database.
      formData.append("userId", "123") // or your real user id
      formData.append("type", uploadType)

      // Append the selected files
      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })

      const res = await fetch("/api/content-library-upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`)
      }

      const data = await res.json()
      console.log("Uploaded URLs =>", data.urls)

      toast({
        title: "Success",
        description: "Files uploaded successfully!",
      })

      // Clear selected files
      setSelectedFiles([])

      // Re-fetch the content library so we see the new uploads
      fetchContent()
    } catch (err: any) {
      console.error("Error uploading files:", err)
      setError(err.message || "Failed to upload.")
      toast({
        title: "Error",
        description: err.message || "Failed to upload files.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Saved Content</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload and manage your images or videos
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* -------- Upload Form -------- */}
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Select Files</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="block"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Upload Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as "image" | "video")}
                className="border p-1 rounded"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Uploading..." : "Upload to Library"}
            </Button>
          </form>

          {/* -------- Show library content -------- */}
          {isLoading && !error && <p className="text-muted-foreground">Loading...</p>}
          {error && (
            <p className="text-red-500">
              {error}
            </p>
          )}
          {!isLoading && !error && assets.length === 0 && (
            <p className="text-gray-500">No content saved yet.</p>
          )}

          {assets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((item, idx) => (
                <div
                  key={`${item.url}-${idx}`}
                  className="relative border rounded-md overflow-hidden"
                >
                  {item.type === "image" ? (
                    <div className="w-full aspect-square relative">
                      <NextImage
                        src={item.url}
                        alt={`Saved asset ${idx}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="object-cover"
                      />
                    </div>
                  ) : item.type === "video" ? (
                    <video
                      controls
                      className="w-full h-auto"
                      poster="/video-placeholder.png" // optional placeholder
                    >
                      <source src={item.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <p className="text-sm p-4">Unknown file type</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
