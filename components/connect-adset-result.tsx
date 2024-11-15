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
    <div className="p-6 border rounded-x">
      {success ? (
        <div className="flex items-center space-x-2">
          Connected to adset: {adset.name} ({adset.id})
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          Failed to connect to adset: {adset.name} ({adset.id})
        </div>
      )}
    </div>
  )
}
