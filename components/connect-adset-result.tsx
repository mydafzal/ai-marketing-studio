'use client'

import * as React from 'react';
import { Adset } from '@/lib/types'

interface ConnectAdsetProps {
  adset: Adset
  success: boolean
}

export function ConnectAdsetResult({
  adset,
  success
}: ConnectAdsetProps) {
  return (
    <div className="p-6 border rounded-xl bg-gray-50 dark:bg-gray-800">
      {success ? (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <span className="font-medium">Connected to adset: {adset.name} ({adset.id})</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <span className="font-medium">Failed to connect to adset: {adset.name} ({adset.id})</span>
        </div>
      )}
    </div>
  )
}
