'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {kv} from '@vercel/kv'

import {auth} from '@/auth'
import {type Chat, User, AdText, ServerActionResult} from '@/lib/types'

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

export async function getAllChats(): Promise<Chat[]> {
    const allChats: Chat[] = [];
    let cursor = '0';
    const pattern = 'chat:*';
    const count = 100; 

    try {
        do {
            const [newCursor, chatKeys] = await kv.scan(cursor, { match: pattern, count });
            cursor = newCursor; 

            if (chatKeys.length > 0) {
                const pipeline = kv.pipeline();
                for (const key of chatKeys) {
                    pipeline.hgetall(key); 
                }
                const chatData = await pipeline.exec();

                chatData.forEach(chat => {
                    if (chat && Object.keys(chat).length > 0) {
                        allChats.push(chat as Chat);
                    }
                });
            }

        } while (cursor !== '0');

    } catch (error) {
        console.error('Error fetching all chats:', error);
    }

    return allChats;
}

export async function getTotalMessagesCount(): Promise<number> {
    const allChats = await getAllChats(); 
    let totalMessagesCount = 0; 

    allChats.forEach(chat => {
        if (chat.messages && Array.isArray(chat.messages)) {
            totalMessagesCount += chat.messages.length; 
        }
    });

    return totalMessagesCount; 
}

async function getUserMessageCount(userId: string): Promise<number> {
    const messagesKey = `user:${userId}:messages`; 
    const messages = await kv.lrange(messagesKey, 0, -1); 
    return messages.length;
}

export async function getUsersAboveAverageMessages(): Promise<string[]> {
    const stats = await fetchOverallStats();
    
    if ('error' in stats) {
        console.error('Error fetching overall stats:', stats.error);
        return [];
    }

    const { messageToCustomerRatio, uniqueUserCount } = stats;

    if (messageToCustomerRatio === null) {
        console.warn('Message-to-Customer Ratio is not available');
        return [];
    }

    const usersResponse = await fetchAllUsers();

    if (!usersResponse.success || !Array.isArray(usersResponse.data)) {
        console.error('Error fetching users:', usersResponse.error);
        return [];
    }

    const aboveAverageUserIds: string[] = [];

    for (const user of usersResponse.data) {
        if (user.email) {
            const userMessageCount = await getUserMessageCount(user.email); 

            if (userMessageCount > messageToCustomerRatio) {
                aboveAverageUserIds.push(user.email); 
            }
        }
    }

    return aboveAverageUserIds;
}

async function getUserChatCount(userId: string): Promise<number> {
    const chatsKey = `user:${userId}:chats`; 
    const chats = await kv.lrange(chatsKey, 0, -1); 
    return chats.length;
}

