'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {kv} from '@vercel/kv'

import {auth} from '@/auth'
import {AdText, type Chat, User, VideoAdText} from '@/lib/types'
import {getBaseUrl} from "@/lib/helpers/vercel/get-base-url"
import {nanoid} from '@/lib/utils'
import { cookies } from 'next/headers'

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
        return {
            success: true,
            message: 'No chats to clear'
        }
    }
    
    const pipeline = kv.pipeline()

    for (const chat of chats) {
        pipeline.del(chat)
        pipeline.zrem(`user:chat:${session.user.id}`, chat)
    }

    await pipeline.exec()

    // We'll handle the redirect on the client side
    // to ensure it's a full page reload
    return {
        success: true,
        message: 'Chats cleared successfully'
    }
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

export async function createFbCampaignStructure(
    campaignId: string,
    adsetId: string,
    pageId: string,
    leadformId?: string
) {
    const session = await auth();

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        };
    }

    try {
        // Store campaign data
        const campaignKey = `fbCampaign:${campaignId}`;
        await kv.hset(campaignKey, {
            campaignId,
            adsetIds: JSON.stringify([adsetId])
        });

        // Store adset with its associated page and leadform (if provided)
        const adsetKey = `fbAdset:${adsetId}`;
        const adsetData: {
            adsetId: string,
            campaignId: string,
            pageId: string,
            leadformId?: string
        } = {
            adsetId,
            campaignId,
            pageId,
        };

        // Only include leadformId if it exists
        if (leadformId) {
            adsetData.leadformId = leadformId;
        }

        await kv.hset(adsetKey, adsetData);

        return {
            success: true,
            message: 'Campaign structure created successfully'
        };
    } catch (error) {
        console.error(`Error creating structure for fbCampaign ${campaignId}:`, error);
        return {
            error: 'Something went wrong'
        };
    }
}

export async function updateLeadFormInAdset(adSetId:string, leadFormId:string){
    const session = await auth();

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        };
    }

    try {

        const adsetKey = `fbAdset:${adSetId}`;
        await kv.hset(adsetKey, {leadformId:leadFormId});

        return {
            success: true,
            message: 'Adset structure created successfully'
        };
    } catch (error) {
        console.error(`Error updating structure for adSetId ${adSetId}:`, error);
        return {
            error: 'Something went wrong'
        };
    }
}

export async function fetchFbCampaignStructure(campaignId: string, adSetId: string) {
    const session = await auth();

    if (!session || !session.user) {
        return {
            success: false,
            error: 'User not authenticated'
        };
    }

    try {
        // Get campaign data
        const campaignKey = `fbCampaign:${campaignId}`;
        const campaign = await kv.hgetall(campaignKey);

        if (!campaign || !campaign.adsetIds) {
            return {
                success: false,
                error: 'Campaign not found or has no adset'
            };
        }
        const adsetIds = typeof campaign.adsetIds === 'string' ? JSON.parse(campaign.adsetIds) : campaign.adsetIds;

        if (!adsetIds.includes(adSetId)) {
            return {
                success: false,
                error: 'Adset id is missing in the adset list'
            };
        }

        const adsetKey = `fbAdset:${adSetId}`;
        const adset = await kv.hgetall<{
            adsetId: string,
            pageId: string,
            leadformId?: string
        }>(adsetKey);

        if (!adset) {
            return {
                success: false,
                error: 'Adset not found'
            };
        }

        const adsetData = {
            adsetId: adset.adsetId,
            pageId: adset.pageId,
            ...(adset.leadformId && {leadformId: adset.leadformId})
        };

        return {
            success: true,
            data: {
                campaignId,
                ...adsetData
            }
        };

    } catch (error) {
        console.error(`Error fetching structure for fbCampaign ${campaignId}:`, error);
        return {
            success: false,
            error: 'Something went wrong'
        };
    }
}


