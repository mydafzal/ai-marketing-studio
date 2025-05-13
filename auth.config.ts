import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    newUser: '/signup'
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.startsWith('/login')
      const isOnSignupPage = nextUrl.pathname.startsWith('/signup')
      const isOnAIContentPage = nextUrl.pathname.startsWith('/ai-content')

      // If user is logged in and trying to access login/signup pages, redirect to home
      if (isLoggedIn) {
        if (isOnLoginPage || isOnSignupPage) {
          return Response.redirect(new URL('/', nextUrl))
        }
        return true
      }

      // If user is not logged in and trying to access AI Content page, redirect to login
      if (!isLoggedIn && isOnAIContentPage) {
        return Response.redirect(new URL('/login', nextUrl))
      }

      // For other public routes, allow access
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token = { ...token, id: user.id }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        const { id } = token as { id: string }
        const { user } = session

        session = { ...session, user: { ...user, id } }
      }

      return session
    }
  },
  providers: [],
} satisfies NextAuthConfig
