'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { toast } from 'sonner'
import { IconSpinner } from './ui/icons'
import { useRouter } from 'next/navigation'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className="mt-4 w-full rounded-md bg-[#4BF29C] px-4 py-2 text-sm font-medium text-black hover:bg-[#5cffad] disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <div className="flex items-center justify-center gap-1">
          <IconSpinner className="animate-spin" />
          Please wait...
        </div>
      ) : (
        'Continue'
      )}
    </button>
  )
}

export default function ResetPasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send reset code')
      }

      toast.success('Reset code sent to your email')
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code')
      toast.error(err instanceof Error ? err.message : 'Failed to send reset code')
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/reset-password/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid reset code')
      }

      setStep('password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid reset code')
      toast.error(err instanceof Error ? err.message : 'Invalid reset code')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const newPassword = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      toast.error('Passwords do not match')
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code, newPassword })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset password')
      }

      toast.success('Password reset successfully')
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      toast.error(err instanceof Error ? err.message : 'Failed to reset password')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 space-y-3">
      <div className="w-full flex-1 rounded-lg border bg-white px-6 pb-4 pt-8 shadow-md md:w-96 dark:bg-zinc-950">
        <h1 className="mb-3 text-2xl font-bold">Reset Password</h1>

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-zinc-400"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border bg-zinc-50 px-2 py-[9px] text-sm outline-none placeholder:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
                  id="email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>
            <SubmitButton />
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit}>
            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-zinc-400"
                htmlFor="code"
              >
                Reset Code
              </label>
              <p className="text-sm text-zinc-500 mb-4">
                We've sent a reset code to {email}
              </p>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border bg-zinc-50 px-2 py-[9px] text-sm outline-none placeholder:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
                  id="code"
                  type="text"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter reset code"
                  required
                />
              </div>
            </div>
            <SubmitButton />
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-zinc-400"
                htmlFor="password"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border bg-zinc-50 px-2 py-[9px] text-sm outline-none placeholder:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="mt-4">
              <label
                className="mb-3 mt-5 block text-xs font-medium text-zinc-400"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border bg-zinc-50 px-2 py-[9px] text-sm outline-none placeholder:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <SubmitButton />
          </form>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-500">{error}</div>
        )}
      </div>

      <Link href="/login" className="flex flex-row gap-1 text-sm text-zinc-400">
        Remember your password?
        <div className="font-semibold underline">Log in</div>
      </Link>
    </div>
  )
} 