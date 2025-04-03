import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint that proxies requests to the Browser Use API
 * Supports:
 * - POST /api/browser-use/run-task (creates new task)
 * - GET /api/browser-use/task/:id (gets task status)
 * - PUT /api/browser-use/stop-task?task_id=:id (stops task)
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.BROWSER_USE || ''
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Browser Use API key not configured' },
        { status: 500 }
      )
    }
    
    const body = await req.json()
    
    // Make request to Browser Use API
    const response = await fetch('https://api.browser-use.com/api/v1/run-task', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: body.task,
        save_browser_data: body.save_browser_data || false,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Browser Use API error: ${errorText}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error in browser-use API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create browser task' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.BROWSER_USE || ''
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Browser Use API key not configured' },
        { status: 500 }
      )
    }
    
    const url = new URL(req.url)
    const taskId = url.searchParams.get('task_id')
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id parameter is required' },
        { status: 400 }
      )
    }
    
    // Make request to Browser Use API
    const response = await fetch(`https://api.browser-use.com/api/v1/task/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Browser Use API error: ${errorText}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error in browser-use API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get browser task' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const apiKey = process.env.BROWSER_USE || ''
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Browser Use API key not configured' },
        { status: 500 }
      )
    }
    
    const url = new URL(req.url)
    const taskId = url.searchParams.get('task_id')
    const action = url.searchParams.get('action') || 'stop'
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id parameter is required' },
        { status: 400 }
      )
    }
    
    // Determine the endpoint based on the action
    let endpoint = 'stop-task'
    if (action === 'pause') {
      endpoint = 'pause-task'
    } else if (action === 'resume') {
      endpoint = 'resume-task'
    }
    
    // Make request to Browser Use API
    const response = await fetch(`https://api.browser-use.com/api/v1/${endpoint}?task_id=${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Browser Use API error: ${errorText}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error in browser-use API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update browser task' },
      { status: 500 }
    )
  }
}