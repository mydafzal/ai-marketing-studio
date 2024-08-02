import {getBaseUrl} from "@/lib/helpers/vercel/get-base-url";

export function submitLog(event: string, message: string): void {
    const logData = {
        timestamp: new Date().toISOString(),
        event,
        message,
    };

    // Get the base URL using the utility function
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/fasty-bot/proxy-submit-log`;

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to submit log: ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            handleSuccess(data);
        })
        .catch((error) => {
            handleError(error);
        });
}

function handleSuccess(data: any): void {
    console.log('Log submitted successfully:', data);
}

function handleError(error: Error): void {
    console.error('An error occurred while submitting the log:', error.message);
}
