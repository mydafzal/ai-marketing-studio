'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {kv} from '@vercel/kv'

import {auth} from '@/auth'
import {AdText, type Chat, User} from '@/lib/types'

export async function getChats(userId?: string | null) {
    if (!userId) {
        return []
    }

    try {
        const pipeline = kv.pipeline()
        const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
            rev: true
        })

        for (const chat of chats) {
            pipeline.hgetall(chat)
        }

        const results = await pipeline.exec()

        return results as Chat[]
    } catch (error) {
        return []
    }
}

export async function getChat(id: string, userId: string) {
    const chat = await kv.hgetall<Chat>(`chat:${id}`)

    if (!chat || (userId && chat.userId !== userId)) {
        return null
    }

    return chat
}

export async function removeChat({id, path}: { id: string; path: string }) {
    const session = await auth()

    if (!session) {
        return {
            error: 'Unauthorized'
        }
    }

    //Convert uid to string for consistent comparison with session.user.id
    const uid = String(await kv.hget(`chat:${id}`, 'userId'))

    if (uid !== session?.user?.id) {
        return {
            error: 'Unauthorized'
        }
    }

    await kv.del(`chat:${id}`)
    await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

    revalidatePath('/')
    return revalidatePath(path)
}

export async function clearChats() {
    const session = await auth()

    if (!session?.user?.id) {
        return {
            error: 'Unauthorized'
        }
    }

    const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
    if (!chats.length) {
        return redirect('/')
    }
    const pipeline = kv.pipeline()

    for (const chat of chats) {
        pipeline.del(chat)
        pipeline.zrem(`user:chat:${session.user.id}`, chat)
    }

    await pipeline.exec()

    revalidatePath('/')
    return redirect('/')
}

export async function getSharedChat(id: string) {
    const chat = await kv.hgetall<Chat>(`chat:${id}`)

    if (!chat || !chat.sharePath) {
        return null
    }

    return chat
}

export async function shareChat(id: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return {
            error: 'Unauthorized'
        }
    }

    const chat = await kv.hgetall<Chat>(`chat:${id}`)

    if (!chat || chat.userId !== session.user.id) {
        return {
            error: 'Something went wrong'
        }
    }

    const payload = {
        ...chat,
        sharePath: `/share/${chat.id}`
    }

    await kv.hmset(`chat:${chat.id}`, payload)

    return payload
}

export async function saveChat(chat: Chat) {
    const session = await auth()

    if (session && session.user) {
        const pipeline = kv.pipeline()
        pipeline.hmset(`chat:${chat.id}`, chat)
        pipeline.zadd(`user:chat:${chat.userId}`, {
            score: Date.now(),
            member: `chat:${chat.id}`
        })
        await pipeline.exec()
    } else {
        return
    }
}

export async function refreshHistory(path: string) {
    redirect(path)
}

export async function getMissingKeys() {
    const keysRequired = ['OPENAI_API_KEY']
    return keysRequired
        .map(key => (process.env[key] ? '' : key))
        .filter(key => key !== '')
}

export async function updateFbCampaignExtraDetails(fbCampaignId: string, extraDetails: string) {
    const session = await auth();

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        };
    }

    try {
        // Define the fbCampaign key
        const fbCampaignKey = `fbCampaign:${fbCampaignId}`;

        // Get the existing fbCampaign data
        let existingFbCampaign = await kv.hgetall(fbCampaignKey);

        if (!existingFbCampaign) {
            // If it doesn't exist, create it with fbCampaignId
            existingFbCampaign = {fbCampaignId};
            await kv.hset(fbCampaignKey, existingFbCampaign);
        }

        // Update or add the extraDetails field
        await kv.hset(fbCampaignKey, {extraDetails});

        return {
            success: true
        };
    } catch (error) {
        console.error(`Error updating extraDetails for fbCampaign ${fbCampaignId}:`, error);
        return {
            error: 'Something went wrong'
        };
    }
}


export async function fetchFbCampaignExtraDetails(fbCampaignId: string) {
    const session = await auth();

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        };
    }

    try {
        const fbCampaignKey = `fbCampaign:${fbCampaignId}`;
        const fbCampaign = await kv.hgetall(fbCampaignKey);

        if (!fbCampaign) {
            return {
                error: 'fbCampaign not found'
            };
        }

        return {
            extraDetails: fbCampaign.extraDetails || null
        };
    } catch (error) {
        console.error(`Error fetching extraDetails for fbCampaign ${fbCampaignId}:`, error);
        return {
            error: 'Something went wrong'
        };
    }
}

type FetchExtraDetailsResult =
    | { success: true; extraDetails: string }
    | { success: false; error: string };