export async function saveFbCampaignStructure(data: {
    campaign: { id: string },
    adset: { id: string },
    lead_form?: { id: string }
}) {
    const userDetail = await getUserDetail();
    let fbPageId = "";

    if (userDetail.success && userDetail.user) {
        fbPageId = String(userDetail.user.fbPageId || '');
    }

    // Extract campaign and adset IDs from response
    const campaignId = data.campaign.id;
    const adsetId = data.adset?.id;
    const pageId = fbPageId || "119021011189054"; // Use default if not provided
    const leadFormId = data.lead_form?.id;

    // Save campaign structure to database
    await createFbCampaignStructure(
        campaignId,
        adsetId,
        pageId,
        leadFormId
    );
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
        return {error: 'User not authenticated'}
    }

    if (!userEmail) {
        return {error: 'Missing user email'}
    }

    if (!promptString) {
        return {error: 'Missing prompt string'}
    }

    try {
        const userKey = `user:${userEmail}`
        await kv.hset(userKey, {defaultExtraDetails: promptString})
        return {success: true, message: 'Default extra details updated successfully'}
    } catch (error) {
        console.error(`Error updating defaultExtraDetails for user: ${userEmail}`, error)
        return {error: 'Failed to update default extra details'}
    }
}

export async function fetchUserDefaultExtraAdminDetailsForAdmin(userEmail: string) {
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
        const defaultExtraAdminDetails = await kv.hget(userKey, 'defaultExtraAdminDetails')

        return defaultExtraAdminDetails || ''

    } catch (error) {
        console.error(`Error fetching defaultExtraAdminDetails for user: ${userEmail}`, error)
        return ''
    }
}

export async function updateUserDefaultExtraAdminDetailsForAdmin(userEmail: string, promptString: string) {
    const session = await auth()
    if (!session || !session.user) {
        return {error: 'User not authenticated'}
    }

    if (!userEmail) {
        return {error: 'Missing user email'}
    }

    if (!promptString) {
        return {error: 'Missing prompt string'}
    }

    try {
        const userKey = `user:${userEmail}`
        await kv.hset(userKey, {defaultExtraAdminDetails: promptString})
        return {success: true, message: 'Default extra admin details updated successfully'}
    } catch (error) {
        console.error(`Error updating defaultExtraAdminDetails for user: ${userEmail}`, error)
        return {error: 'Failed to update default extra details'}
    }
}



