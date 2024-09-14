'use client'
import React, {useState} from 'react';

interface Customer {
    email: string;
    fbAccountId?: string | null;
}

const CustomerSearch: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [fbAccountId, setFbAccountId] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchClients = async (email: string = '') => {
        setIsLoading(true);
        setError(null);
        try {
            const url = `/api/admin/fetch-client-by-email?email=${encodeURIComponent(email)}`;
            console.log('Sending request to URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', response.status);
            console.log('Response status text:', response.statusText);

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.error || `Failed to fetch clients: ${response.status} ${response.statusText}`);
            }

            if (data.success) {
                let customers: Customer[] = [];
                if (Array.isArray(data.data)) {
                    customers = data.data.map((customer: any) => ({
                        email: customer.email,
                        fbAccountId: customer.fbAccountId
                    }));
                } else if (data.data && typeof data.data === 'object') {
                    customers = [data.data];
                }
                setSearchResults(customers);
                if (customers.length === 0) {
                    setError('No results found');
                } else {
                    setError(null);
                }
            } else {
                setSearchResults([]);
                setError(data.error || 'No results found');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : String(err));
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/fetch-all-clients', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', response.status);
            console.log('Response status text:', response.statusText);

            const responseText = await response.text();
            console.log('Raw response text:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Invalid JSON response from server');
            }

            console.log('Parsed data:', data);

            if (!response.ok) {
                throw new Error(data.error || `Failed to fetch all clients: ${response.status} ${response.statusText}`);
            }

            if (data.success && Array.isArray(data.data)) {
                const customers: Customer[] = data.data.map((client: any) => ({
                    email: client.email,
                    fbAccountId: client.fbAccountId
                }));
                setSearchResults(customers);
                if (customers.length === 0) {
                    setError('No clients found');
                } else {
                    setError(null);
                }
            } else {
                setSearchResults([]);
                setError(data.error || 'Failed to fetch clients');
            }
        } catch (err) {
            console.error('Fetch all clients error:', err);
            setError(err instanceof Error ? err.message : String(err));
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };
    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await fetchClients(searchQuery);
        setSelectedCustomer(null);
        setFbAccountId('');
    };

    const handleViewAll = async () => {
        await fetchAllUsers();
        setSelectedCustomer(null);
        setFbAccountId('');
        setSearchQuery(''); // New line
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (!selectedCustomer) {
            setError('Please select a customer first');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/update-fb-account-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email: selectedCustomer.email, accountId: fbAccountId}),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update Account ID');
            }

            setSuccessMessage('Account ID updated successfully');

            // Update the selected customer and search results with the new account ID
            setSelectedCustomer({...selectedCustomer, fbAccountId: fbAccountId});
            setSearchResults(prevResults =>
                prevResults.map(customer =>
                    customer.email === selectedCustomer.email
                        ? {...customer, fbAccountId: fbAccountId}
                        : customer
                )
            );
        } catch (err) {
            console.error('Error updating Account ID:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFbAccountId(customer.fbAccountId ?? '');
        setSearchQuery(customer.email); // New line
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
            <div>
                <form onSubmit={handleSearch} className="mb-4">
                    <div className="flex mb-2">
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="flex-grow px-3 py-2 border rounded-l"
                        />
                        <button type="submit" className="px-4 py-2 bg-black text-white rounded-r" disabled={isLoading}>
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleViewAll}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'View All'}
                    </button>
                </form>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                {searchResults.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Search Results</h3>
                        <ul className="space-y-2">
                            {searchResults.map((customer, index) => (
                                <li
                                    key={index}
                                    className={`p-2 rounded cursor-pointer ${
                                        selectedCustomer && selectedCustomer.email === customer.email
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                    onClick={() => handleCustomerSelect(customer)}
                                >
                                    <p className={`text-sm ${selectedCustomer && selectedCustomer.email === customer.email ? 'text-white' : 'text-gray-600'}`}>
                                        Email: {customer.email}
                                    </p>
                                    <p className={`text-sm ${selectedCustomer && selectedCustomer.email === customer.email ? 'text-white' : 'text-gray-600'}`}>
                                        Account ID: {customer.fbAccountId ?? 'Not assigned'}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6">
                    <input
                        type="text"
                        placeholder="Assign Account ID"
                        value={fbAccountId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFbAccountId(e.target.value)}
                        className="w-full px-3 py-2 border rounded mb-2"
                    />
                    {selectedCustomer && selectedCustomer.fbAccountId === undefined && (
                        <p className="text-red-500 text-sm mb-2">This user does not yet have a Facebook Account ID</p>
                    )}
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700"
                    >
                        Assign Account ID
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CustomerSearch;