export async function fetchFbCampaignExtraDetailsForChat(campaignId: string): Promise<FetchExtraDetailsResult> {
    const session = await auth();

    if (!session || !session.user) {
        return {
            success: false,
            error: 'User not authenticated'
        };
    }

    try {
        const fbCampaignKey = `fbCampaign:${campaignId}`;
        const fbCampaignData = await kv.hgetall(fbCampaignKey);

        if (!fbCampaignData) {
            return {
                success: false,
                error: 'FB Campaign not found'
            };
        }

        const extraDetails = fbCampaignData.extraDetails;

        if (!extraDetails) {
            return {
                success: false,
                error: 'Extra details not found for this FB Campaign'
            };
        }

        return {
            success: true,
            extraDetails: extraDetails as string
        };
    } catch (error) {
        console.error(`Error fetching extraDetails for FB Campaign ${campaignId}:`, error);
        return {
            success: false,
            error: 'Something went wrong'
        };
    }
}


export async function fetchUserDefaultExtraDetailsForAdmin(userEmail: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    if (!userEmail) {
        return {
            error: 'Missing user email'
        }
    }

    try {
        const userKey = `user:${userEmail}`
        const defaultExtraDetails = await kv.hget(userKey, 'defaultExtraDetails')

        return defaultExtraDetails || ''

    } catch (error) {
        console.error(`Error fetching defaultExtraDetails for user: ${userEmail}`, error)
        return ''
    }
}

export async function updateUserDefaultExtraDetailsForAdmin(userEmail: string, promptString: string) {
    const session = await auth()
    if (!session || !session.user) {
        return { error: 'User not authenticated' }
    }

    if (!userEmail) {
        return { error: 'Missing user email' }
    }

    if (!promptString) {
        return { error: 'Missing prompt string' }
    }

    try {
        const userKey = `user:${userEmail}`
        await kv.hset(userKey, { defaultExtraDetails: promptString })
        return { success: true, message: 'Default extra details updated successfully' }
    } catch (error) {
        console.error(`Error updating defaultExtraDetails for user: ${userEmail}`, error)
        return { error: 'Failed to update default extra details' }
    }
}


export async function fetchUserDefaultExtraDetails() {
    const session = await auth()

    if (!session?.user?.email) {
        console.error('User not authenticated or email not available')
        return ''
    }

    try {
        const userKey = `user:${session.user.email}`
        const defaultExtraDetails = await kv.hget(userKey, 'defaultExtraDetails')

        return defaultExtraDetails || ''

    } catch (error) {
        console.error(`Error fetching defaultExtraDetails for user: ${session.user.email}`, error)
        return ''
    }
}

