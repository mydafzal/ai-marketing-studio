'use client';

import { useState, useEffect } from 'react';
import NextCrypto from '@/app/next-crypto';

export default function TokenEncrypter() {
  const [token, setToken] = useState('');
  const [encryptedToken, setEncryptedToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  useEffect(() => {
    // Fetch encryption key from config API
    const fetchEncryptionKey = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        if (data.encryptionKey) {
          setEncryptionKey(data.encryptionKey);
        } else {
          setError('Encryption key not found in server config');
        }
      } catch (err) {
        setError('Error fetching encryption key: ' + (err instanceof Error ? err.message : String(err)));
      }
    };

    fetchEncryptionKey();
  }, []);

  const handleEncrypt = async () => {
    if (!token.trim()) {
      setError('Please enter a token to encrypt');
      return;
    }

    if (!encryptionKey) {
      setError('Encryption key not available');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Create crypto instance with the fetched key
      const crypto = new NextCrypto(encryptionKey);
      const encrypted = await crypto.encrypt(token);
      
      setEncryptedToken(encrypted);
    } catch (err) {
      setError('Error encrypting token: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <label htmlFor="tokenInput" className="block text-sm font-medium text-gray-700 mb-2">
          Facebook Access Token
        </label>
        <input
          id="tokenInput"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          placeholder="Enter token to encrypt"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      <button
        onClick={handleEncrypt}
        disabled={isLoading}
        className="w-full text-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition duration-150 ease-in-out disabled:bg-gray-400"
      >
        {isLoading ? 'Encrypting...' : 'Encrypt Token'}
      </button>

      {error && (
        <div className="mt-4 text-red-500 text-sm">
          {error}
        </div>
      )}

      {encryptedToken && (
        <div className="mt-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Encrypted Token:</h3>
          <div className="bg-dark-bg p-3 rounded border border-gray-200 break-all">
            {encryptedToken}
          </div>
        </div>
      )}
    </div>
  );
}