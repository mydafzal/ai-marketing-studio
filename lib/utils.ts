import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
export const formatNumberDigit = (value: number) =>
    new Intl.NumberFormat('en-US').format(value)
export const runAsyncFnWithoutBlocking = (
  fn: (...args: any) => Promise<any>
) => {
  fn()
}

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

export const getStringFromBuffer = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

export enum ResultCode {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  InvalidSubmission = 'INVALID_SUBMISSION',
  UserAlreadyExists = 'USER_ALREADY_EXISTS',
  UnknownError = 'UNKNOWN_ERROR',
  UserCreated = 'USER_CREATED',
  UserLoggedIn = 'USER_LOGGED_IN'
}

export const getMessageFromCode = (resultCode: string) => {
  switch (resultCode) {
    case ResultCode.InvalidCredentials:
      return 'Invalid credentials!'
    case ResultCode.InvalidSubmission:
      return 'Invalid submission, please try again!'
    case ResultCode.UserAlreadyExists:
      return 'User already exists, please log in!'
    case ResultCode.UserCreated:
      return 'User created, welcome!'
    case ResultCode.UnknownError:
      return 'Something went wrong, please try again!'
    case ResultCode.UserLoggedIn:
      return 'Logged in!'
  }
}
export const getMimeType = (url: string): string => {
  const urlparts = url.split('.')
  const extension = (urlparts.pop() || '').toLowerCase()

  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  };

  return  extension && mimeTypes[extension] ? mimeTypes[extension] : ''; 
}


export const sanitizeFileNameForUrl = (fileName: string) => {
  let sanitizedFileName = fileName
    .trim()
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  return encodeURIComponent(sanitizedFileName)
}

export const builQueryString = (params: Record<string, any>) => {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          acc.append(key, item)
        })
      } else {
        acc.append(key, value)
      }
      return acc
    }, new URLSearchParams())
  const queryString = new URLSearchParams(filteredParams).toString()
  return `?${queryString}`
}

export async function trackEvent(event: string, user: { email: string; id: string }, properties: Record<string, any> = {}) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/posthog-track`, {
      method: 'POST',
      body: JSON.stringify({
        event,
        user,
        properties
      })
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}