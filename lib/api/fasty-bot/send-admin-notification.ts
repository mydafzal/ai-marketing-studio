import {auth} from '@/auth'

export async function sendAdminNotification(chatId?: string): Promise<any> {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'User not authenticated'
        }
    }
    const apiUrl = `https://hooks.zapier.com/hooks/catch/14599124/2ho17b8/`
    try {
        // Make the direct API call
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                results: [
                    {
                        email: session.user.email,
                        message: `https://ai-marketing-manager.vercel.app/share/${chatId}`
                    }
                ]
            })
        })
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`)
            return {
                error: `HTTP error! status: ${response.status}`
            }
        }

        return true
    } catch (error) {
        return {
            error: `Error send admin notificationx: ${error}`
        }
    }
}
