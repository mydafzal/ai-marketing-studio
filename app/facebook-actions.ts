'use server'

import {decryptToken} from '@/app/cryptoUtils';

const FACEBOOK_API_URL = 'https://graph.facebook.com/v19.0/';

export async function getFacebookBusinessAccounts(encryptedAccessToken:string) {

    const token = await decryptToken(encryptedAccessToken)

    const resp = await fetch(`${FACEBOOK_API_URL}/me/businesses?access_token=${token}`, {
        method: 'GET',
      });
      const data = await resp.json();
    
      if (data.error) {
        throw Error(data.error.message)
      }

      return data.data
}

export async function getFacebookAdAccounts(encryptedAccessToken:string, business_acc_id:string) {

    const token = await decryptToken(encryptedAccessToken)

    const resp = await fetch(`${FACEBOOK_API_URL}/${business_acc_id}/owned_ad_accounts?access_token=${token}`, {
        method: 'GET',
      });
      const data = await resp.json();
    
      if (data.error) {
        throw Error(data.error.message)
      }

      return data.data
}