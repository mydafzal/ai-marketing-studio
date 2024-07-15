'use client';

import { useState } from 'react';

export interface AdTextSelectionProps {
  campaignName: string;
  suggestedTexts: string[];
  onConfirm: (selectedTexts: string[]) => void;
}

export function AdTextSelection({ props: { campaignName, suggestedTexts, onConfirm } }: { props: AdTextSelectionProps }) {
  const [selectedTexts, setSelectedTexts] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');

  const handleCheckboxChange = (text: string) => {
    setSelectedTexts(prev =>
      prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]
    );
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomText(e.target.value);
  };

  const handleConfirm = () => {
    const allSelectedTexts = [...selectedTexts];
    if (customText) {
      allSelectedTexts.push(customText);
    }
    onConfirm(allSelectedTexts);
  };

  return (
    <div className="p-4 text-green-400 border rounded-xl bg-zinc-950">
      <div className="text-lg text-zinc-300">{campaignName}</div>
      <div className="mt-4">
        <p className="font-bold">Suggested Ad Texts:</p>
        {suggestedTexts.map((text, index) => (
          <div key={index} className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={selectedTexts.includes(text)}
              onChange={() => handleCheckboxChange(text)}
              className="accent-green-500"
            />
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="font-bold">Or enter your own ad text:</p>
        <input
          type="text"
          value={customText}
          onChange={handleCustomTextChange}
          className="w-full p-2 mt-2 border rounded-lg bg-zinc-800 text-zinc-300"
        />
      </div>
      <button
        className="w-full px-4 py-2 mt-6 font-bold text-zinc-900 bg-green-400 rounded-lg hover:bg-green-500"
        onClick={handleConfirm}
      >
        Confirm Ad Text
      </button>
    </div>
  );
}

export default AdTextSelection;
