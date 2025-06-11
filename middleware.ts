import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { subscriptionBypassList } from './app/subscription/subscription-bypass-list'

const nextAuthMiddleware = NextAuth(authConfig).auth

function basicAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const auth = authHeader.split(' ')[1]
    const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':')

    const [expectedUser, expectedPwd] = process.env.FEATURE_TOGGLE_CREDS?.split(':') || []

    if (user === expectedUser && pwd === expectedPwd) {
      return true
    }
  }

  return false
}

async function middleware(request: NextRequest) {
  const protectedRoutes = ['/supervised','/feature-toggles', '/feature-toggles/demo', '/admin']
  const subscriptionRequiredRoutes = ['/chat', '/ai-content']

  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    if (basicAuth(request)) {
      return NextResponse.next()
    }

    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected Area"',
      },
    })
  }

  // Check subscription for specific routes
  if (subscriptionRequiredRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    const response = await nextAuthMiddleware(request as any)
    
    // If the user is authenticated, check their subscription status
    if (response !== Response.redirect(new URL('/login', request.nextUrl))) {
      const session = await (response as any).session
      const userEmail = session?.user?.email
      
      // Allow access if user is in the bypass list
      if (userEmail && subscriptionBypassList.includes(userEmail)) {
        return NextResponse.next()
      }
      
      // Check if user has an active subscription from cookies
      const hasSubscription = request.cookies.get('hasActiveSubscription')?.value === 'true'
      
      if (!hasSubscription) {
        return NextResponse.redirect(new URL('/subscription', request.nextUrl))
      }
    }
  }

  // For all other routes, use NextAuth middleware
  return nextAuthMiddleware(request as any)
}

export default middleware

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}