'use client'

import { createContext } from 'react'
import { Chat as ChatType } from '@/lib/types'

interface IKvContext {
    chat: ChatType | null
}

export const KvContext = createContext<IKvContext>({
    chat: null
})

export const KvContextProvider = ({
    chat,
    children
}: {
    chat: ChatType | null
    children: React.ReactNode
}) => {
    return (
        <KvContext.Provider value={{ chat }}>
            {children}
        </KvContext.Provider>
    )
}
