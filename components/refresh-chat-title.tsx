'use client'
import { useEffect } from 'react'

export const RefreshChatTitle = () => {
    useEffect(() => {
        window.dispatchEvent(new CustomEvent("update-chat-title"))
    }, [])

    return <></>
}