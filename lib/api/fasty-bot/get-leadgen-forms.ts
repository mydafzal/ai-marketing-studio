import { NextResponse } from 'next/server'


export async function getLeadgenForms(request: Request): Promise<any> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL

    const params = request.url.split('?')[1] || ''

    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/lead/get-leadgen-forms?${params}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
      }
    })

    return response
  } catch (error) {
    console.error('Error get leadgen forms:', error)
    return false
  }
}
