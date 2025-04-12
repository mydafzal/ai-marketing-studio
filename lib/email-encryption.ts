import EmailCrypto from '@/app/email-next-crypto'
 
 const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY
 if (!ENCRYPTION_KEY) {
     throw new Error('ENCRYPTION_KEY is not set')
 }
 
 const crypto = new EmailCrypto(ENCRYPTION_KEY)
 
 export const encryptEmail = async (email: string): Promise<string> => {
     const encrypted = await crypto.encrypt(email)
     return encrypted
 }
 
 export const decryptEmail = async (encryptedEmail: string): Promise<string | null> => {
     const decrypted = await crypto.decrypt(encryptedEmail)
     return decrypted
 }