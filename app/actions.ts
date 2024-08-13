'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { Message, type Chat } from '@/lib/types'
import { isFeatureToggleEnabled } from '@/lib/helpers/feature-toggle/feature-toggle-manager'
import prisma from '@/lib/db'
import { canParse } from '@/lib/utils'

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    if (isFeatureToggleEnabled("postgressDBToggle")) {
      const chats = await prisma.chats.findMany({
        where: {
          userId,
          AND:{
            discardedAt: null
          }
        }
      })
      const chatsNew: Chat[] = []
      if (chats) {
        for (let index = 0; index < chats?.length; index++) {
          const chat: Chat = chats[index];
          const messages = await prisma.messages.findMany({
            where: {
              chatId: chat.id,
              AND: {
                userId,
                discardedAt: null
              }
            }
          })
          const typedMessages: Message[] = messages.map((message,index) => {
            const newMessage:Message = {
              id: message.id,
              role: message.role as "user" | "system" | "assistant" | "tool",
              content: canParse(message.content),
              chatId: message.chatId,
              userId: message.userId,
              createdAt: message.createdAt,
              updatedAt: message.updatedAt,
              discardedAt: message.discardedAt || undefined
            }
            return newMessage
          });
          chat.messages = typedMessages
          chatsNew.push(chat)
        }
      }
      return chatsNew
    } else {
      const pipeline = kv.pipeline()
      const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
        rev: true
      })
  
      for (const chat of chats) {
        pipeline.hgetall(chat)
      }
  
      const results = await pipeline.exec()
  
      return results as Chat[]
    }
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  if (isFeatureToggleEnabled("postgressDBToggle")) {
    const chat:Chat|null = await prisma.chats.findUnique({
      where: {
        id,
        AND: {
          userId,
          discardedAt: null,
        },
      }
    })
    if (chat) {
      const messages = await prisma.messages.findMany({
        where: {
          chatId: chat.id,
          AND: {
            userId,
            discardedAt: null,
          }
        }
      })
      if (messages) {
        chat.messages = []
        for (let index = 0; index < messages?.length; index++) {
          const oldMessage = messages[index];
          const newMessage:Message = {
            id: oldMessage.id,
            role: oldMessage.role as "user" | "system" | "assistant" | "tool",
            content: canParse(oldMessage.content),
            chatId: oldMessage.chatId,
            userId: oldMessage.userId,
            createdAt: oldMessage.createdAt,
            updatedAt: oldMessage.updatedAt,
            discardedAt: oldMessage.discardedAt || undefined
          }
          chat.messages.push(newMessage)
        }
      } else {
        chat.messages = []
      }
      return chat
    }
    return null
  } else {
    const chat = await kv.hgetall<Chat>(`chat:${id}`)
  
    if (!chat || (userId && chat.userId !== userId)) {
      return null
    }
  
    return chat
  }
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  if (isFeatureToggleEnabled("postgressDBToggle")) {
    try {
      await prisma.chats.update({
        where: {
          id,
          userId:session.user?.id,
        },
        data:{
          discardedAt: new Date()
        }
      })
      revalidatePath('/')
      return revalidatePath(path)
    } catch (error) {
      return {
        error: 'Unauthorized'
      }
    }
  } else {
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

}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  if (isFeatureToggleEnabled("postgressDBToggle")) {
    try {
      await prisma.chats.updateMany({
        where: {
          userId: session.user?.id,
        },
        data:{
          discardedAt: new Date()
        }
      })
      revalidatePath('/')
      return redirect('/')
    } catch (error) {
      return {
        error: 'Unauthorized'
      }
    }
  } else {
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

}

export async function getSharedChat(id: string) {
  if (isFeatureToggleEnabled("postgressDBToggle")) {
    try {
      const chat: Chat|null = await prisma.chats.findFirst({
        where: {
          id,
        }
      })
      
      if (!chat || !chat.sharePath) {
        return null
      }
    
      return chat
    } catch (error) {
      return null
    }
  } else {
    const chat = await kv.hgetall<Chat>(`chat:${id}`)
  
    if (!chat || !chat.sharePath) {
      return null
    }
  
    return chat
  }
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  if (isFeatureToggleEnabled("postgressDBToggle")) {
    try {
      const chat = await prisma.chats.update({
        where: {
          id,
          userId: session.user?.id,
        },
        data:{
          sharePath: `/share/${id}`
        }
      })

      const payload = {
        ...chat,
        sharePath: `/share/${chat.id}`
      }
      console.log('payload', payload)

      return payload
    } catch (error) {
      return {
        error: 'Something went wrong'
      }
    }
  } else {
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
}

export async function saveMessage(chat: Chat) {
  chat?.messages?.forEach(async (oldMessage: Message) => {
    const messageDB = await prisma.messages.findUnique({
      where: {
        id: oldMessage.id,
      }
    })
    if (!messageDB) {
      await prisma.messages.create({
        data:{
          id: oldMessage.id,
          chatId: chat.id,
          userId: chat.userId,
          role: oldMessage.role,
          content: typeof oldMessage.content === 'string' ? oldMessage.content : JSON.stringify(oldMessage.content),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }
  });
}

export async function saveChat(chat: Chat) {
  const session = await auth()

  if (session && session.user) {
    if (isFeatureToggleEnabled('postgressDBToggle')) {
      try {
        const chatExist = await prisma.chats.findUnique({
          where:{
            id: chat.id,
            AND: {
              discardedAt: null,
            }
          }
        })
        if (chatExist) {
          saveMessage(chat)
        } else {
          await prisma.chats.create({
            data: {
              id: chat.id,
              userId: session.user.id,
              title: chat.title,
              path: chat.path,
              createdAt: chat.createdAt,
              updatedAt: chat.updatedAt,
            },
          });
          saveMessage(chat)
        }
      } catch (error) {
        console.log('error', error)
        return
      }
    } else {
      const pipeline = kv.pipeline()
      pipeline.hmset(`chat:${chat.id}`, chat)
      pipeline.zadd(`user:chat:${chat.userId}`, {
        score: Date.now(),
        member: `chat:${chat.id}`
      })
      await pipeline.exec()
    }
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
