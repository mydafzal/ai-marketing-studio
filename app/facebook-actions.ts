'use server'

import { decryptToken } from '@/app/cryptoUtils'

// Todo: this logic needs to be moved to the backend!
const FACEBOOK_API_URL = 'https://graph.facebook.com/v19.0/'

export async function getFacebookBusinessAccounts(
  encryptedAccessToken: string
) {
  const token = await decryptToken(encryptedAccessToken)
  const url = `${FACEBOOK_API_URL}/me/businesses?access_token=${token}`
  return await fetchAllPaginatedPages(url)
}

export async function getFacebookAdAccounts(
  encryptedAccessToken: string,
  business_acc_id: string
) {
  const token = await decryptToken(encryptedAccessToken)

  const resp = await fetch(
    `${FACEBOOK_API_URL}/${business_acc_id}/owned_ad_accounts?access_token=${token}&fields=id,name`,
    {
      method: 'GET'
    }
  )
  const data = await resp.json()

  if (data.error) {
    throw Error(data.error.message)
  }

  return data.data
}

async function fetchAllPaginatedPages(initialUrl: string): Promise<any[]> {
  let url: string | null = initialUrl
  const allData: any[] = []

  while (url) {
    const resp = await fetch(url, { method: 'GET' })
    const data = await resp.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    if (Array.isArray(data.data)) {
      allData.push(...data.data)
    }

    const after: any = data.paging?.cursors?.after
    url = after
      ? `${initialUrl.split('?')[0]}?access_token=${new URL(url).searchParams.get('access_token') || ''}&after=${after}`
      : null
  }

  return allData
}