import axios from 'axios'

interface EmailParams {
  to: string
  subject: string
  text: string
}

export async function sendEmail({ to, subject, text }: EmailParams) {
  try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY
    const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email'

    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: 'Reeply AI', email: 'contact@reeply.ai' },
        to: [{ email: to }],
        subject,
        htmlContent: text
      },
      {
        headers: {
          accept: 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    )

    return { success: true, data: response.data }
  } catch (error) {
    throw error
  }
} 