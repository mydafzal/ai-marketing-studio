class NextCrypto {
    private secret: string;
  
    constructor(secret: string) {
      this.secret = secret;
    }
  
    // Encrypt method
    async encrypt(plain: string): Promise<string> {
      if (!crypto) {
        throw new Error('No WebAPI crypto module found. Do you call me in the right place?');
      }
  
      const iv = crypto.getRandomValues(new Uint8Array(12));
  
      const alg: AesGcmParams = { name: 'AES-GCM', iv };
      const keyHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(this.secret),
      );
  
      const encodedPlaintext = new TextEncoder().encode(plain);
  
      const secretKey = await crypto.subtle.importKey(
        'raw',
        keyHash,
        alg,
        false,
        ['encrypt'],
      );
  
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        secretKey,
        encodedPlaintext,
      );
  
      return `${Buffer.from(ciphertext).toString('base64')};${Buffer.from(iv).toString('base64')}`;
    }
  
    // Decrypt method
    async decrypt(encrypted: string): Promise<string | null> {
      if (!crypto) {
        throw new Error('No WebAPI crypto module found. Do you call me in the right place?');
      }
  
      const [ciphertext, iv] = encrypted.split(';');
  
      if (!ciphertext || !iv) {
        return null;
      }
  
      const alg: AesGcmParams = { name: 'AES-GCM', iv: Buffer.from(iv, 'base64') };
      const keyHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(this.secret),
      );
  
      const secretKey = await crypto.subtle.importKey(
        'raw',
        keyHash,
        alg,
        false,
        ['decrypt'],
      );
  
      try {
        const cleartext = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: Buffer.from(iv, 'base64'),
          },
          secretKey,
          Buffer.from(ciphertext, 'base64'),
        );
  
        return new TextDecoder().decode(cleartext);
      } catch (e) {
        return null;
      }
    }
  }
  
  export default NextCrypto;
  