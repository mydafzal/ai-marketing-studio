'use client';

import { useState } from 'react';
import { decryptEmail } from '@/lib/email-encryption';

export default function PosthogDecrypter() {
    const [encryptedId, setEncryptedId] = useState('');
    const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDecrypt = async () => {
        if (!encryptedId.trim()) {
            setError('Please enter an encrypted ID');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const decrypted = await decryptEmail(encryptedId);
            setDecryptedValue(decrypted);
        } catch (err) {
            setError('Failed to decrypt. Make sure the input is valid.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-4">
                <label htmlFor="encryptedId" className="block text-sm font-medium text-gray-700 mb-1">
                    Encrypted PostHog ID
                </label>
                <input
                    id="encryptedId"
                    type="text"
                    value={encryptedId}
                    onChange={(e) => setEncryptedId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter encrypted ID..."
                />
            </div>

            <button
                onClick={handleDecrypt}
                disabled={isLoading}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition duration-150 ease-in-out disabled:opacity-50"
            >
                {isLoading ? 'Decrypting...' : 'Decrypt ID'}
            </button>

            {error && <div className="mt-4 text-red-500">{error}</div>}

            {decryptedValue !== null && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Decrypted Value:</h3>
                    <div className="p-4 bg-gray-800 text-white rounded-md overflow-x-auto">
                        <code>{decryptedValue}</code>
                    </div>
                </div>
            )}
        </div>
    );
}