'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface IntegrationsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function IntegrationsModal({ isOpen, onOpenChange }: IntegrationsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open && window.location.hash === '#integrations') {
        window.history.pushState(null, '', window.location.pathname);
      }
    }}>
      <DialogContent className="bg-[#1A1D29] text-white border-[#2A2E3A] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Integrations</DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your campaign dashboard with other tools and services.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="bg-[#0A0C14] rounded-lg border border-[#2A2E3A] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-[#FF4A00] p-1.5 rounded">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.2834 5.72233C17.3136 5.72233 16.5245 6.51017 16.5245 7.48106C16.5245 8.45196 17.3136 9.22983 18.2834 9.22983C19.2533 9.22983 20.0505 8.45196 20.0505 7.48106C20.0494 6.51133 19.2603 5.72233 18.2834 5.72233Z" fill="white"/>
                    <path d="M6.56258 13.7554C5.59392 13.7554 4.80377 14.5432 4.80377 15.5141C4.80377 16.485 5.59392 17.2729 6.56258 17.2729C7.53123 17.2729 8.32138 16.485 8.32138 15.5141C8.32138 14.5432 7.53123 13.7554 6.56258 13.7554Z" fill="white"/>
                    <path d="M6.56258 5.72233C5.59392 5.72233 4.80377 6.51017 4.80377 7.48106C4.80377 8.45196 5.59392 9.22983 6.56258 9.22983C7.53123 9.22983 8.32138 8.45196 8.32138 7.48106C8.32138 6.51017 7.53123 5.72233 6.56258 5.72233Z" fill="white"/>
                    <path d="M18.2834 13.7554C17.3136 13.7554 16.5245 14.5432 16.5245 15.5141C16.5245 16.485 17.3136 17.2729 18.2834 17.2729C19.2533 17.2729 20.0505 16.485 20.0505 15.5141C20.0494 14.5432 19.2603 13.7554 18.2834 13.7554Z" fill="white"/>
                    <path d="M12.423 9.76746C11.4532 9.76746 10.6641 10.5553 10.6641 11.5262C10.6641 12.4971 11.4532 13.2849 12.423 13.2849C13.3929 13.2849 14.189 12.4971 14.189 11.5262C14.189 10.5553 13.3929 9.76746 12.423 9.76746Z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-white">Zapier</h3>
                  <p className="text-xs text-gray-400">Connect to 3000+ apps</p>
                </div>
              </div>
              <Button className="bg-[#FF4A00] hover:bg-[#E54400] text-white">
                Connect
              </Button>
            </div>
          </div>
          
          <div className="bg-[#0A0C14] rounded-lg border border-[#2A2E3A] p-4 opacity-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-700 p-1.5 rounded">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-white">Payment Gateway</h3>
                  <p className="text-xs text-gray-400">Coming soon</p>
                </div>
              </div>
              <Button className="bg-gray-700 text-gray-400 cursor-not-allowed" disabled>
                Connect
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-[#2A2E3A] hover:bg-[#2A2E3A] text-gray-300" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}