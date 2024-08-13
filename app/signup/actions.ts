'use server'

import { signIn } from '@/auth'
import { ResultCode, getStringFromBuffer } from '@/lib/utils'
import { z } from 'zod'
import { kv } from '@vercel/kv'
import { getUser } from '../login/actions'
import { AuthError } from 'next-auth'
import prisma from '@/lib/db'
import { isFeatureToggleEnabled } from '@/lib/helpers/feature-toggle/feature-toggle-manager'
import { Prisma } from '@prisma/client'

export async function createUser(
  email: string,
  hashedPassword: string,
  salt: string
) {
  if (isFeatureToggleEnabled('postgressDBToggle')) {
    try {
      const existingUser = await getUser(email)
      if (!existingUser) {
        await prisma.users.create({
          data: {
            id: crypto.randomUUID(),
            email,
            password: hashedPassword,
            salt,
          },
        });
        return {
          type: 'success',
          resultCode: ResultCode.UserCreated
        }
      } else {
        return {
          type: 'error',
          resultCode: ResultCode.UserAlreadyExists
        }
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return {
            type: 'error',
            resultCode: ResultCode.UserAlreadyExists
          }
        } else {
          return {
            type: 'error',
            resultCode: ResultCode.UnknownError
          }
        }
      } else {
        return {
          type: 'error',
          resultCode: ResultCode.UnknownError
        }
      }
    }
  } else {
    const existingUser = await getUser(email)
  
    if (existingUser) {
      return {
        type: 'error',
        resultCode: ResultCode.UserAlreadyExists
      }
    } else {
      const user = {
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        salt
      }
  
      await kv.hmset(`user:${email}`, user)
  
      return {
        type: 'success',
        resultCode: ResultCode.UserCreated
      }
    }
  }
}

interface Result {
  type: string
  resultCode: ResultCode
}

export async function signup(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const parsedCredentials = z
    .object({
      email: z.string().email(),
      password: z.string().min(6)
    })
    .safeParse({
      email,
      password
    })

  if (parsedCredentials.success) {
    try {
      if (isFeatureToggleEnabled('postgressDBToggle')) {
        const salt = crypto.randomUUID()

        const encoder = new TextEncoder()
        const saltedPassword = encoder.encode(password + salt)
        const hashedPasswordBuffer = await crypto.subtle.digest(
          'SHA-256',
          saltedPassword
        )
        const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

        const result = await createUser(email, hashedPassword, salt)

        if (result.resultCode === ResultCode.UserCreated) {
          await signIn('credentials', {
            email,
            password,
            redirect: false
          })
        }
        return result
      } else {
        const salt = crypto.randomUUID()

        const encoder = new TextEncoder()
        const saltedPassword = encoder.encode(password + salt)
        const hashedPasswordBuffer = await crypto.subtle.digest(
          'SHA-256',
          saltedPassword
        )
        const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

        const result = await createUser(email, hashedPassword, salt)
  
        if (result.resultCode === ResultCode.UserCreated) {
          await signIn('credentials', {
            email,
            password,
            redirect: false
          })
        }
        return result
      }
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return {
              type: 'error',
              resultCode: ResultCode.InvalidCredentials
            }
          default:
            return {
              type: 'error',
              resultCode: ResultCode.UnknownError
            }
        }
      } else {
        return {
          type: 'error',
          resultCode: ResultCode.UnknownError
        }
      }
    }
  } else {
    return {
      type: 'error',
      resultCode: ResultCode.InvalidCredentials
    }
  }
}
