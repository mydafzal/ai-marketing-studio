'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n/context'

import { ServerActionResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { IconSpinner } from '@/components/ui/icons'

interface ClearHistoryProps {
  isEnabled: boolean
  clearChats: () => ServerActionResult<void>
}

export function ClearHistory({
  isEnabled = false,
  clearChats
}: ClearHistoryProps) {
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()
  const t = useT()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          disabled={!isEnabled || isPending}
          className="text-[#8A8F99] hover:text-white hover:bg-[#212534] transition-colors"
        >
          {isPending && <IconSpinner className="mr-2" />}
          {t('sidebar.clearHistory')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[#1A1D29] border border-[#2A2E3A] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {t('dialogs.clearHistory.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#ADB0B8]">
            {t('dialogs.clearHistory.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="bg-[#151925] text-white border-[#2A2E3A] hover:bg-[#212534] hover:text-white">
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              startTransition(async () => {
                const result = await clearChats()

                if (result && 'error' in result) {
                  toast.error(result.error)
                  return
                }

                setOpen(false)
                router.push('/')
              })
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isPending && <IconSpinner className="mr-2" />}
            {t('actions.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
