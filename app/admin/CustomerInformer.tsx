'use client';
import React, { useState } from 'react';

const CustomerInformer: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [suggestions, setSuggestions] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleInform = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !message) {
            setError('Email and message are required.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('/api/admin/inform-client/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, message, suggestions }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to inform client');
            }

            setSuccessMessage('Client informed successfully');
            // Clear fields if needed
            setEmail('');
            setMessage('');
            setSuggestions('');
        } catch (err) {
            console.error('Error informing client:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
            <form onSubmit={handleInform}>
                <div className="mb-4">
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter customer email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded mt-1"
                        required
                    />
                </div>

                <div className="mb-4">
                    <textarea
                        id="message"
                        placeholder="Enter updates for the client"
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border rounded mt-1"
                        rows={4}
                        required
                    />
                </div>

                <div className="mb-4">
                    <textarea
                        id="suggestions"
                        placeholder="Enter suggestions for next week (optional)"
                        value={suggestions}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSuggestions(e.target.value)}
                        className="w-full px-3 py-2 border rounded mt-1"
                        rows={4}
                    />
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {successMessage && <p className="text-green-500 mb-4">{successMessage}</p>}

                <button
                    type="submit"
                    className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700"
                    disabled={isLoading}
                >
                    {isLoading ? 'Informing...' : 'Inform Client'}
                </button>
            </form>
        </div>
    );
};

export default CustomerInformer;