export async function fetchUserDefaultAndAdminExtraDetails() {
    const session = await auth()

    if (!session?.user?.email) {
        console.error('User not authenticated or email not available')
        return ''
    }

    try {
        const userKey = `user:${session.user.email}`
        const details = await kv.hmget(userKey, 'defaultExtraDetails', 'defaultExtraAdminDetails');

        const userDetails = details?.defaultExtraDetails ?? '';
        const adminDetails = details?.defaultExtraAdminDetails ?? '';

        let concatenatedDetails = userDetails + "\n\n"+ adminDetails;

        return concatenatedDetails;

    } catch (error) {
        console.error(`Error fetching default and admin extra details for user: ${session.user.email}`, error)
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
                fbAccountId: (user.fbAccountId as string) || null,
                fbPageId: (user.fbPageId as string) || null,
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
            fbAccountId: string | null,
            fbPageId: string | null,
        }[] = []

        for (const key of keys) {
            try {
                const user = await kv.hgetall(key)
                console.log(`User data for key ${key}:`, user);
                if (user && typeof user === 'object' && 'email' in user) {
                    users.push({
                        email: user.email as string,
                        fbAccountId: (user.fbAccountId as string) || null,
                        fbPageId: (user.fbPageId as string) || null,
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

        let update = {};

        if (existingChat.fbCampaignId && existingChat.fbCampaignId != fbCampaignId) {
            update = {fbCampaignId, fbAdsetId: ""}
        } else {
            update = {fbCampaignId}
        }

        // Update or insert the fbCampaignId field
        await kv.hset(chatKey, update)
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

export async function fetchChatFbAdsetId(chatSlug: string) {
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

        const fbAdsetId = chatData.fbAdsetId

        if (!fbAdsetId) {
            return {
                error: 'Facebook Ad Set ID not found for this chat'
            }
        }

        return {
            success: true,
            fbAdsetId
        }
    } catch (error) {
        console.error(`Error fetching fbAdsetId for chat ${chatSlug}:`, error)
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


export async function updateFbPageId(email: string, fbPageId: string) {
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


        // Update the pageId field
        await kv.hset(userKey, {fbPageId})

        return {
            success: true,
            message: 'Facebook Account ID updated successfully'
        }
    } catch (error) {
        console.error(`Error updating pageId for user ${email}:`, error)
        return {
            success: false,
            error: 'Something went wrong'
        }
    }
}

export async function updateFbBusinessAcc(email: string, accountId: string) {
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

        // Update the accountId field
        await kv.hset(userKey, {fbBusinessAccId: accountId})

        return {
            success: true,
            message: 'Facebook Business account id updated successfully'
        }
    } catch (error) {
        console.error(`Error updating Facebook Business account id for user ${email}:`, error)
        return {
            success: false,
            error: 'Something went wrong'
        }
    }
}

export async function updateInstagramAccountId(email: string, instagramAccountId: string, fbPageId: string) {
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

        // Create a combined value with dot separator: "instagramId.fbPageId"
        const instagramFbPagePairing = `${instagramAccountId}.${fbPageId}`

        // Update the instagramFbPagePairing field with the combined string
        await kv.hset(userKey, {instagramFbPagePairing})

        return {
            success: true,
            message: 'Instagram account configuration updated successfully'
        }
    } catch (error) {
        console.error(`Error updating Instagram account configuration for user ${email}:`, error)
        return {
            success: false,
            error: 'Something went wrong'
        }
    }
}

export async function updateFbAccessToken(email: string, fbAccessToken: string) {
    const session = await auth()

    // if (!session || !session.user) {
    //     return {
    //         success: false,
    //         error: 'User not authenticated'
    //     }
    // }

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


        // encrypt the fbAccessToken
        const encryptedAccessToken = fbAccessToken // TODO: Encryption of access token

        // Update the accountId field
        await kv.hset(userKey, {fbMarketingApiKey: encryptedAccessToken})

        return {
            success: true,
            message: 'Facebook Access token updated successfully'
        }
    } catch (error) {
        console.error(`Error updating Facebook Access token for user ${email}:`, error)
        return {
            success: false,
            error: 'Something went wrong'
        }
    }
}

export async function disconnectFacebook(email: string) {
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

        // Update the accountId field
        await kv.hset(userKey, {fbMarketingApiKey: null, fbBusinessAccId: null, fbAccountId: null})

        return {
            success: true,
            message: 'Facebook disconnected successfully'
        }
    } catch (error) {
        console.error(`Error disconnecting facebook for user ${email}:`, error)
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

export async function updateAdText(chatSlug: string, idx: number, adTextId: number, newAdText: AdText | VideoAdText, type?: string) {
    const session = await auth()
    const toolName = type ? type : 'showSuggestionAdText'
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
                    if (tool.type !== 'tool-call') return
                    if (tool.toolName !== toolName) return
                    if (toolName === 'showSuggestionAdText') {
                        if (!Array.isArray((tool.args as any)?.images)) return
                            ;
                        (tool.args as any)?.images.forEach((image: any) => {
                            if (!Array.isArray(image.suggestedTexts)) return
                            image.suggestedTexts.forEach(
                                (suggestedText: AdText, index: number) => {
                                    if (suggestedText.id === adTextId && index === idx) {
                                        suggestedText.headline = newAdText.headline
                                        suggestedText.text = newAdText.text
                                    }
                                }
                            )
                        })
                    } else if (toolName === 'showVideoAdTextSuggestion') {
                        if (!Array.isArray((tool.args as any)?.videos)) return
                            ;
                        (tool.args as any)?.videos.forEach((video: any) => {
                            if (!Array.isArray(video.suggestedTexts)) return
                            video.suggestedTexts.forEach(
                                (suggestedText: AdText, index: number) => {
                                    if (suggestedText.id === adTextId && index === idx) {
                                        suggestedText.headline = newAdText.headline
                                        suggestedText.text = newAdText.text
                                    }
                                }
                            )
                        })
                    }
                })
            }
            if (message.role === 'tool') {
                if (!Array.isArray(message.content)) return
                message.content.forEach(tool => {
                    if (tool.type !== 'tool-result') return
                    if (tool.toolName !== toolName) return
                    if (toolName === 'showSuggestionAdText') {
                        if (!Array.isArray((tool.result as any)?.images)) return
                            ;
                        (tool.result as any).images.forEach((image: any) => {
                            if (!Array.isArray(image.suggestedTexts)) return
                            image.suggestedTexts.forEach(
                                (suggestedText: AdText, index: number) => {
                                    if (suggestedText.id === adTextId && index === idx) {
                                        suggestedText.headline = newAdText.headline
                                        suggestedText.text = newAdText.text
                                    }
                                }
                            )
                        })
                    } else if (toolName === 'showVideoAdTextSuggestion') {
                        if (!Array.isArray((tool.result as any)?.videos)) return
                            ;
                        (tool.result as any).videos.forEach((video: any) => {
                            if (!Array.isArray(video.suggestedTexts)) return
                            video.suggestedTexts.forEach(
                                (suggestedText: AdText, index: number) => {
                                    if (suggestedText.id === adTextId && index === idx) {
                                        suggestedText.headline = newAdText.headline
                                        suggestedText.text = newAdText.text
                                    }
                                }
                            )
                        })
                    }
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

export async function updateAdTextWithFbId(chatSlug: string, idx: number, adTextId: number, fbAdId: string, type?: string) {
    const session = await auth()
    const toolName = type ? type : 'showSuggestionAdText'

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
                    if (tool.toolName !== toolName) return
                    if (toolName === 'showSuggestionAdText') {
                        if (!Array.isArray((tool.args as any)?.images)) return
                        (tool.args as any)?.images.forEach((image: any) => {
                            if (!Array.isArray(image.suggestedTexts)) return
                            image.suggestedTexts.forEach((suggestedText: AdText, index: number) => {
                                if (suggestedText.id === adTextId && index === idx) {
                                    suggestedText.fbAdId = fbAdId
                                }
                            })
                        })
                    } else if (toolName === 'showVideoAdTextSuggestion') {
                        if (!Array.isArray((tool.args as any)?.videos)) return
                        (tool.args as any)?.videos.forEach((video: any) => {
                            if (!Array.isArray(video.suggestedTexts)) return
                            video.suggestedTexts.forEach((suggestedText: AdText, index: number) => {
                                if (suggestedText.id === adTextId && index === idx) {
                                    suggestedText.fbAdId = fbAdId
                                }
                            })
                        })
                    }

                })
            }
            if (message.role === 'tool') {
                if (!Array.isArray(message.content)) return
                message.content.forEach(tool => {
                    if (tool.type !== "tool-result") return
                    if (tool.toolName !== toolName) return

                    if (toolName === 'showSuggestionAdText') {
                        if (!Array.isArray((tool.result as any)?.images)) return
                        (tool.result as any).images.forEach((image: any) => {
                            if (!Array.isArray(image.suggestedTexts)) return
                            image.suggestedTexts.forEach((suggestedText: AdText, index: number) => {
                                if (suggestedText.id === adTextId && index === idx) {
                                    suggestedText.fbAdId = fbAdId
                                }
                            })
                        })
                    } else if (toolName === 'showVideoAdTextSuggestion') {
                        if (!Array.isArray((tool.result as any)?.videos)) return
                        (tool.result as any).videos.forEach((video: any) => {
                            if (!Array.isArray(video.suggestedTexts)) return
                            video.suggestedTexts.forEach((suggestedText: AdText, index: number) => {
                                if (suggestedText.id === adTextId && index === idx) {
                                    suggestedText.fbAdId = fbAdId
                                }
                            })
                        })
                    }

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


export async function getUserFbAccountId() {
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
            fbAccountId: user.fbAccountId || null
        }
    } catch (error) {
        console.error(`Error get current user detail:`, error)
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


export async function getFbMarketingApiKey() {
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
            token: user.fbMarketingApiKey
        }
    } catch (error) {
        console.error(`Error get current user detail:`, error)
        return {
            error: 'Something went wrong'
        }
    }
}

// Free plan usage limits (not exported directly to comply with "use server" rules)
const FREE_PLAN_LIMITS = {
    MAX_MESSAGES: 20,
    MAX_IMAGES: 5,
    MAX_VIDEOS: 1,
    MAX_INPAINTING: 1
};

/**
 * Get free plan usage limits
 */
export async function getFreePlanLimits() {
    return FREE_PLAN_LIMITS;
}

// Import subscription bypass list
import { subscriptionBypassList } from '@/app/subscription/subscription-bypass-list';

export async function getSubscriptionInfo(): Promise<{ 
    success?: boolean; 
    sub_offer?: string; 
    sub_status?: string; 
    error?: string;
    usageCounts?: {
        messages: number;
        images: number;
        videos: number;
        inpainting: number;
    };
    isFreePlan?: boolean;
} | null> {
    const session = await auth();

    if (!session || !session.user) {
        return null; // Explicitly return null for unauthenticated users
    }

    try {
        const userKey = `user:${session.user.email}`;
        const user = await kv.hgetall(userKey);

        if (!user) {
            return null; // Explicitly return null if user is not found
        }

        // Get usage counts
        const usageKey = `usage:${session.user.email}`;
        const usageCounts = await kv.hgetall(usageKey) || {
            messages: 0,
            images: 0,
            videos: 0,
            inpainting: 0
        };
        
        // Convert to numbers (Redis returns strings)
        const parsedUsageCounts = {
            messages: parseInt(String(usageCounts.messages || 0), 10),
            images: parseInt(String(usageCounts.images || 0), 10),
            videos: parseInt(String(usageCounts.videos || 0), 10),
            inpainting: parseInt(String(usageCounts.inpainting || 0), 10)
        };

        // Check if user is in the bypass list
        const userEmail = session.user.email as string;
        const isInBypassList = subscriptionBypassList.includes(userEmail);

        // Determine subscription status
        // Set as active if user is in bypass list or has an active subscription
        let userSubStatus = isInBypassList ? 'active' : String(user.sub_status || '');
        const isOnFreePlan = !isInBypassList && (!userSubStatus || userSubStatus === 'inactive');
        const isSubscribed = isInBypassList || userSubStatus === 'active' || userSubStatus === 'trialing';

        return {
            success: true,
            sub_offer: String(user.sub_offer || ''), // Ensure empty string instead of undefined
            sub_status: isInBypassList ? 'active' : String(user.sub_status || ''), // Override status for bypass users
            usageCounts: parsedUsageCounts,
            isFreePlan: isOnFreePlan
        };
    } catch (error) {
        console.error(`Error getting current user details:`, error);
        return null; // Ensure null is returned on errors
    }
}

/**
 * Increment a specific usage counter for the current user
 */
export async function incrementUsageCounter(
    counterType: 'messages' | 'images' | 'videos' | 'inpainting'
): Promise<{ 
    success: boolean; 
    newCount?: number;
    limitReached?: boolean;
    error?: string;
}> {
    const session = await auth();

    if (!session || !session.user) {
        return { 
            success: false, 
            error: 'User not authenticated' 
        };
    }

    try {
        const userEmail = session.user.email as string;
        
        // Check if user is in the bypass list
        const isInBypassList = subscriptionBypassList.includes(userEmail);
        
        // If user is in the bypass list, treat them as subscribed and don't increment counters
        if (isInBypassList) {
            return { 
                success: true,
                newCount: 0,
                limitReached: false
            };
        }
        
        // Get subscription status first to check if we need to track
        const subscription = await getSubscriptionInfo();
        
        // If user is subscribed, don't increment counters
        if (subscription?.sub_status === 'active' || subscription?.sub_status === 'trialing') {
            return { 
                success: true,
                newCount: 0,
                limitReached: false
            };
        }

        const usageKey = `usage:${userEmail}`;
        
        // Get current count
        const currentCount = parseInt(String(await kv.hget(usageKey, counterType) || 0), 10);
        const newCount = currentCount + 1;
        
        // Update the counter
        await kv.hset(usageKey, { [counterType]: newCount });
        
        // Check if limit reached
        let limitReached = false;
        switch (counterType) {
            case 'messages':
                limitReached = newCount > FREE_PLAN_LIMITS.MAX_MESSAGES;
                break;
            case 'images':
                limitReached = newCount > FREE_PLAN_LIMITS.MAX_IMAGES;
                break;
            case 'videos':
                limitReached = newCount > FREE_PLAN_LIMITS.MAX_VIDEOS;
                break;
            case 'inpainting':
                limitReached = newCount > FREE_PLAN_LIMITS.MAX_INPAINTING;
                break;
        }

        return {
            success: true,
            newCount,
            limitReached
        };
    } catch (error) {
        console.error(`Error incrementing usage counter:`, error);
        return { 
            success: false, 
            error: `Error incrementing counter: ${error}` 
        };
    }
}

/**
 * Check if a specific usage limit has been reached
 */
export async function checkUsageLimit(
    counterType: 'messages' | 'images' | 'videos' | 'inpainting'
): Promise<{
    success: boolean;
    limitReached: boolean;
    currentCount?: number;
    maxCount?: number;
    error?: string;
}> {
    const session = await auth();

    if (!session || !session.user) {
        return { 
            success: false, 
            limitReached: true,
            error: 'User not authenticated' 
        };
    }

    try {
        const userEmail = session.user.email as string;
        
        // Check if user is in the bypass list
        const isInBypassList = subscriptionBypassList.includes(userEmail);
        
        // If user is in the bypass list, treat them as subscribed and don't apply limits
        if (isInBypassList) {
            return { 
                success: true,
                limitReached: false,
                currentCount: 0,
                maxCount: Infinity
            };
        }
        
        // Get subscription status first
        const subscription = await getSubscriptionInfo();
        
        // If user is subscribed, no limits apply
        if (subscription?.sub_status === 'active' || subscription?.sub_status === 'trialing') {
            return { 
                success: true,
                limitReached: false,
                currentCount: 0,
                maxCount: Infinity
            };
        }

        const usageKey = `usage:${userEmail}`;
        
        // Get current count
        const currentCount = parseInt(String(await kv.hget(usageKey, counterType) || 0), 10);
        
        // Get max count based on counter type
        let maxCount = 0;
        switch (counterType) {
            case 'messages':
                maxCount = FREE_PLAN_LIMITS.MAX_MESSAGES;
                break;
            case 'images':
                maxCount = FREE_PLAN_LIMITS.MAX_IMAGES;
                break;
            case 'videos':
                maxCount = FREE_PLAN_LIMITS.MAX_VIDEOS;
                break;
            case 'inpainting':
                maxCount = FREE_PLAN_LIMITS.MAX_INPAINTING;
                break;
        }

        return {
            success: true,
            limitReached: currentCount >= maxCount,
            currentCount,
            maxCount
        };
    } catch (error) {
        console.error(`Error checking usage limit:`, error);
        return { 
            success: false, 
            limitReached: true, // Fail closed
            error: `Error checking usage limit: ${error}` 
        };
    }
}

export async function updateOnboardingDetails(email: string, details: {
    first_name: string;
    last_name: string,
    company_name: string;
    company_description: string;
    website_link: string;
    privacy_policy_link: string;
    preferred_language: string;
    goal: string;
    company_segment: string;
    locations?: {
        country: {
            name: string;
            code: string;
        };
        regions: Array<{
            key: number;
            name: string;
            cities: Array<{
                key: number;
                name: string;
            }>;
        }>;
    }[];
}) {
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
        const existingUser: User | null = (await kv.hgetall(userKey))

        if (!existingUser) {
            return {
                success: false,
                error: 'User not found'
            }
        }


        let defaultExtraDetails = existingUser.defaultExtraDetails;
        let website_data = "";


        if (!(existingUser.website_link == details.website_link && existingUser.website_data)) {


            const resp = await fetch(`${getBaseUrl()}/api/fasty-bot/proxy-get-website-data`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    website_link: details.website_link
                })
            });

            if (resp.ok) {
                const resp_data = await resp.json()
                website_data = resp_data.response
            }
        } else {
            website_data = existingUser.website_data;
        }


        let newDetails = `First Name: ${details.first_name}
        Last Name: ${details.last_name}
        Company Name: ${details.company_name}
        Company Description: ${details.company_description}
        Company Segment: ${details.company_segment}
        Website Link: ${details.website_link}
        Privacy Policy Link: ${details.privacy_policy_link}
        Website data (scraped): ${website_data}
        Preferred Language: ${details.preferred_language}
        Goal: ${details.goal}`;

        if (defaultExtraDetails) {
            let splitDetails = defaultExtraDetails.split('---');

            if (splitDetails.length > 1) {
                newDetails += `\n---\n${splitDetails[1].trim()}`;
            } else {
                newDetails += `\n---\n`;
            }
        } else {
            newDetails += `\n---\n`;
        }


        // Prepare data to save
        const dataToSave = {
            first_name: details.first_name,
            last_name: details.last_name,
            company_name: details.company_name,
            company_description: details.company_description,
            website_link: details.website_link,
            privacy_policy_link: details.privacy_policy_link,
            preferred_language: details.preferred_language,
            goal: details.goal,
            company_segment: details.company_segment,
            defaultExtraDetails: newDetails,
            website_data: website_data
        };

        // Handle locations - explicitly save them as a stringified object or null
        // This ensures deleted locations are properly removed
        if (details.locations && Array.isArray(details.locations) && details.locations.length > 0) {
            console.log("[TEMPORARY DEBUG] Saving locations to KV:", details.locations);
            (dataToSave as any)["locations"] = JSON.stringify(details.locations);
        } else {
            console.log("[TEMPORARY DEBUG] Clearing locations in KV");
            (dataToSave as any)["locations"] = null; // Explicitly set to null to remove locations
        }

        // Update user data in KV
        await kv.hset(userKey, dataToSave)

        return {
            success: true,
            message: 'Onboarding data updated successfully'
        }
    } catch (error) {
        console.error(`Error updating onboarding data for user ${email}:`, error)
        return {
            success: false,
            error: 'Something went wrong'
        }
    }
}


