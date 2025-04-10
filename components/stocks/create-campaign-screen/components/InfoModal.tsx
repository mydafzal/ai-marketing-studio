"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function InfoModal({ isOpen, onClose, title, children }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-container-bg border-border-dark text-text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-text-light-gray mt-2">
          {children}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}