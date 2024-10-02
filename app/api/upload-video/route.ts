import { NextResponse } from 'next/server'
import { getUserDetail } from '@/app/actions'

export async function POST(request: Request) {
  try {

    const userDetail = await getUserDetail();

    const formData = await request.formData();
    const videoFile = formData.get('file'); // The video file
    const fbAccountId = userDetail?.user?.fbAccountId || '0'; // Facebook Account ID
    if(!videoFile || !fbAccountId) return;
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/upload/video`
    const fbFormData = new FormData();

    fbFormData.append('file', videoFile);
    fbFormData.append('fbAccountId', fbAccountId);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
      },
      body: fbFormData,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Error create campaign:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      })
      return NextResponse.json({ success: false }, { status: response.status })
    }
    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error create campaign:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
