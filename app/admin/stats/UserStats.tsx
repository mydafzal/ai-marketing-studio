'use client';
import React, { useState } from 'react';
import { getChats } from '@/app/actions';

interface UserStats {
    Id: string;
    chats: number;
    messagesPerChat: Record<string, number>;
    timeSpentPerSession: string[];
}

const UserStatsFetcher: React.FC = () => {
    const [userId, setUserId] = useState<string>('');
    const [chatId, setChatId] = useState<string>(''); 
    const [userData, setUserData] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [messagesCount, setMessagesCount] = useState<number | null>(null); 
    const [timeSpent, setTimeSpent] = useState<string | null>(null); 

    const fetchUserStats = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const chats = await getChats(userId);
            const totalChats = chats.length;

            setMessagesCount(null);
            setTimeSpent(null);

            setUserData({
                Id: userId,
                chats: totalChats,
                messagesPerChat: {}, 
                timeSpentPerSession: [], 
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessagesCount = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const chats = await getChats(userId);
            const chat = chats.find(chat => chat.id === chatId);
            if (chat) {
                const messagesCount = chat.messages?.length || 0; 
                setMessagesCount(messagesCount);

                if (chat.messages && chat.messages.length > 0) {
                    const timestamps = chat.messages.map(msg => new Date(msg.timestamp).getTime()).sort((a, b) => a - b);
                    const firstTimestamp = timestamps[0];
                    const lastTimestamp = timestamps[timestamps.length - 1];

                    const timeDifference = lastTimestamp - firstTimestamp; 
                    const totalSeconds = Math.floor(timeDifference / 1000);
                    
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;

                    const formattedTime = `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}m${String(seconds).padStart(2, '0')}s`;
                    setTimeSpent(formattedTime);
                } else {
                    setTimeSpent('00h00m00s');
                }
            } else {
                setMessagesCount(0); 
                setTimeSpent('00h00m00s');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
            <form onSubmit={fetchUserStats}>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="User ID"
                        value={userId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
                        className="w-full px-3 py-2 border rounded mt-1"
                        required
                    />
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <button
                    type="submit"
                    className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700"
                    disabled={isLoading}
                >
                    {isLoading ? 'Fetching...' : 'Fetch'}
                </button>
            </form>

            {isLoading && <p>Loading...</p>}

            {userData ? (
                <div className="mt-4">
                    <div className="bg-gray-100 text-black text-md mt-2 p-4 rounded">
                        <p className="font-semibold">Chats: {userData.chats}</p>
                        <h4 className="font-semibold">Details:</h4>
                        <form onSubmit={fetchMessagesCount} className="flex mb-4 w-full mt-2">
                            <div className="flex w-full">
                                <input
                                    type="text"
                                    placeholder="Chat ID"
                                    value={chatId}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatId(e.target.value)}
                                    className="flex-grow px-3 py-2 border rounded-l text-white"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-black text-white rounded-r"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Fetching...' : 'Fetch'}
                            </button>
                        </form>
                        {messagesCount !== null && (
                            <p className="font-semibold">Chat length: {messagesCount} messages</p>
                        )}
                        {timeSpent !== null && (
                            <p className="font-semibold">Time Spent: {timeSpent}</p>
                        )}
                    </div>
                </div>
            ) : (
                !isLoading || <p className="font-semibold">No user data available.</p>
            )}
        </div>
    );
};

export default UserStatsFetcher;