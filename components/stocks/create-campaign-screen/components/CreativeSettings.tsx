import React from 'react';
import { Upload, XCircle } from 'lucide-react';
import { MediaItem } from '../types';

interface CreativeSettingsProps {
  adHeadline: string;
  setAdHeadline: React.Dispatch<React.SetStateAction<string>>;
  adText: string;
  setAdText: React.Dispatch<React.SetStateAction<string>>;
  mediaItems: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function CreativeSettings({
  adHeadline,
  setAdHeadline,
  adText,
  setAdText,
  mediaItems,
  setMediaItems,
  fileInputRef
}: CreativeSettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-medium mb-3">Creative Settings</h3>
      <div>
        <label className="text-sm mb-1 block">Headline</label>
        <input
          type="text"
          value={adHeadline}
          onChange={e => setAdHeadline(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-sm mb-1 block">Description</label>
        <textarea
          value={adText}
          onChange={e => setAdText(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
        />
      </div>

      <div>
        <label className="text-sm mb-1 block">Media</label>
        <div
          className="flex items-center justify-center h-24 w-full border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center text-gray-400">
            <Upload className="mb-1" size={20} />
            <span className="text-xs">Upload Additional Media</span>
          </div>
        </div>

        {mediaItems.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {mediaItems.map(item => (
              <div key={item.id} className="relative w-20 h-20 flex-shrink-0">
                <img
                  src={item.url}
                  alt="Media preview"
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
                  onClick={() =>
                    setMediaItems(prev => prev.filter(m => m.id !== item.id))
                  }
                >
                  <XCircle size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}