export async function fetchChatExtraDetails(chatId: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        const chatKey = `chat:${chatId}`
        const chatData = await kv.hgetall(chatKey)

        if (!chatData) {
            return {
                error: 'Chat not found'
            }
        }

        const extraDetails = chatData.extraDetails

        if (!extraDetails) {
            return {
                error: 'Extra details not found for this chat'
            }
        }

        return {
            success: true,
            extraDetails
        }
    } catch (error) {
        console.error(`Error fetching extraDetails for chat ${chatId}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

export async function searchUser(email: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            success: false,
            error: 'User not authenticated'
        }
    }

    if (email.trim() === '') {
        return {
            success: false,
            error: 'Email cannot be empty'
        }
    }

    try {
        const userKey = `user:${email}`
        const user = await kv.hgetall(userKey)

        if (!user || typeof user !== 'object' || !('email' in user)) {
            return {
                success: false,
                error: 'User not found'
            }
        }

        return {
            success: true,
            data: {
                email: user.email as string,
                fbAccountId: (user.fbAccountId as string) || null
            }
        }
    } catch (error) {
        console.error('Error searching user:', error)
        return {
            success: false,
            error: 'Something went wrong'
        }
    }
}

export async function fetchAllUsers() {
    console.log('fetchAllUsers function called');
    try {
        const session = await auth()
        console.log('Auth session:', session);

        if (!session || !session.user) {
            console.log('User not authenticated');
            return {
                success: false,
                error: 'User not authenticated'
            }
        }

        const keys = await kv.keys('user:*')
        console.log('KV keys found:', keys);

        const users: {
            email: string,
            fbAccountId: string | null
        }[] = []

        for (const key of keys) {
            try {
                const user = await kv.hgetall(key)
                console.log(`User data for key ${key}:`, user);
                if (user && typeof user === 'object' && 'email' in user) {
                    users.push({
                        email: user.email as string,
                        fbAccountId: (user.fbAccountId as string) || null
                    })
                } else {
                    console.warn(`Invalid user data for key: ${key}`)
                }
            } catch (userError) {
                console.error(`Error fetching user data for key ${key}:`, userError);
            }
        }

        console.log('Total users found:', users.length);

        if (users.length === 0) {
            return {
                success: false,
                error: 'No users found'
            }
        }

        return {
            success: true,
            data: users
        }
    } catch (error) {
        console.error('Detailed error in fetchAllUsers:', error);
        return {
            success: false,
            error: 'Something went wrong'
        }
    }
}

export async function updateChatFbCampaignId(chatSlug: string, fbCampaignId: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the chat key using the chatSlug
        const chatKey = `chat:${chatSlug}`

        // Check if the chat exists
        const existingChat = await kv.hgetall(chatKey)

        if (!existingChat) {
            return {
                error: 'Chat not found'
            }
        }

        // Update or insert the fbCampaignId field
        await kv.hset(chatKey, {fbCampaignId})
        revalidatePath('/')

        return {
            success: true,
            message: 'Facebook Campaign ID updated successfully'
        }
    } catch (error) {
        console.error(`Error updating fbCampaignId for chat ${chatSlug}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}


export async function fetchChatFbCampaignId(chatSlug: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the chat key using the chatSlug
        const chatKey = `chat:${chatSlug}`

        // Fetch the chat data
        const chatData = await kv.hgetall(chatKey)

        if (!chatData) {
            return {
                error: 'Chat not found'
            }
        }

        const fbCampaignId = chatData.fbCampaignId

        if (!fbCampaignId) {
            return {
                error: 'Facebook Campaign ID not found for this chat'
            }
        }

        return {
            success: true,
            fbCampaignId
        }
    } catch (error) {
        console.error(`Error fetching fbCampaignId for chat ${chatSlug}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

export async function updateChatCampaignBudget(chatSlug: string, budget: number) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the chat key using the chatSlug
        const chatKey = `chat:${chatSlug}`

        // Check if the chat exists
        const existingChat = await kv.hgetall(chatKey)

        if (!existingChat) {
            return {
                error: 'Chat not found'
            }
        }

        // Update or insert the fbCampaignId field
        await kv.hset(chatKey, {budget})

        return {
            success: true,
            message: 'Facebook Campaign budget updated successfully'
        }
    } catch (error) {
        console.error(`Error updating budget for chat ${chatSlug}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

// todo: replace other 1 field update functions with this
export async function updateChat(chatSlug: string, patch: { [field: string]: unknown }) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the chat key using the chatSlug
        const chatKey = `chat:${chatSlug}`

        // Check if the chat exists
        const existingChat = await kv.hgetall(chatKey)

        if (!existingChat) {
            return {
                error: 'Chat not found'
            }
        }

        // Update or insert the title field
        await kv.hset(chatKey, patch)
        revalidatePath('/')

        return {
            success: true,
            message: 'Chat title updated successfully'
        }
    } catch (error) {
        console.error(`Error updating title for chat ${chatSlug}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

export async function updateChatTitle(chatSlug: string, title: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the chat key using the chatSlug
        const chatKey = `chat:${chatSlug}`

        // Check if the chat exists
        const existingChat = await kv.hgetall(chatKey)

        if (!existingChat) {
            return {
                error: 'Chat not found'
            }
        }

        // Update or insert the title field
        await kv.hset(chatKey, {title})
        revalidatePath('/')

        return {
            success: true,
            message: 'Chat title updated successfully'
        }
    } catch (error) {
        console.error(`Error updating title for chat ${chatSlug}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

export async function updateFbAccountId(email: string, fbAccountId: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            success: false,
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the user key using the email
        const userKey = `user:${email}`

        // Check if the user exists
        const existingUser = await kv.hgetall(userKey)

        if (!existingUser) {
            return {
                success: false,
                error: 'User not found'
            }
        }

        // Format the fbAccountId
        const formattedFbAccountId = fbAccountId.startsWith('act_') ? fbAccountId : `act_${fbAccountId}`

        // Update the accountId field
        await kv.hset(userKey, {fbAccountId: formattedFbAccountId})

        return {
            success: true,
            message: 'Facebook Account ID updated successfully'
        }
    } catch (error) {
        console.error(`Error updating accountId for user ${email}:`, error)
        return {
            success: false,
            error: 'Something went wrong'
        }
    }
}

export async function fetchChatCampaignBudget(chatSlug: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the chat key using the chatSlug
        const chatKey = `chat:${chatSlug}`

        // Fetch the chat data
        const chatData = await kv.hgetall(chatKey)

        if (!chatData) {
            return {
                error: 'Chat not found'
            }
        }

        const budget = chatData.budget

        if (!budget) {
            return {
                error: 'Facebook Campaign budget not found for this chat'
            }
        }

        return {
            success: true,
            budget
        }
    } catch (error) {
        console.error(`Error fetching budget for chat ${chatSlug}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

export async function updateAdText(chatSlug: string, idx: number, adTextId: number, newAdText: AdText) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the chat key using the chatSlug
        const chatKey = `chat:${chatSlug}`

        // Check if the chat exists
        const existingChat: Chat | null = await kv.hgetall(chatKey)

        if (!existingChat) {
            return {
                error: 'Chat not found'
            }
        }

        existingChat.messages.forEach(message => {
            if (message.role === 'assistant') {
                if (!Array.isArray(message.content)) return
                message.content.forEach(tool => {
                    if (tool.type !== "tool-call") return
                    if (tool.toolName !== "showSuggestionAdText") return
                    if (!Array.isArray((tool.args as any)?.images)) return
                    (tool.args as any)?.images.forEach((image: any) => {
                        if (!Array.isArray(image.suggestedTexts)) return
                        image.suggestedTexts.forEach((suggestedText: AdText, index: number) => {
                            if (suggestedText.id === adTextId && index === idx) {
                                suggestedText.headline = newAdText.headline
                                suggestedText.text = newAdText.text
                            }
                        })
                    })
                })
            }
            if (message.role === 'tool') {
                if (!Array.isArray(message.content)) return
                message.content.forEach(tool => {
                    if (tool.type !== "tool-result") return
                    if (tool.toolName !== "showSuggestionAdText") return
                    if (!Array.isArray((tool.result as any)?.images)) return
                    (tool.result as any).images.forEach((image: any) => {
                        if (!Array.isArray(image.suggestedTexts)) return
                        image.suggestedTexts.forEach((suggestedText: AdText, index: number) => {
                            if (suggestedText.id === adTextId && index === idx) {
                                suggestedText.headline = newAdText.headline
                                suggestedText.text = newAdText.text
                            }
                        })
                    })
                })
            }
        })

        await kv.hset(chatKey, {messages: [...existingChat.messages]})
        revalidatePath('/')

        return {
            success: true,
            message: 'Chat updated successfully'
        }
    } catch (error) {
        console.error(`Error updating title for chat ${chatSlug}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

export async function updateAdTextWithFbId(chatSlug: string, idx: number, adTextId: number, fbAdId: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Construct the chat key using the chatSlug
        const chatKey = `chat:${chatSlug}`

        // Check if the chat exists
        const existingChat: Chat | null = await kv.hgetall(chatKey)

        if (!existingChat) {
            return {
                error: 'Chat not found'
            }
        }

        existingChat.messages.forEach(message => {
            if (message.role === 'assistant') {
                if (!Array.isArray(message.content)) return
                message.content.forEach(tool => {
                    if (tool.type !== "tool-call") return
                    if (tool.toolName !== "showSuggestionAdText") return
                    if (!Array.isArray((tool.args as any)?.images)) return
                    (tool.args as any)?.images.forEach((image: any) => {
                        if (!Array.isArray(image.suggestedTexts)) return
                        image.suggestedTexts.forEach((suggestedText: AdText, index: number) => {
                            if (suggestedText.id === adTextId && index === idx) {
                                suggestedText.fbAdId = fbAdId
                            }
                        })
                    })
                })
            }
            if (message.role === 'tool') {
                if (!Array.isArray(message.content)) return
                message.content.forEach(tool => {
                    if (tool.type !== "tool-result") return
                    if (tool.toolName !== "showSuggestionAdText") return
                    if (!Array.isArray((tool.result as any)?.images)) return
                    (tool.result as any).images.forEach((image: any) => {
                        if (!Array.isArray(image.suggestedTexts)) return
                        image.suggestedTexts.forEach((suggestedText: AdText, index: number) => {
                            if (suggestedText.id === adTextId && index === idx) {
                                suggestedText.fbAdId = fbAdId
                            }
                        })
                    })
                })
            }
        })

        await kv.hset(chatKey, {messages: [...existingChat.messages]})
        revalidatePath('/')

        return {
            success: true,
            message: 'Chat updated successfully'
        }
    } catch (error) {
        console.error(`Error updating title for chat ${chatSlug}:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

export async function getUserDetail() {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        const userKey = `user:${session.user.email}`

        // Check if the chat exists
        const user: User | null = (await kv.hgetall(userKey))

        if (!user) {
            return {
                error: 'User not found'
            }
        }
        return {
            success: true,
            user: user
        }
    } catch (error) {
        console.error(`Error get current user detail:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}
