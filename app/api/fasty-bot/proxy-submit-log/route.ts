import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        // Parse the request body as JSON
        const { timestamp, event, message } = await request.json();

        // Check if required parameters are provided
        if (!timestamp || !event || !message) {
            return NextResponse.json({ error: 'Timestamp, event, and message are required' }, { status: 400 });
        }

        // Construct the API endpoint URL
        const fastyEndpoint = process.env.FASTY_API_URL;
        const apiUrl = `${fastyEndpoint}/external-logs/post-drain-log`;

        // Make a POST request to the Fasty API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ timestamp, event, message })
        });

        // Check if the response is successful
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return NextResponse.json({ error: `Failed to submit log: ${response.statusText}` }, { status: response.status });
        }

        // Return the response from the Fasty API
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error submitting log data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
