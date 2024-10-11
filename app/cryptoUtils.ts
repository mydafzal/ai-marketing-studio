import NextCrypto from 'next-crypto';

if (!process.env.ENCRYPTION_KEY) {
    throw new Error('Encryption key is not set');
}

const crypto = new NextCrypto(process.env.ENCRYPTION_KEY);

const encryptToken = async (token: string) => {
    return await crypto.encrypt(token);
}

const decryptToken = async (encryptedToken: string) => {
    return await crypto.decrypt(encryptedToken);
}

export  { encryptToken, decryptToken };

// TODO: Impact (HIGH): next-crypto is not well  maintained. Consider replacing it with a more reliable library.