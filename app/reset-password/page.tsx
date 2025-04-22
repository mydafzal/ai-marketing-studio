import { auth } from '@/auth'
import ResetPasswordForm from '@/components/reset-password-form'
import { Session } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function ResetPasswordPage() {
  const session = (await auth()) as Session

  if (session) {
    redirect('/')
  }

  return (
    <main className="flex flex-col p-4">
      <ResetPasswordForm />
    </main>
  )
} 