export async function getTaskAndPreviousMessages(chat_id: string, task_id: string) {
    const existingChat = await kv.hgetall<Chat>(`chat:${chat_id}`);

    if (!existingChat) {
        return null;
    }


    // Find the index of the message that contains the tool with the matching task_id
    const taskIndex = existingChat.messages.findIndex(message => {
        if (message.role === 'tool' && Array.isArray(message.content)) {
            // Find the tool where toolCallId matches task_id
            return message.content.some(tool => tool.toolCallId === task_id);
        }
        return false;  // Ensure we return a boolean for every message
    });

    if (taskIndex === -1) {
        // If the task was not found, return null
        return null;
    }

    // Get the task message at the found index
    const taskMessage = existingChat.messages[taskIndex];

    // Filter messages before the task that have the role 'user'
    const previousUserMessages = existingChat.messages
        .slice(0, taskIndex)  // Only consider messages before the task
        .filter(message => message.role === 'user')  // Filter for 'user' role
        .slice(-6);  // Get the last six messages

    // Return both the taskMessage and the previous six 'user' messages
    return {
        task: taskMessage,
        previousMessages: previousUserMessages,
        user_id: existingChat.userId,
    };
}


export async function updateTaskWithStatus(
    chat_id: string,
    task_id: string,
    update: { comment: string; status: 'done' | 'reject' }
) {
    // Retrieve the chat object
    const existingChat = await kv.hgetall<Chat>(`chat:${chat_id}`);

    if (!existingChat) {
        throw new Error("Chat not found");
    }

    // Iterate over messages and update the relevant task
    existingChat.messages.forEach((message) => {
        if (message.role === "tool" && Array.isArray(message.content)) {
            message.content.forEach((tool) => {
                if (tool.type === "tool-result" && tool.toolCallId === task_id) {
                    // Update the tool result with the provided comment and status
                    tool.result = {
                        comment: update.comment,
                        status: update.status,
                    };
                }
            });
        }
    });


    // Save the updated chat object back to the database
    await kv.hset(`chat:${chat_id}`, existingChat);

    return {
        success: true,
        message: "Task updated successfully",
    };
}

