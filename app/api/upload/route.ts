import { S3Client, S3ClientConfig, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'
import { sanitizeFileNameForUrl } from '@/lib/utils'

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
    // Validate if S3 credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || 
        !process.env.AWS_DEFAULT_REGION || !process.env.AWS_BUCKET) {
      console.error('Missing S3 configuration environment variables');
      return NextResponse.json(
        { error: 'S3 is not properly configured. Check environment variables.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const id = formData.get('id');
    const type = formData.get('type');

    // Validate required parameters
    if (!id) {
      console.error('Missing required parameter: id');
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const files = formData.getAll('files');
    if (!files || files.length === 0) {
      console.error('No files provided for upload');
      return NextResponse.json(
        { error: 'No files provided for upload' },
        { status: 400 }
      );
    }

    const fileUploadPromises = Object.values(files).map(async file => {
      const currentFile = Array.isArray(file) ? file[0] : file;
      if (!currentFile) {
        throw new Error('Invalid file object received');
      }

      const buffer = Buffer.from(await currentFile.arrayBuffer());
      const timestamp = Date.now();
      const safeName = sanitizeFileNameForUrl(currentFile?.name) || timestamp.toString();
      
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET as string,
        Key: `public/${id}/${type || 'image'}/${timestamp}_${safeName}`,
        Body: buffer,
        ContentType: currentFile.type as string
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      
      const fileUrl = `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${uploadParams.Key}`;
      
      return fileUrl;
    });

    const urls = await Promise.all(fileUploadPromises);
    
    return NextResponse.json({ urls }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    // Provide more specific error message when possible
    const errorMessage = error instanceof Error 
      ? `Error uploading files: ${error.message}` 
      : 'Unknown error uploading files';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
