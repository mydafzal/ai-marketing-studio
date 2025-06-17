'use client'

import {useRouter} from 'next/navigation'
import * as React from 'react'
import {toast} from 'sonner'
import {useT} from '@/lib/i18n/context'

import {type Chat, ServerActionResult} from '@/lib/types'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {IconShare, IconSpinner, IconTrash} from '@/components/ui/icons'
import {ChatShareDialog} from '@/components/chat-share-dialog'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'

interface SidebarActionsProps {
    chat: Chat
    removeChat: (args: { id: string; path: string }) => ServerActionResult<void>
    shareChat: (id: string) => ServerActionResult<Chat>
}

export function SidebarActions({
                                   chat,
                                   removeChat,
                                   shareChat
                               }: SidebarActionsProps) {
    const router = useRouter()
    const t = useT()
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
    const [isRemovePending, startRemoveTransition] = React.useTransition()

    return (
        <>
            <div className="flex space-x-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className="size-7 p-0 bg-transparent hover:bg-[#212534] text-[#8A8F99] hover:text-white rounded-full"
                            onClick={() => setShareDialogOpen(true)}
                        >
                            <IconShare className="size-4"/>
                            <span className="sr-only">{t('actions.share')}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1A1D29] border border-[#2A2E3A] text-white">{t('sidebar.shareChat')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className="size-7 p-0 bg-transparent hover:bg-[#212534] text-[#8A8F99] hover:text-white rounded-full"
                            disabled={isRemovePending}
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <IconTrash className="size-4"/>
                            <span className="sr-only">{t('actions.delete')}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1A1D29] border border-[#2A2E3A] text-white">{t('sidebar.deleteChat')}</TooltipContent>
                </Tooltip>
            </div>
            <ChatShareDialog
                chat={chat}
                shareChat={shareChat}
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                onCopy={() => setShareDialogOpen(false)}
            />
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-[#1A1D29] border border-[#2A2E3A] text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">{t('dialogs.deleteConfirmation.title')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#ADB0B8]">
                            {t('dialogs.deleteConfirmation.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRemovePending} className="bg-[#151925] text-white border-[#2A2E3A] hover:bg-[#212534] hover:text-white">
                            {t('actions.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isRemovePending}
                            className="bg-[#4BF29C] text-[#0A0C14] hover:bg-[#5cffad]"
                            onClick={event => {
                                event.preventDefault()
                                // @ts-ignore
                                startRemoveTransition(async () => {
                                    const result = await removeChat({
                                        id: chat.id,
                                        path: chat.path
                                    })

                                    if (result && 'error' in result) {
                                        toast.error(result.error)
                                        return
                                    }

                                    setDeleteDialogOpen(false)
                                    toast.success(t('messages.chatDeleted'))
                                    
                                    // Force a complete page reload to ensure all server components get refreshed
                                    setTimeout(() => {
                                        window.location.href = '/'
                                    }, 300) // Short delay to allow toast to appear
                                })
                            }}
                        >
                            {isRemovePending && <IconSpinner className="mr-2 animate-spin"/>}
                            {t('dialogs.deleteConfirmation.confirmDelete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
