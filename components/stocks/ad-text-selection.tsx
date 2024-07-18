'use client';

import { useState } from 'react';
import { AdTextSelectionSkeleton } from '@/components/stocks/ad-text-selection-skeleton';

export interface AdText {
  date: string;
  text: string;
  headline?: string;  // Make headline optional
}

export function AdTextSelection({ props }: { props: AdText[] }) {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <AdTextSelectionSkeleton />;
  }

  return (
    <div className="-mt-2 flex w-full flex-col gap-4 py-4">
      {props.map((adText, index) => (
        <div
          key={index}
          className={`flex shrink-0 flex-col gap-2 rounded-lg p-4 bg-zinc-800`}
        >
          <div className="text-xs text-zinc-400">
            {adText.date}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-zinc-200">
              {adText.headline || `Suggested Ad Text ${index + 1}`}
            </div>
          </div>
          <div className="text-zinc-400">
            {adText.text}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdTextSelection;