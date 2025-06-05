'use client'

import React from 'react'

// Component for client rendering
function LeadNotificationsLink() {
  return (
    <div className="p-4 w-full max-w-md mx-auto">
      <div className="text-lg font-medium mb-2">Lead Notification Preferences</div>
      <p className="text-sm text-muted-foreground mb-4">
        You can manage which campaigns you want to receive lead notifications for on the dedicated page.
      </p>
      <div className="mt-4">
        <a 
          href="/notifications" 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors inline-block"
          target="_blank"
          rel="noopener noreferrer"
        >
          Manage Lead Notifications
        </a>
      </div>
    </div>
  )
}

// Just export the component directly for use in FetchApplicableUI
export default {
  component: LeadNotificationsLink
}