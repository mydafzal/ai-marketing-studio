import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { User } from '@/lib/types'
import { auth } from '@/auth'

export async function GET() {
    try {
        // Check authentication
        const session = await auth()
        
        if (!session || !session.user) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 })
        }
        
        // Get all user keys from KV
        const keys = await kv.keys('user:*')
        const users: any[] = []
        
        // Calculate one month ago
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        
        // Process each user
        for (const key of keys) {
            try {
                const user = await kv.hgetall<User>(key)
                
                if (user && user.email) {
                    // Skip users that don't have created_at field
                    if (!user.created_at) {
                        console.log(`User ${user.email} has no created_at field, skipping`)
                        continue
                    }
                    
                    // Parse the created_at date, with error handling
                    let createdAt: Date
                    try {
                        createdAt = new Date(user.created_at)
                        // Check if date is valid
                        if (isNaN(createdAt.getTime())) {
                            console.log(`User ${user.email} has invalid created_at date: ${user.created_at}, skipping`)
                            continue
                        }
                    } catch (dateError) {
                        console.log(`Error parsing date for user ${user.email}: ${dateError}`)
                        continue
                    }
                    
                    const isFromLastMonth = createdAt >= oneMonthAgo
                    const isNotActiveOrTrialing = user.sub_status !== 'active' && user.sub_status !== 'trialing'
                    
                    if (isFromLastMonth && isNotActiveOrTrialing) {
                        users.push({
                            email: user.email,
                            created_at: user.created_at,
                            subscription_status: user.sub_status || 'none'
                        })
                    }
                }
            } catch (userError) {
                console.error(`Error processing user with key ${key}:`, userError)
                continue
            }
        }
        
        return NextResponse.json({
            success: true,
            data: users
        })
    } catch (error) {
        console.error('Error fetching inactive users:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 })
    }
}