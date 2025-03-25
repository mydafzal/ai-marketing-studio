'use client';

import React from 'react';

interface SupportProps {
  // We don't need many props, but we'll include a title for consistency
  title?: string;
}

export function Support({ title = "Reeply AI Support" }: SupportProps) {
  return (
    <div className="p-6 text-white border rounded-xl bg-zinc-950 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-zinc-200">{title}</h3>
          <p className="text-sm text-zinc-400">Schedule a meeting with our support team</p>
        </div>
        <div className="px-3 py-1 text-sm rounded-full bg-zinc-900 text-green-400 border border-green-600">
          Available
        </div>
      </div>

      {/* TidyCal Embed */}
      <div className="mt-4 bg-zinc-900 p-4 rounded-lg">
        <div className="tidycal-embed" data-path="max-reeply-ai/support"></div>
        <script src="https://asset-tidycal.b-cdn.net/js/embed.js" async></script>
      </div>

      {/* Additional contact info */}
      <div className="mt-6 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <h4 className="font-medium text-zinc-200 mb-2">Need immediate help?</h4>
        <p className="text-zinc-400 mb-2">You can also reach us via:</p>
        <ul className="space-y-2 text-zinc-300">
          <li>• Email: contact@reeply.ai</li>
          
        </ul>
      </div>
    </div>
  );
}