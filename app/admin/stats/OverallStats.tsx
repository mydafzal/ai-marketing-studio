'use client';
import React, { useState } from 'react';
import { 
    fetchOverallStats, 
    getTotalMessagesCount, 
    getUsersAboveAverageMessages, 
    getUsersAboveAverageChats 
} from '@/app/actions';

const AdminStatsFetcher: React.FC = () => {
    const [totalChats, setTotalChats] = useState<number | null>(null);
    const [uniqueUserCount, setUniqueUserCount] = useState<number | null>(null);
    const [chatToCustomerRatio, setChatToCustomerRatio] = useState<number | null>(null);
    const [totalMessages, setTotalMessages] = useState<number | null>(null);
    const [usersAboveAvgMessages, setUsersAboveAvgMessages] = useState<string[] | null>(null);
    const [usersAboveAvgChats, setUsersAboveAvgChats] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const resetAllData = () => {
        setTotalChats(null);
        setUniqueUserCount(null);
        setChatToCustomerRatio(null);
        setTotalMessages(null);
        setUsersAboveAvgMessages(null);
        setUsersAboveAvgChats(null);
    };

    const fetchTotalChats = async () => {
        setIsLoading(true);
        setError(null);
        resetAllData(); 

        try {
            const response = await fetchOverallStats();
            if ('error' in response) {
                throw new Error(response.error);
            }
            setTotalChats(response.totalChats);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUniqueUsers = async () => {
        setIsLoading(true);
        setError(null);
        resetAllData(); 

        try {
            const response = await fetchOverallStats();
            if ('error' in response) {
                throw new Error(response.error);
            }
            setUniqueUserCount(response.uniqueUserCount);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchChatToCustomerRatio = async () => {
        setIsLoading(true);
        setError(null);
        resetAllData(); 

        try {
            const response = await fetchOverallStats();
            if ('error' in response) {
                throw new Error(response.error);
            }
            setChatToCustomerRatio(response.chatToCustomerRatio);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTotalMessages = async () => {
        setIsLoading(true);
        setError(null);
        resetAllData(); 

        try {
            const messagesCount = await getTotalMessagesCount();
            setTotalMessages(messagesCount);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsersAboveAvgMessages = async () => {
        setIsLoading(true);
        setError(null);
        resetAllData(); 

        try {
            const users = await getUsersAboveAverageMessages();
            setUsersAboveAvgMessages(users);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsersAboveAvgChats = async () => {
        setIsLoading(true);
        setError(null);
        resetAllData(); 

        try {
            const users = await getUsersAboveAverageChats();
            setUsersAboveAvgChats(users);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
            <div className="mb-4">
                <button 
                    onClick={fetchTotalChats} 
                    className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700 mt-2"
                    disabled={isLoading} 
                >
                    Total Chats
                </button>
                
                <button 
                    onClick={fetchUniqueUsers} 
                    className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700 mt-2"
                    disabled={isLoading} 
                >
                    Total Users
                </button>

                <button 
                    onClick={fetchChatToCustomerRatio} 
                    className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700 mt-2"
                    disabled={isLoading} 
                >
                    Chat-to-Customer Ratio
                </button>

                <button 
                    onClick={fetchTotalMessages} 
                    className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700 mt-2"
                    disabled={isLoading} 
                >
                    Total Messages
                </button>

                <button 
                    onClick={fetchUsersAboveAvgMessages} 
                    className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700 mt-2"
                    disabled={isLoading} 
                >
                    Users Above Average (Messages)
                </button>

                <button 
                    onClick={fetchUsersAboveAvgChats} 
                    className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700 mt-2"
                    disabled={isLoading} 
                >
                    Fetch Users Above Average (Chats)
                </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            {isLoading && <p className="text-gray-800 font-semibold">Loading...</p>}

            <div className="mt-4">
                {totalChats !== null && (
                    <div className="bg-gray-100 text-black text-md font-semibold mt-2 p-4 rounded">
                        <p>Chats: {totalChats}</p>
                    </div>
                )}
            </div>

            <div className="mt-4">
                {uniqueUserCount !== null && (
                    <div className="bg-gray-100 text-black text-md font-semibold mt-2 p-4 rounded">
                        <p>Users: {uniqueUserCount}</p>
                    </div>
                )}
            </div>

            <div className="mt-4">
                {chatToCustomerRatio !== null && (
                    <div className="bg-gray-100 text-black text-md font-semibold mt-2 p-4 rounded">
                        <p>Ratio: {chatToCustomerRatio !== null ? chatToCustomerRatio.toFixed(2) : 'N/A'}</p>
                    </div>
                )}
            </div>

            <div className="mt-4">
                {totalMessages !== null && (
                    <div className="bg-gray-100 text-black text-md font-semibold mt-2 p-4 rounded">
                        <p>Messages: {totalMessages}</p>
                    </div>
                )}
            </div>

            <div className="mt-4">
                {usersAboveAvgMessages !== null && usersAboveAvgMessages.length > 0 ? (
                    <div className="bg-gray-100 text-black text-md font-semibold mt-2 p-4 rounded">
                        <p>Users Above Average:</p>
                        <ul>
                            {usersAboveAvgMessages.map(userId => (
                                <li key={userId}>{userId}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    usersAboveAvgMessages !== null && (
                        <p className="text-black text-md font-semibold mt-2">No Customer Attending the Requirements</p>
                    )
                )}
            </div>

            <div className="mt-4">
                {usersAboveAvgChats !== null && usersAboveAvgChats.length > 0 ? (
                    <div className="bg-gray-100 text-black text-md font-semibold mt-2 p-4 rounded">
                        <p>Users Above Average:</p>
                        <ul>
                            {usersAboveAvgChats.map(userId => (
                                <li key={userId}>{userId}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    usersAboveAvgChats !== null && (
                        <p className="text-black text-md font-semibold mt-2">No Customer Attending the Requirements</p>
                    )
                )}
            </div>
        </div>
    );
};

export default AdminStatsFetcher;
