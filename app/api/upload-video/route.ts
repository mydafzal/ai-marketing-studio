import { NextResponse } from 'next/server'
import { getUserDetail } from '@/app/actions'

export async function POST(request: Request) {
  try {
    const userDetail = await getUserDetail()

    const formData = await request.formData()

    const fbAccountId = userDetail?.user?.fbAccountId || '0' // Facebook Account ID
    if (!fbAccountId) return

    const fastyEndpoint = process.env.FASTY_API_URL
    const fbFormData = new FormData()
    fbFormData.append('fb_account_id', fbAccountId)
    const file_size = formData.get('file_size')
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/upload/${file_size ? 'video-start' : 'video'}`

    if (file_size) {
      fbFormData.append('file_size', file_size)
    } else {
      const videoFile = formData.get('file') // The video file
      const start_offset = formData.get('start_offset')
      const finish = formData.get('finish')
      const upload_session_id = formData.get('upload_session_id')
      if (!videoFile || !upload_session_id) return
      fbFormData.append('file', videoFile)
      fbFormData.append('start_offset', start_offset || '0')
      fbFormData.append('finish', finish || '0')
      fbFormData.append('upload_session_id', upload_session_id)
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
      },
      body: fbFormData
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Error upload video:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      })
      return NextResponse.json({ success: false }, { status: response.status })
    }
    const data = await response.json()
    return NextResponse.json({ success: true, data: data })
  } catch (error) {
    console.error('Error upload video:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
