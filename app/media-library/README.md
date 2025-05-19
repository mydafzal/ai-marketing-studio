# Media Library

The Media Library is a centralized repository for managing user-generated content within the AI Marketing Manager application. It allows users to upload, organize, and reuse their media assets (images and videos) across different parts of the application.

## Features

- Upload multiple images and videos
- Tag media with custom labels
- Filter and search by name, type, or tags
- Copy media URLs for use in chats and campaigns
- View detailed information about each media item
- Responsive grid layout with thumbnail previews

## Technical Implementation

### Storage

Media assets are stored in AWS S3 using the following structure:
- Bucket: `AWS_BUCKET` (from environment variables)
- Path: `public/{userId}/{type}/{timestamp}_{filename}`

### API Endpoints

The Media Library uses the following API endpoints:

1. `/api/upload` - Uploads files to S3 (reusing existing implementation)
2. `/api/media-library` - Lists all media items for the current user
3. `/api/media-library/tag` - Adds or removes tags from media items

### Data Structure

Each media item contains:
- `id`: Unique identifier (base64 encoded S3 key)
- `url`: Full S3 URL to the media
- `type`: Either "image" or "video"
- `name`: Original filename
- `createdAt`: Upload timestamp
- `tags`: Array of user-defined tags

### Current Limitations

- Tag data is currently stored in-memory and will reset on server restart
- Future enhancement: Store tag data in a database
- No pagination implemented yet for large libraries
- Media cannot be deleted through the UI (only through S3 console)

## Usage

1. Navigate to Media Library from the main navigation
2. Upload media using the "Upload Media" button
3. View and filter your media collection
4. Add tags to organize your content
5. Copy media URLs to use in chats or other features