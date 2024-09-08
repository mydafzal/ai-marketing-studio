'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {kv} from '@vercel/kv'

import {auth} from '@/auth'
import {type Chat} from '@/lib/types'

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

export async function updateChatExtraDetails(chatId: string, extraDetails: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }

    try {
        // Get the existing chat data
        const chatKey = `chat:${chatId}`
        const existingChat = await kv.hgetall(chatKey)

        if (!existingChat) {
            return {
                error: 'Chat not found'
            }
        }

        // Add the extraDetails field to the existing chat data
        await kv.hset(chatKey, {extraDetails})

        return {
            success: true
        }
    } catch (error) {
        console.error(`Error updating extraDetails for chat ${chatId}:`, error)
        return {
            error: 'Something went wrong'
        }
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

interface User {
    email: string;
    fbAccountId: string | null;
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

        const users: User[] = []

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

