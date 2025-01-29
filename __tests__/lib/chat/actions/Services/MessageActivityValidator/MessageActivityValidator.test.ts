import { describe, it, expect, vi } from 'vitest'
import { Message, Session } from '@/lib/types'
import { sendAdminNotification } from '@/lib/api/fasty-bot/send-admin-notification'
import MessageActivityValidator from "@/lib/chat/actions/Services/MessageActivityValidator/MessageActivityValidator";

vi.mock('@/lib/api/fasty-bot/send-admin-notification')

describe('MessageActivityValidator - Ignored Users', () => {
    const CHAT_ID = 'test-chat-123'

    interface IgnoredUserTestCase {
        email: string
        description: string
    }

    const ignoredUserCases: IgnoredUserTestCase[] = [
        {
            email: 'teo.kostelac@outlook.com',
            description: 'should ignore team lead email'
        },
        {
            email: 'contact@reeply.net',
            description: 'should ignore contact email'
        },
        {
            email: 'themadnoise@gmail.com',
            description: 'should ignore developer email'
        }
    ]

    it.each(ignoredUserCases)('$description', async ({ email }) => {
        // Arrange
        const validator = new MessageActivityValidator()
        const session = createTestSession(email)
        const messages: Message[] = []

        // Act
        const result = await validator.informAdminIfThisIsNewActivity(CHAT_ID, messages, session)

        // Assert
        expect(result).toBe(false)
        expect(sendAdminNotification).not.toHaveBeenCalled()
    })
})

function createTestSession(email: string): Session {
    return {
        user: {
            email
        }
    } as Session
}