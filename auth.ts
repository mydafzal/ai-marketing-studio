import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { z } from 'zod'
import { getStringFromBuffer } from './lib/utils'
import { getUser } from './app/login/actions'
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
            login_type:z.string().optional()
          })
          .safeParse(credentials)
        
          console.log(parsedCredentials, parsedCredentials.success)

        if (parsedCredentials.success) {
          const { email, password, login_type } = parsedCredentials.data
          const user = await getUser(email)
          console.log("User extracted from db", user)

          if (!user) return null

          if (login_type && login_type=="facebook"){
            return user
          } 

          const encoder = new TextEncoder()
          const saltedPassword = encoder.encode(password + user.salt)
          const hashedPasswordBuffer = await crypto.subtle.digest(
            'SHA-256',
            saltedPassword
          )
          const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

          if (hashedPassword === user.password) {
            return user
          } else {
            return null
          }
        }

        return null
      }
    })
  ]
})
