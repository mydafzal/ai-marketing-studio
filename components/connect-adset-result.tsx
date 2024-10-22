'use client'

import * as React from 'react';

interface ConnectAdsetProps {
  adsetId: string
  success: boolean
}

export function ConnectAdsetResult({
  adsetId,
  success
}: ConnectAdsetProps) {
  return (
    <div className="p-6 border rounded-xl bg-gray-50 dark:bg-gray-800">
      {success ? (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <span className="font-medium">Connected to adset: {adsetId}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <span className="font-medium">Failed to connect to adset: {adsetId}</span>
        </div>
      )}
    </div>
  )
}
