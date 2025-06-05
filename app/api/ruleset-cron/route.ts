import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Sample endpoint URL - replace with actual endpoint
    const endpoint = 'https://api.example.com/ruleset-execution'
    
    // Make the API call to the external endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_TOKEN}`
      },
      // Sample request body - replace with actual required data
      body: JSON.stringify({
        execution_time: new Date().toISOString(),
        source: 'scheduled-cron'
      })
    })

    // Handle the response
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Ruleset execution triggered successfully',
      data
    })

  } catch (error) {
    console.error('Error executing ruleset cron job:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to execute ruleset' 
      },
      { status: 500 }
    )
  }
}

// Optional GET method to check the endpoint status
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Ruleset cron endpoint is operational'
  })
}