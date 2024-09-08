import { NextResponse } from 'next/server';
import { Message } from '../../../../lib/types'; 

export async function POST(request: Request) {
    try {
        const { content, role } = await request.json();

        if (!content || !role) {
            return NextResponse.json({ error: 'Content and role are required' }, { status: 400 });
        }

        const timestamp: string = new Date().toISOString();

        console.log('New message timestamp:', timestamp);

        const newMessage: Message = {
            id: generateUniqueId(),
            role, 
            content,   
            timestamp: new Date().toISOString(),
        };

        console.log('New Message:', newMessage);

        const kvEndpoint = process.env.KV_API_URL; 
        const response = await fetch(`${kvEndpoint}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.KV_API_TOKEN}`, 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newMessage),
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return NextResponse.json({ error: `Failed to log message: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error logging message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function generateUniqueId() {
    return 'msg-' + Math.random().toString(36).substr(2, 9);
}
