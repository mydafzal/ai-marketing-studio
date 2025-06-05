import { kv } from '@vercel/kv'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import LeadNotificationSubscription from '@/components/lead-notification-subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Lead Notifications | Reeply AI Marketing Manager',
  description: 'Manage your lead notification preferences',
}

export default async function NotificationsPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect('/login')
  }
  
  const userEmail = session.user.email
  const userKey = `user:${userEmail}`
  
  // Get current subscriptions from Redis
  const subscribedCampaignsJson = await kv.hget(userKey, 'subscribed_campaigns')
  
  // Parse the JSON string or return an empty array if not found
  let subscribedCampaigns: string[] = []
  
  if (subscribedCampaignsJson) {
    try {
      subscribedCampaigns = JSON.parse(subscribedCampaignsJson as string)
      
      // Ensure it's an array
      if (!Array.isArray(subscribedCampaigns)) {
        subscribedCampaigns = []
      }
    } catch (e) {
      console.error('Error parsing subscribed campaigns JSON:', e)
    }
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Notification Settings</CardTitle>
            <CardDescription>
              Select which campaigns you want to receive notifications for when new leads are generated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadNotificationSubscription 
              userEmail={userEmail} 
              initialSubscriptions={subscribedCampaigns} 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>How Lead Notifications Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Get Notified of New Leads</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications when new leads are generated from your selected campaigns.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 9 6 6" />
                    <path d="m15 9-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Selective Notifications</h3>
                  <p className="text-sm text-muted-foreground">Choose which campaigns are important to you and only receive notifications for those.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Notifications will be sent to your registered email address: {userEmail}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}