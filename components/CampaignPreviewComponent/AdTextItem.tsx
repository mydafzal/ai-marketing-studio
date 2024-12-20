"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Pencil, Check, X } from 'lucide-react';
import { IconSpinner } from '@/components/ui/icons';
import { cn, sleep } from '@/lib/utils';
import { toast } from 'sonner';
import { SocialPreview } from './SocialPreview';


interface AdText {
  headline: string;
  text: string;
  image: string;
  fbAdId?: string;
  date?: string;
  id?: string;
}

interface AdTextItemProps {
  index: number;
  adText: AdText;
  acceptText?: (idx: number, adText: AdText) => Promise<void>;
  updateText?: (idx: number, adText: AdText, newAdText: AdText) => void;
}

export function AdTextItem({ index, adText, acceptText, updateText }: AdTextItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [textEdit, setTextEdit] = useState(adText.text);
  const [headlineEdit, setHeadlineEdit] = useState(adText.headline);
  const hasFbAd = !!adText.fbAdId;

  const handleAccept = async () => {
    setIsUpdating(true);
    await sleep(1000);
    if (acceptText) {
      await acceptText(index, adText);
    }
    setIsUpdating(false);
    toast.success('Ad text added to your campaign successfully!');
  };

  const handleSave = async () => {
    setIsUpdating(true);
    await sleep(1000);
    if (updateText) {
      updateText(index, adText, { ...adText, text: textEdit, headline: headlineEdit });
    }
    setIsEditing(false);
    setIsUpdating(false);
    toast.success('Ad text updated successfully!');
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardContent className="p-6">
        {hasFbAd && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-blue-900/20 text-blue-200 rounded-lg border border-blue-800">
            <AlertCircle className="size-5 shrink-0" />
            <span className="text-sm">
              Ad already created with ID: {adText.fbAdId}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SocialPreview
            platform="instagram"
            image={adText.image as string}
            headline={isEditing ? headlineEdit : adText.headline}
            text={isEditing ? textEdit : adText.text}
          />
          <SocialPreview
            platform="facebook"
            image={adText.image as string}
            headline={isEditing ? headlineEdit : adText.headline}
            text={isEditing ? textEdit : adText.text}
          />
        </div>

        {!hasFbAd && isEditing && (
          <div className="mt-6 space-y-4">
            <input
              value={headlineEdit}
              onChange={e => setHeadlineEdit(e.target.value)}
              className={cn(
                "w-full text-center font-semibold p-2",
                "bg-zinc-800 border border-zinc-700 rounded-lg",
                "text-zinc-200 placeholder:text-zinc-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              placeholder="Enter headline"
            />
            
            <textarea
              className={cn(
                "w-full min-h-[120px] p-3",
                "bg-zinc-800 border border-zinc-700 rounded-lg",
                "text-zinc-200 placeholder:text-zinc-400 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              value={textEdit}
              onChange={e => setTextEdit(e.target.value)}
              placeholder="Enter ad text"
            />
          </div>
        )}

        {!hasFbAd && (
          <div className="flex justify-end gap-3 mt-6">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setTextEdit(adText.text);
                    setHeadlineEdit(adText.headline);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 h-10",
                    "text-zinc-200 text-sm font-medium rounded-lg",
                    "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700",
                    "transition-colors duration-200"
                  )}
                >
                  <X className="size-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className={cn(
                    "flex items-center gap-2 px-4 h-10",
                    "text-white text-sm font-medium rounded-lg",
                    "bg-blue-600 hover:bg-blue-700",
                    "transition-colors duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isUpdating ? (
                    <IconSpinner className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 h-10",
                    "text-zinc-200 text-sm font-medium rounded-lg",
                    "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700",
                    "transition-colors duration-200"
                  )}
                >
                  <Pencil className="size-4" />
                  Edit
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isUpdating}
                  className={cn(
                    "flex items-center gap-2 px-4 h-10",
                    "text-white text-sm font-medium rounded-lg",
                    "bg-blue-600 hover:bg-blue-700",
                    "transition-colors duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isUpdating ? (
                    <IconSpinner className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Accept
                </button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
