import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Parse the request body as JSON
        const { email, message, suggestions } = await request.json();

        // Check if required parameters are provided
        if (!email || !message) {
            return NextResponse.json({ error: 'Email and message are required' }, { status: 400 });
        }

        // Construct the Zapier endpoint URL
        const zapierEndpoint = 'https://hooks.zapier.com/hooks/catch/14599124/2horjq2/';

        // Make a POST request to the Zapier endpoint
        const response = await fetch(zapierEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                results: [
                    {
                        email,
                        message,
                        suggestions
                    }
                ]
            })
        });

        // Check if the response is successful
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return NextResponse.json({ error: `Failed to submit data: ${response.statusText}` }, { status: response.status });
        }

        // Return the response from the Zapier endpoint
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error submitting data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
