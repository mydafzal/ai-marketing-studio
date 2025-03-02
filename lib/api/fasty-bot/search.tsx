

import { builQueryString } from '@/lib/utils'

export async function getSearch(params: any): Promise<any> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL

    const queryString = builQueryString(params);

    const apiUrl = `${fastyEndpoint}/facebook/read/search${queryString}`
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
      }
    })
    return await response.json()
  } catch (error) {
    console.error('Error search:', error)
    return false
  }
}
