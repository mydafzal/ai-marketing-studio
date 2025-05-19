"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from "@/components/ui/use-toast"

// Media type definitions
interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video'
  name: string
  createdAt: string
  tags: string[]
}

export default function MediaLibraryPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all_types')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [newTag, setNewTag] = useState('')
  const [uploading, setUploading] = useState(false)

  // Fetch media items
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/media-library')
        const data = await response.json()
        setMediaItems(data.media || [])
        
        // Extract all unique tags
        const tags = Array.from(new Set((data.media || []).flatMap((item: MediaItem) => item.tags || [])))
        setAllTags(tags as string[])
      } catch (error) {
        console.error('Error fetching media:', error)
        toast({
          title: "Error",
          description: "Failed to load media library",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [toast])

  // Handle file uploads
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    const formData = new FormData()
    
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      // After upload, refresh the media library
      router.refresh()
      
      toast({
        title: "Success",
        description: `${files.length} files uploaded successfully`,
      })
      
      // Refresh the page to show new uploads
      window.location.reload()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Add tag to media item
  const addTag = async (mediaId: string, tag: string) => {
    if (!tag.trim()) return
    
    try {
      const response = await fetch('/api/media-library/tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mediaId, tag })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add tag')
      }
      
      // Update local state
      setMediaItems(prevItems => 
        prevItems.map(item => 
          item.id === mediaId 
            ? { ...item, tags: [...item.tags, tag] } 
            : item
        )
      )
      
      // Add to all tags if it's new
      if (!allTags.includes(tag)) {
        setAllTags(prev => [...prev, tag])
      }
      
      setNewTag('')
    } catch (error) {
      console.error('Error adding tag:', error)
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive"
      })
    }
  }

  // Remove tag from media item
  const removeTag = async (mediaId: string, tagToRemove: string) => {
    try {
      const response = await fetch('/api/media-library/tag', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mediaId, tag: tagToRemove })
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove tag')
      }
      
      // Update local state
      setMediaItems(prevItems => 
        prevItems.map(item => 
          item.id === mediaId 
            ? { ...item, tags: item.tags.filter(tag => tag !== tagToRemove) } 
            : item
        )
      )
    } catch (error) {
      console.error('Error removing tag:', error)
      toast({
        title: "Error",
        description: "Failed to remove tag",
        variant: "destructive"
      })
    }
  }

  // Filter media items
  const filteredMedia = (mediaItems || []).filter(item => {
    // Filter by type
    if (filter !== 'all_types' && item.type !== filter) return false
    
    // Filter by search term
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0 && !selectedTags.some(tag => item.tags.includes(tag))) {
      return false
    }
    
    return true
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Media Library</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
            className="bg-primary-green hover:bg-primary-green/90 text-black"
          >
            {uploading ? 'Uploading...' : 'Upload Media'}
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={selectedTags.length === 1 ? selectedTags[0] : 'all_tags'} 
          onValueChange={(value) => setSelectedTags(value === 'all_tags' ? [] : [value])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_tags">All Tags</SelectItem>
            {allTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-green"></div>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No media found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {mediaItems.length === 0 
              ? "Your media library is empty. Upload some files to get started!" 
              : "No results match your current filters."}
          </p>
          {mediaItems.length > 0 && (
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setFilter('all_types')
              setSelectedTags([])
            }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedia.map(item => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {item.type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <video 
                    src={item.url}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => setSelectedMedia(item)}
                  >
                    View
                  </Button>
                </div>
              </div>
              
              <div className="p-3">
                <div className="truncate text-sm font-medium mb-2">{item.name}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Media detail dialog */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedMedia.name}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                {selectedMedia.type === 'image' ? (
                  <img 
                    src={selectedMedia.url} 
                    alt={selectedMedia.name}
                    className="w-full h-auto"
                  />
                ) : (
                  <video 
                    src={selectedMedia.url}
                    className="w-full h-auto"
                    controls
                  />
                )}
              </div>
              
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Information</h3>
                  <p className="text-sm text-gray-500 mb-1">Type: {selectedMedia.type}</p>
                  <p className="text-sm text-gray-500 mb-1">Added: {new Date(selectedMedia.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500 mb-1">
                    URL: <a href={selectedMedia.url} target="_blank" rel="noopener noreferrer" className="underline">View original</a>
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {selectedMedia.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <button 
                          onClick={() => removeTag(selectedMedia.id, tag)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(selectedMedia.id, newTag)
                        }
                      }}
                    />
                    <Button 
                      size="sm"
                      onClick={() => addTag(selectedMedia.id, newTag)}
                      disabled={!newTag.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setSelectedMedia(null)}>
                    Close
                  </Button>
                  <Button 
                    variant="default"
                    className="bg-primary-green hover:bg-primary-green/90 text-black"
                    onClick={() => {
                      // Copy URL to clipboard
                      navigator.clipboard.writeText(selectedMedia.url)
                      toast({
                        title: "URL copied",
                        description: "Media URL copied to clipboard",
                      })
                    }}
                  >
                    Copy URL
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}