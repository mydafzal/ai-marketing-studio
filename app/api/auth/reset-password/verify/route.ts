import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const parsedBody = z
      .object({
        email: z.string().email(),
        code: z.string().length(6)
      })
      .safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, code } = parsedBody.data
    
    // Get the stored reset code
    const storedCode = await kv.get(`reset_code:${email}`) as string

    if (!storedCode) {
      return NextResponse.json(
        { error: 'Reset code expired or not found' },
        { status: 400 }
      )
    }

    if (parseInt(code) !== parseInt(storedCode)) {
      return NextResponse.json(
        { error: 'Invalid reset code' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Code verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify reset code' },
      { status: 500 }
    )
  }
} 