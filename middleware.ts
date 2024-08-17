import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  const protectedRoutes = ['/feature-toggles', '/feature-toggles/demo', '/admin']

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

  // For all other routes, use NextAuth middleware
  return nextAuthMiddleware(request as any)
}

export default middleware

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}