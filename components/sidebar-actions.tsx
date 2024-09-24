'use client'

import {useRouter} from 'next/navigation'
import * as React from 'react'
import {toast} from 'sonner'

import { TranslationContext } from '@/components/contexts/translation-context'
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
import {type Chat, ServerActionResult} from '@/lib/types'

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
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
    const [isRemovePending, startRemoveTransition] = React.useTransition()
    const { translate } = React.useContext(TranslationContext);

    return (
        <>
            <div className="">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className="size-7 p-0 hover:bg-background"
                            onClick={() => setShareDialogOpen(true)}
                        >
                            <IconShare/>
                            <span className="sr-only">{translate('Share')}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{translate('Share chat')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className="size-7 p-0 hover:bg-background"
                            disabled={isRemovePending}
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <IconTrash/>
                            <span className="sr-only">{translate('Delete')}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{translate('Delete chat')}</TooltipContent>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{translate('Are you absolutely sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {translate('This will permanently delete your chat message and remove your data from our servers.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRemovePending}>
                            {translate('Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isRemovePending}
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
                                    router.refresh()
                                    router.push('/')
                                    toast.success(translate('Chat deleted'))
                                })
                            }}
                        >
                            {isRemovePending && <IconSpinner className="mr-2 animate-spin"/>}
                            {translate('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
