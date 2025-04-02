'use client'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  User as UserIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DialogeProps {
  open: boolean
  handleModalCancel: () => void
  handleModalOk: () => void
}

const CancelSubscriptionDialog = ({
  open,
  handleModalCancel,
  handleModalOk
}: DialogeProps) => {
  return (
    <>
      <AlertDialog.Root open={open} onOpenChange={() => {}}>
        {/* <AlertDialog.Trigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <UserIcon className="size-4" />
            Subscription
          </Button>
        </AlertDialog.Trigger> */}
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            className={cn(
              'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
            )}
          />
          <AlertDialog.Content
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[85vh] -translate-x-1/2 -translate-y-1/2',
              'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800',
              'p-6 shadow-lg overflow-y-auto',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
              'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
            )}
          >
            <AlertDialog.Title className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white text-center mb-6">
              Are you absolutely sure?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
              This action cannot be undone. This will permanently clear
              subscription on your account.
            </AlertDialog.Description>
            <AlertDialog.Cancel asChild>
              <button
                onClick={() => {
                  handleModalCancel()
                }}
                className="h-10 w-24  bg-purple-100 hover:bg-purple-500 hover:text-white text-purple-600 rounded-md shadow-md transition-transform hover:scale-105 active:scale-100 focus:outline-none"
              >
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={() => {
                  handleModalOk()
                  window.location.reload()
                }}
                className="h-10 ml-4 w-24 bg-purple-600 hover:bg-purple-500 text-white rounded-md shadow-md transition-transform hover:scale-105 active:scale-100 focus:outline-none"
              >
                Ok
              </button>
            </AlertDialog.Action>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}

export default CancelSubscriptionDialog