export async function getUserByEmail(user_email: string) {
    try {
        const userKey = `user:${user_email}`

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


export async function createUserWithoutPassword(
    email: string,
) {
    const resp = await getUserByEmail(email)

    if (resp.success) {
        return {
            error: "User already exists"
        }
    } else {
        const user = {
            id: nanoid(),
            email,
            provider: "facebook",
            password: "",
            salt: ""
        }

        await kv.hmset(`user:${email}`, user)

        return {
            success: true,
            user: user
        }
    }
}

interface FbFetchedObject {
    type: string
    id: string
    content: any
    timestamp: number
}

export async function storeFbFetchedObject(type: string, id: string, content: any) {
    try {
        const objectKey = `fbFetchedObject:${type}:${id}`

        // Create the object with current timestamp
        const fetchedObject: FbFetchedObject = {
            type,
            id,
            content,
            timestamp: Date.now()
        }

        await kv.hset(objectKey, fetchedObject as unknown as Record<string, unknown>)

        return {
            success: true
        }
    } catch (error) {
        console.error(`Error storing fetched ${type} ${id}:`, error)
        return {
            error: 'Failed to store fetched object'
        }
    }
}

export async function getFbFetchedObject(type: string, id: string): Promise<{
    success?: boolean;
    data?: Record<string, unknown>;  // Changed this type
    error?: string;
}> {
    try {
        const objectKey = `fbFetchedObject:${type}:${id}`

        // Fetch the object from Redis
        const fetchedObject = await kv.hgetall(objectKey)

        // If no object found, return error
        if (!fetchedObject || Object.keys(fetchedObject).length === 0) {
            return {
                error: 'Object not found'
            }
        }

        return {
            success: true,
            data: fetchedObject
        }
    } catch (error) {
        console.error(`Error fetching ${type} ${id}:`, error)
        return {
            error: 'Failed to fetch object'
        }
    }
}

export async function toggleFeatureFlag(featureToggleName: string, isEnabled: boolean) {
    'use server'
    
    try {
        // Set the feature toggle cookie
        cookies().set(featureToggleName, isEnabled.toString(), {
            path: '/',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
        
        return { success: true }
    } catch (error) {
        console.error('Failed to toggle feature flag:', error)
        return { success: false, error: 'Failed to toggle feature flag' }
    }
}
