import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { z } from 'zod'
import { getUser } from '@/app/login/actions'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const parsedBody = z
      .object({
        email: z.string().email()
      })
      .safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email } = parsedBody.data
    const user = await getUser(email)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate a random 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store the reset code with 15 minutes expiration
    await kv.set(`reset_code:${email}`, resetCode, { ex: 900 })

    // Send email with reset code
    await sendEmail({
      to: email,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${resetCode}. This code will expire in 15 minutes.`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
} 