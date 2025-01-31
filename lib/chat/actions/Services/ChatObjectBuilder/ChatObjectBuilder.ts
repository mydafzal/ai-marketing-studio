import {Chat, Message} from "@/lib/types";
import {TextPart} from 'ai'

export type AIState = {
    chatId: string
    title: string
    messages: Message[]
}

export type UIState = {
    id: string
    display: React.ReactNode
}[]

/**
 * Builds a Chat object from the user ID and the AI state.
 * Encapsulates the logic for constructing all necessary fields.
 */
export function buildChatObject(userId: string, { chatId, title, messages }: AIState): Chat {
    const createdAt = new Date()
    const path = `/chat/${chatId}`
    const firstMessageContent = getFirstMessageContent(messages)
    const defaultTitle = firstMessageContent.substring(0, 100)

    return {
        id: chatId,
        title: title || defaultTitle,
        userId,
        createdAt,
        messages,
        path,
    }
}

/**
 * Safely extracts the text content from the first message in a list of messages.
 * Returns an empty string if no messages exist or if the content is missing.
 */
export function getFirstMessageContent(messages: Message[]): string {
    if (messages.length === 0) return ''

    const [firstMessage] = messages
    const content = firstMessage.content

    return Array.isArray(content)
        ? (content[0] as TextPart).text
        : (content as string)
}