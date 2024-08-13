import { CoreMessage } from 'ai'

export type Message = CoreMessage & {
  id: string
  chatId?: string
  userId?: string
  createdAt?: Date
  updatedAt?: Date
  discardedAt?: Date | null
}

export interface Chat extends Record<string, any> {
  id: string
  userId: string
  title: string
  path: string
  campaignId?: string | null
  messages?: Message[]
  sharePath?: string | null
  createdAt: Date
  updatedAt: Date
  discardedAt?: Date | null
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
  createdAt: Date
  updatedAt: Date
  discardedAt: Date | null
}
