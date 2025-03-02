"use server"

import { getUserDetail } from '@/app/actions'
import { FbVideo } from '@/lib/types'
import { getFbMarketingApiKey } from '@/app/actions';

export async function getVideoDetail(video_id: string) {
  const fastyEndpoint = process.env.FASTY_API_URL;
  const apiUrl = `${fastyEndpoint}/facebook/exec/direct/upload/video-detail?video_id=${video_id}`
  
  const token_resp = await getFbMarketingApiKey()
  let token=""
  if(token_resp.success && token_resp.token){
      token=token_resp.token
  }

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
      'fb-api-key': token
    }
  })

  if (!response.ok) {
    console.error(`HTTP error! status: ${response.status}`)
    throw new Error('Failed to fetch video detail')
  }

  return response.json()
}
