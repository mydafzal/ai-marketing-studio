'use client'

import React, { useState } from 'react';

const UserExporter: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<any[] | null>(null);
  const [exportCount, setExportCount] = useState<number>(0);

  const fetchInactiveUsers = async () => {
    setIsLoading(true);
    setError(null);
    setExportData(null);
    setExportCount(0);

    try {
      const response = await fetch('/api/admin/fetch-inactive-users');
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(data?.error || `Failed to fetch inactive users: ${response.status} ${response.statusText}`);
      }

      if (data?.success && Array.isArray(data.data)) {
        setExportData(data.data);
        setExportCount(data.data.length || 0);
      } else {
        throw new Error('Invalid response format: Expected data.success=true and data.data as array');
      }
    } catch (err) {
      console.error('Error fetching inactive users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching users');
      setExportData(null);
      setExportCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!exportData || !Array.isArray(exportData) || exportData.length === 0) return;
    
    try {
      // Format the date for Excel compatibility
      const formattedData = exportData.map(user => {
        try {
          if (!user.created_at) {
            return {
              ...user,
              created_at: 'N/A'
            };
          }
          
          // Try to format the date, with fallback
          let formattedDate;
          try {
            const date = new Date(user.created_at);
            // Check if date is valid
            if (isNaN(date.getTime())) {
              formattedDate = user.created_at; // Keep original string if invalid date
            } else {
              formattedDate = date.toISOString().replace('T', ' ').substring(0, 19);
            }
          } catch (e) {
            formattedDate = user.created_at; // Keep original string if parsing fails
          }
          
          return {
            ...user,
            created_at: formattedDate
          };
        } catch (e) {
          console.error('Error formatting user data:', e);
          return user; // Return original user if formatting fails
        }
      });
      
      // Create CSV content
      const headers = ['email', 'created_at', 'subscription_status'];
      const csvContent = [
        headers.join(','),
        ...formattedData.map(user => {
          try {
            return [
              user.email || 'N/A',
              user.created_at || 'N/A',
              user.subscription_status || 'none'
            ].join(',');
          } catch (e) {
            console.error('Error creating CSV row:', e);
            return 'Error processing this row';
          }
        })
      ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inactive_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating CSV:', err);
      setError('Error generating CSV: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="p-6">
      <p className="text-gray-600 mb-4">
        Export users created in the last month who do not have an active or trialing subscription. Excludes @reeply.ai and @reeply.net test accounts.
      </p>
      
      <div className="flex flex-col space-y-4">
        <button
          onClick={fetchInactiveUsers}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150"
        >
          {isLoading ? 'Loading...' : 'Fetch Users'}
        </button>
        
        {error && (
          <div className="text-red-500 my-2">
            {error}
          </div>
        )}
        
        {exportData && (
          <div className="mt-4">
            <p className="text-gray-700 font-semibold mb-2">
              Found {exportCount} users from the last month
            </p>
            
            {exportCount > 0 ? (
              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-150"
              >
                Download CSV
              </button>
            ) : (
              <p className="text-gray-600">No users found to export</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserExporter;