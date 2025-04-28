'use client';

import { useState } from 'react';

export default function SupportCalendarButton() {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  return (
    <div className="mt-4">
      <button 
        className="bg-[#4BF29C] text-[#0A0C14] px-4 py-2 rounded-lg font-medium hover:bg-[#3AD88C] transition-colors"
        onClick={() => setIsCalendarVisible(!isCalendarVisible)}
      >
        {isCalendarVisible ? 'Hide Calendar' : 'Book a Support Call Now'}
      </button>
      
      {isCalendarVisible && (
        <div className="mt-4 rounded-lg border border-[#2A2E3A] bg-[#151925] p-4">
          <div className="tidycal-embed" data-path="max-reeply-ai/support"></div>
          {/* The script needs to be loaded when the component mounts */}
          <script src="https://asset-tidycal.b-cdn.net/js/embed.js" async></script>
        </div>
      )}
    </div>
  );
}