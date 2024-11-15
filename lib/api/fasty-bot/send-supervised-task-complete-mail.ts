import { getUserDetail } from '@/app/actions'
import { getFbMarketingApiKey } from '@/app/actions';


async function sendSupervisedTaskMailToUser(
    task_name: string, 
    comment: string,
    status: string,
    chat_link:string,
    user_email:string

): Promise<boolean | any> {
    try {
        const fastyEndpoint = process.env.FASTY_API_URL;
        const apiUrl = `${fastyEndpoint}/misc/send-supervised-task-update/user`;

        const token_resp = await getFbMarketingApiKey()
        let token=""
        if(token_resp.success && token_resp.token){
            token=token_resp.token
        }

        // Make the direct API call
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
            'fb-api-key': token,
            'x-api-key': `${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            task_name: task_name,
            comment: comment,
            status: status,
            chat_link:chat_link,
            user_email:user_email
        })
        })

        // Parse the response
        const responseData = await response.json();

        // Handle the response
        if (!response.ok) {
            console.error('Error in sending email:', {
                status: response.status,
                statusText: response.statusText,
                body: JSON.stringify(responseData)
            });
            return false;
        }

        // Check for success in the result
        if (responseData.result && responseData.result.success === true) {
            console.log('Successfully sent mail:', responseData);
            return responseData;
        } else {
            console.error('Unexpected response format:', responseData);
            return false;
        }
    } catch (error) {
        console.error('Error send mail:', JSON.stringify(error));
        return false;
    }
}

export {sendSupervisedTaskMailToUser};