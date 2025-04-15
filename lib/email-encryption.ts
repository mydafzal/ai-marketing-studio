import EmailCrypto from '@/app/email-next-crypto'
import { getConfig } from '@/utils/config'

let cryptoInstance: EmailCrypto | null = null

async function initCrypto(): Promise<EmailCrypto> {
  if (cryptoInstance) return cryptoInstance

  const config = await getConfig()
  const ENCRYPTION_KEY = config.encryptionKey

  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not set')
  }

  cryptoInstance = new EmailCrypto(ENCRYPTION_KEY)
  return cryptoInstance
}

export const encryptEmail = async (email: string): Promise<string> => {
  const crypto = await initCrypto()
  return await crypto.encrypt(email)
}

export const decryptEmail = async (encryptedEmail: string): Promise<string | null> => {
  const crypto = await initCrypto()
  return await crypto.decrypt(encryptedEmail)
}