export async function getUsersAboveAverageChats(): Promise<string[]> {
    const stats = await fetchOverallStats();

    if ('error' in stats) {
        console.error('Error fetching overall stats:', stats.error);
        return [];
    }

    const { chatToCustomerRatio, uniqueUserCount } = stats;

    if (chatToCustomerRatio === null) {
        console.warn('Chat-to-Customer Ratio is not available');
        return [];
    }

    const usersResponse = await fetchAllUsers();

    if (!usersResponse.success || !Array.isArray(usersResponse.data)) {
        console.error('Error fetching users:', usersResponse.error);
        return [];
    }

    const aboveAverageUserIds: string[] = [];

    for (const user of usersResponse.data) {
        if (user.email) {
            const userChatCount = await getUserChatCount(user.email); 

            if (userChatCount > chatToCustomerRatio) {
                aboveAverageUserIds.push(user.email); 
            }
        }
    }

    return aboveAverageUserIds;
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

        // Update or insert the fbCampaignId field
        await kv.hset(chatKey, {title})

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
                                console.log('suggestedText', suggestedText)
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
                                console.log('suggestedText', suggestedText)
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
                                console.log('suggestedText', suggestedText)
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
                                console.log('suggestedText', suggestedText)
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

export async function incrementMessageCount(chatId: string): Promise<ServerActionResult<{ success: boolean }>> {
    const session = await auth();

    if (!session || !session.user) {
        return {
            success: false,
            error: 'User not authenticated'
        };
    }

    try {
        const chatKey = `chat:${chatId}`;
        const chatData = await kv.hgetall<Chat>(chatKey);

        if (!chatData) {
            return {
                success: false,
                error: 'Chat not found'
            };
        }

        const messagesCount = (chatData.messagesCount ?? 0) + 1;
        chatData.messagesCount = messagesCount;
        await kv.hmset(chatKey, { messagesCount });

        const userKey = `user:${session.user.email}`;
        await kv.hincrby(userKey, 'messagesCount', 1);

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error incrementing message count:', error);
        return {
            success: false,
            error: 'Something went wrong'
        };
    }
}

export async function updateTimeSpent(chatId: string, timeSpent: number): Promise<ServerActionResult<{ success: boolean }>> {
    const session = await auth();

    if (!session || !session.user) {
        return {
            success: false,
            error: 'User not authenticated'
        };
    }

    try {
        const chatKey = `chat:${chatId}`;
        const chatData = await kv.hgetall<Chat>(chatKey);

        if (!chatData) {
            return {
                success: false,
                error: 'Chat not found'
            };
        }

        const totalSpent = (chatData.timeSpent ?? 0) + timeSpent;
        chatData.timeSpent = totalSpent;
        await kv.hmset(chatKey, { timeSpent });

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error updating time spent:', error);
        return {
            success: false,
            error: 'Something went wrong'
        };
    }
}

type OverallStatsResponse = 
    | { 
        totalChats: number; 
        uniqueUserCount: number; 
        chatToCustomerRatio: number | null; 
        messageToCustomerRatio: number | null; 
        error?: undefined; 
    }
    | { 
        error: string; 
        totalChats?: undefined; 
        uniqueUserCount?: undefined; 
        chatToCustomerRatio?: undefined; 
        messageToCustomerRatio?: undefined; 
    };

export async function fetchOverallStats(): Promise<OverallStatsResponse> {
    const allChats = await getAllChats(); 
    const totalChats = allChats.length; 
    
    const usersResponse = await fetchAllUsers(); 
    
    let uniqueUserCount = 0;
    let chatToCustomerRatio = null; 
    let messageToCustomerRatio = null; 
    
    const totalMessages = await getTotalMessagesCount(); 

    if (usersResponse.success) {
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
            const uniqueUserIds = new Set<string>();

            usersResponse.data.forEach(user => {
                if (user.email) {
                    uniqueUserIds.add(user.email); 
                }
            });

            uniqueUserCount = uniqueUserIds.size;
        } else {
            console.warn('No user data found or data is not an array');
        }
    } else {
        console.error('Error fetching users:', usersResponse.error);
        return { error: usersResponse.error || 'An unknown error occurred' }; 
    }

    if (uniqueUserCount > 0) {
        if (totalChats > 0) {
            chatToCustomerRatio = totalChats / uniqueUserCount;
        }
        
        messageToCustomerRatio = totalMessages / uniqueUserCount; 
    }

    return { 
        totalChats, 
        uniqueUserCount, 
        chatToCustomerRatio, 
        messageToCustomerRatio 
    }; 
}
    
export async function fetchUserStatistics(userId: string) {
    try {
        const chatsRecord: Record<string, unknown> | null = await kv.hgetall('chats');
        const allChats: Chat[] = chatsRecord ? Object.values(chatsRecord) as Chat[] : [];
        const userChats = allChats.filter(chat => chat.userId === userId);
        
        const messagesPerChat: Record<string, number> = {};
        const timeSpentPerSession: number[] = [];

        userChats.forEach(chat => {
            messagesPerChat[chat.id] = chat.messages.length;

            if (chat.messages.length > 0) {
                const timestamps = chat.messages.map(msg => msg.timestamp).filter(Boolean) as string[];
                const startTime = new Date(Math.min(...timestamps.map(ts => new Date(ts).getTime())));
                const endTime = new Date(Math.max(...timestamps.map(ts => new Date(ts).getTime())));
                const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
                timeSpentPerSession.push(timeSpent);
            }
        });

        const totalChats = userChats.length;

        return {
            email: userId,
            chats: totalChats,
            messagesPerChat,
            timeSpentPerSession
        };
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        return { error: 'Failed to fetch user statistics' };
    }
}
