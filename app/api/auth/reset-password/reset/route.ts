import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { z } from 'zod'
import { getUser } from '@/app/login/actions'
import { getStringFromBuffer } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const parsedBody = z
      .object({
        email: z.string().email(),
        code: z.string().length(6),
        newPassword: z.string().min(6)
      })
      .safeParse(body)

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, code, newPassword } = parsedBody.data
    
    // Verify the reset code
    const storedCode = await kv.get(`reset_code:${email}`) as string

    if (!storedCode || parseInt(code) !== parseInt(storedCode)) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      )
    }

    // Get user and update password
    const user = await getUser(email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash the new password with the existing salt
    const encoder = new TextEncoder()
    const saltedPassword = encoder.encode(newPassword + user.salt)
    const hashedPasswordBuffer = await crypto.subtle.digest(
      'SHA-256',
      saltedPassword
    )
    const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

    // Update the password in Redis
    await kv.hset(`user:${email}`, {
      password: hashedPassword
    })

    // Delete the reset code
    await kv.del(`reset_code:${email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
} 