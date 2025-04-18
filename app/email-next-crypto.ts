class EmailCrypto {
    // this is deterministic encryption. same value will always result in same hash.
    // this is for posthog only

    private secret: string
  
    constructor(secret: string) {
      this.secret = secret
    }
  
    private getFixedIV(): Uint8Array {
      return new Uint8Array(12) // All 0s — 96-bit IV required for AES-GCM
    }
  
    // Encrypt method
    async encrypt(plain: string): Promise<string> {
      if (!crypto) {
        throw new Error('No WebAPI crypto module found. Are you in the right place?')
      }
  
      const iv = this.getFixedIV()
  
      const keyHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(this.secret)
      )
  
      const alg: AesGcmParams = { name: 'AES-GCM', iv }
  
      const encodedPlaintext = new TextEncoder().encode(plain)
  
      const secretKey = await crypto.subtle.importKey(
        'raw',
        keyHash,
        alg,
        false,
        ['encrypt']
      )
  
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        secretKey,
        encodedPlaintext
      )
  
      return btoa(String.fromCharCode(...Array.from(new Uint8Array(ciphertext))))
    }
  
    // Decrypt method
    async decrypt(cipher: string): Promise<string | null> {
      try {
        const iv = this.getFixedIV()
  
        const keyHash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(this.secret)
        )
  
        const alg: AesGcmParams = { name: 'AES-GCM', iv }
  
        const secretKey = await crypto.subtle.importKey(
          'raw',
          keyHash,
          alg,
          false,
          ['decrypt']
        )
  
        const encryptedData = Uint8Array.from(atob(cipher), c => c.charCodeAt(0))
  
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv
          },
          secretKey,
          encryptedData
        )
  
        return new TextDecoder().decode(decrypted)
      } catch (err) {
        console.error('Failed to decrypt:', err)
        return null
      }
    }
  }
  
  export default EmailCrypto
  