'use client';

import React from 'react';

interface SupportProps {
  // We don't need many props, but we'll include a title for consistency
  title?: string;
}

export function Support({ title = "Reeply AI Support" }: SupportProps) {
  return (
    <div className="p-6 text-white border border-[#2A2E3A] rounded-xl bg-[#1A1D29] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-sm text-[#ADB0B8]">Schedule a meeting with our support team</p>
        </div>
        <div className="px-3 py-1 text-sm rounded-full bg-[#151925] text-[#4BF29C] border border-[#2A2E3A]">
          Available
        </div>
      </div>

      {/* TidyCal Embed */}
      <div className="mt-4 bg-[#151925] p-4 rounded-lg border border-[#2A2E3A]">
        <div className="tidycal-embed" data-path="max-reeply-ai/support"></div>
        <script src="https://asset-tidycal.b-cdn.net/js/embed.js" async></script>
      </div>

      {/* Additional contact info */}
      <div className="mt-6 p-4 rounded-lg bg-[#0A0C14] border border-[#2A2E3A]">
        <h4 className="font-medium text-white mb-2">Need immediate help?</h4>
        <p className="text-[#ADB0B8] mb-2">You can also reach us via:</p>
        <ul className="space-y-2 text-[#8A8F99]">
          <li className="flex items-center">
            <span className="text-[#4BF29C] mr-2">•</span> 
            Email: <span className="text-[#4BF29C] ml-1">contact@reeply.ai</span>
          </li>
        </ul>
      </div>
    </div>
  );
}