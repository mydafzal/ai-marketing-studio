'use client'
import React, {useState} from 'react';

interface Customer {
    email: string;
    fbAccountId?: string | null;
    fbPageId?: string | null;
}

const CustomerSearch: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [fbAccountId, setFbAccountId] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [defaultPrompt, setDefaultPrompt] = useState('');
    const [defaultAdminPrompt, setDefaultAdminPrompt] = useState('');
    const [fbPageId, setFbPageId] = useState('');
    const [pageIdSuccessMessage, setPageIdSuccessMessage] = useState<string | null>(null);


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
                        fbAccountId: customer.fbAccountId,
                        fbPageId: customer.fbPageId
                    }));
                } else if (data.data && typeof data.data === 'object') {
                    customers = [{
                        email: data.data.email,
                        fbAccountId: data.data.fbAccountId,
                        fbPageId: data.data.fbPageId
                    }];
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
                    fbAccountId: client.fbAccountId,
                    fbPageId: client.fbPageId
                }));
                setSearchResults(customers);
                if (customers.length === 0) {
                    setError('No clients found');
                } else {
                    setError(null);
                }
            } else {
                throw new Error(data.error || 'Failed to fetch clients: Unexpected data format');
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


    const handlePageIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setPageIdSuccessMessage(null);

        if (!selectedCustomer) {
            setError('Please select a customer first');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/update-fb-page-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: selectedCustomer.email, pageId: fbPageId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update Page ID');
            }

            setPageIdSuccessMessage('Page ID updated successfully');

            // Update the selected customer and search results with the new page ID
            setSelectedCustomer({ ...selectedCustomer, fbPageId: fbPageId });
            setSearchResults(prevResults =>
                prevResults.map(customer =>
                    customer.email === selectedCustomer.email
                        ? { ...customer, fbPageId: fbPageId }
                        : customer
                )
            );
        } catch (err) {
            console.error('Error updating Page ID:', err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleManagePrompt = async (email: string) => {
        setSelectedEmail(email);
        setDefaultPrompt(''); // Reset the prompt when opening the modal
        setDefaultAdminPrompt(''); // Reset the admin prompt (Re-added)
        setIsModalOpen(true);
        // Fetch both prompts when opening the modal
        await handleFetchPrompt(email); // Fetch user prompt
        await handleFetchAdminPrompt(email); // Fetch admin prompt (Re-added)
    };


    const handleUpdatePrompt = async () => {
        try {
            setIsLoading(true);
            setError(null); // Clear any previous errors

            // Optional: Validate email
            if (!selectedEmail || !/\S+@\S+\.\S+/.test(selectedEmail)) {
                setError('Please enter a valid email address.');
                setIsLoading(false);
                return;
            }

            // Optional: Validate defaultPrompt
            if (!defaultPrompt) {
                setError('Default prompt cannot be empty.');
                setIsLoading(false);
                return;
            }

            const response = await fetch('/api/admin/update-user-default-extra-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email: selectedEmail, defaultExtraDetails: defaultPrompt}),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to update default prompt');
            }

            // Display a success message to the user
            alert(data.message || 'Default prompt updated successfully');

            // Reset states
            setDefaultPrompt('');
            setSelectedEmail('');
            setSuccessMessage(data.message || 'Default prompt updated successfully');
        } catch (error) {
            console.error('Error updating user default prompt:', error);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred while updating user prompt');
        } finally {
            setIsLoading(false);
        }
    };

    // Renamed and modified to accept email as argument for pre-fetching
    const handleFetchPrompt = async (emailToFetch: string = selectedEmail) => {
        // No separate loading state for individual fetches within modal for simplicity
        // setError(null); // Clear previous errors if desired

        if (!emailToFetch) {
            console.warn('No email selected for fetching user prompt.');
            return;
        }

        try {
            const response = await fetch(
                `/api/admin/fetch-user-default-extra-details?email=${encodeURIComponent(emailToFetch)}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch user default prompt');
            }

            console.log('Fetched user prompt data:', data);
            setDefaultPrompt(data.defaultExtraDetails || '');

        } catch (error) {
            console.error('Error fetching user default prompt:', error);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred while fetching user prompt');
            setDefaultPrompt(''); // Clear prompt on error
        } finally {
            // No individual loading state change here
        }
    };

    // Re-added function to fetch admin details using the new endpoint
    const handleFetchAdminPrompt = async (emailToFetch: string = selectedEmail) => {
        if (!emailToFetch) {
            console.warn('No email selected for fetching admin prompt.');
            return;
        }
        try {
            const response = await fetch(
                `/api/admin/fetch-user-default-extra-admin-details?email=${encodeURIComponent(emailToFetch)}`
            );
            const data = await response.json();

            if (!response.ok || !data.success) {
                // Use error from response if available, otherwise provide a default
                throw new Error(data.error || 'Failed to fetch admin default prompt');
            }

            console.log('Fetched admin prompt data:', data);
            setDefaultAdminPrompt(data.defaultExtraAdminDetails || '');

        } catch (error) {
            console.error('Error fetching admin default prompt:', error);
            // Display specific error to user
            setError(error instanceof Error ? error.message : 'An unexpected error occurred while fetching admin prompt');
            setDefaultAdminPrompt(''); // Clear prompt on error
        }
    };

    // Re-added function to update admin details using the new endpoint
    const handleUpdateAdminPrompt = async () => {
        if (!selectedEmail) {
            setError('Please select an email first.');
            return;
        }
        // Note: No validation check if defaultAdminPrompt is empty, allowing it to be cleared

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null); // Clear previous success messages

        try {
            const response = await fetch('/api/admin/update-user-default-extra-admin-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: selectedEmail, defaultExtraAdminDetails: defaultAdminPrompt }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to update admin default prompt');
            }

            alert(data.message || 'Admin default prompt updated successfully');
            setSuccessMessage(data.message || 'Admin default prompt updated successfully');
            // Optionally clear admin prompt state after successful update if desired
            // setDefaultAdminPrompt('');
            // Optionally close modal or keep it open
            // setIsModalOpen(false);

        } catch (error) {
            console.error('Error updating admin default prompt:', error);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred while updating admin prompt');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFbAccountId(customer.fbAccountId ?? '');
        setFbPageId(customer.fbPageId ?? '');
        setSearchQuery(customer.email);
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden p-6 relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Customer Search</h2>
            <div>
                <form onSubmit={handleSearch} className="mb-4">
                    <div className="flex mb-2">
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-grow px-3 py-2 border rounded-l dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button type="submit" className="px-4 py-2 bg-black text-white rounded-r dark:bg-blue-600 dark:hover:bg-blue-700" disabled={isLoading}>
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleViewAll}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'View All'}
                    </button>
                </form>

                {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}

                {searchResults.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Search Results</h3>
                        <ul className="space-y-2">
                            {searchResults.map((customer, index) => (
                                <li
                                    key={index}
                                    className={`p-2 rounded ${
                                        selectedCustomer && selectedCustomer.email === customer.email
                                            ? 'bg-emerald-500 text-white' // Selected state remains the same
                                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => handleCustomerSelect(customer)}
                                        >
                                            <p className={`text-sm ${selectedCustomer && selectedCustomer.email === customer.email ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                Email: {customer.email}
                                            </p>
                                            <p className={`text-sm ${selectedCustomer && selectedCustomer.email === customer.email ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                Account ID: {customer.fbAccountId ?? 'Not assigned'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleManagePrompt(customer.email)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            Manage Default Prompt
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mt-6 space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <input
                            type="text"
                            placeholder="Assign Account ID"
                            value={fbAccountId}
                            onChange={(e) => setFbAccountId(e.target.value)}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {selectedCustomer && selectedCustomer.fbAccountId === undefined && (
                            <p className="text-red-500 dark:text-red-400 text-sm">This user does not yet have a Facebook Account ID</p>
                        )}
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-white rounded bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800"
                            disabled={isLoading}
                        >
                            Assign Account ID
                        </button>
                        {successMessage && (
                            <p className="text-green-500 dark:text-green-400 text-sm">{successMessage}</p>
                        )}
                    </form>

                    <form onSubmit={handlePageIdSubmit} className="space-y-2">
                        <input
                            type="text"
                            placeholder="Assign Page ID"
                            value={fbPageId}
                            onChange={(e) => setFbPageId(e.target.value)}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {selectedCustomer && selectedCustomer.fbPageId === undefined && (
                            <p className="text-red-500 dark:text-red-400 text-sm">This user does not yet have a Facebook Page ID</p>
                        )}
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-white rounded bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            disabled={isLoading}
                        >
                            Assign Page ID
                        </button>
                        {pageIdSuccessMessage && (
                            <p className="text-green-500 dark:text-green-400 text-sm">{pageIdSuccessMessage}</p>
                        )}
                    </form>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"> {/* Added z-50 */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl"> {/* Added shadow-xl */}
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Manage Default Prompt</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="text"
                                value={selectedEmail}
                                onChange={(e) => setSelectedEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:text-white"
                                readOnly // Make email read-only in modal
                            />
                        </div>
                        {/* Removed duplicate Default User Prompt section */}
                        <div className="mb-4">
                            <label htmlFor="defaultPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Default User Prompt
                            </label>
                            <textarea
                                id="defaultPrompt"
                                value={defaultPrompt}
                                onChange={(e) => setDefaultPrompt(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                            />
                        </div>
                        {/* Re-added Textarea for Admin Default Prompt */}
                        <div className="mb-4">
                            <label htmlFor="defaultAdminPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Default Admin Prompt
                            </label>
                            <textarea
                                id="defaultAdminPrompt"
                                value={defaultAdminPrompt}
                                onChange={(e) => setDefaultAdminPrompt(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                            />
                        </div>
                        {error && <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>}
                        {successMessage && <p className="text-green-500 dark:text-green-400 mb-2">{successMessage}</p>}
                        {isLoading && <p className="text-blue-500 dark:text-blue-400 mb-2">Loading...</p>}
                        <div className="flex flex-col gap-4 justify-end mt-4"> {/* Added mt-4 */}
                             {/* Fetch Button - Fetches both prompts */}
                             <button
                                onClick={async () => {
                                    setIsLoading(true);
                                    setError(null);
                                    setSuccessMessage(null);
                                    await handleFetchPrompt();
                                    await handleFetchAdminPrompt(); // Re-added handleFetchAdminPrompt call
                                    setIsLoading(false);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                                disabled={isLoading}
                            >
                                Fetch Both
                            </button>
                            {/* Update User Prompt Button */}
                            <button
                                onClick={handleUpdatePrompt}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                                disabled={isLoading}
                            >
                                Update User Prompt
                            </button>
                             {/* Re-added Update Admin Prompt Button */}
                            <button
                                onClick={handleUpdateAdminPrompt}
                                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
                                disabled={isLoading}
                            >
                                Update Admin Prompt
                            </button>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setError(null); // Clear error when closing
                                    setSuccessMessage(null); // Clear success message when closing
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSearch;
