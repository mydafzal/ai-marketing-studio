"use client";

import React from 'react';
import { Image as ImageIcon, Target, Edit2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdText {
  headline: string;
  text: string;
  image: string;
  fbAdId?: string;
  date?: string;
  id?: string;
}

interface CreativeSlideProps {
  safeConfig: any;
  adTexts: AdText[];
  handleShowPreview: () => void;
  setShowCreativeModal: (val: boolean) => void;
  setShowLeadFormModal: (val: boolean) => void;
}

export function CreativeSlide({
  safeConfig,
  adTexts,
  handleShowPreview,
  setShowCreativeModal,
  setShowLeadFormModal
}: CreativeSlideProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-5 text-orange-400" />
            <h3 className="font-medium">Creative</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShowPreview}
              className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
              disabled={adTexts.length === 0}
            >
              <Eye className="size-4" />
            </button>
            <button
              onClick={() => setShowCreativeModal(true)}
              className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
            >
              <Edit2 className="size-4" />
            </button>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            {safeConfig.images.length > 0 ? `${safeConfig.images.length} images selected` : 'No images uploaded'}
          </p>
          {safeConfig.adText && (
            <p>
              Ad Text: {safeConfig.adText}
            </p>
          )}
        </div>
      </div>

      {/* Lead Form */}
      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-purple-400" />
            <h3 className="font-medium">Lead Form</h3>
          </div>
          <button
            onClick={() => setShowLeadFormModal(true)}
            className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
          >
            <Edit2 className="size-4" />
          </button>
        </div>
        <p className="text-muted-foreground text-sm">
          Configure the lead form to capture user information.
        </p>
      </div>
    </>
  );
}
