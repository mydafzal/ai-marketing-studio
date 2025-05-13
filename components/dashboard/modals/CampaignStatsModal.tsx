'use client'

import React from 'react'
import { BarChart, BarChart2, Calendar, ChevronDown, DollarSign, Eye, EyeOff, LineChart, PieChart, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CampaignStatsModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: any | null // Replace with proper campaign type
}

export default function CampaignStatsModal({ 
  isOpen, 
  onClose, 
  campaign 
}: CampaignStatsModalProps) {
  if (!campaign) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1D29] text-white border-[#2A2E3A] max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <BarChart2 className="mr-2 h-5 w-5 text-blue-400" />
            Campaign Statistics: {campaign.name}
            <Badge className={`ml-3 ${campaign.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}`}>
              {campaign.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2 flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Start: {campaign.startDate}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>End: {campaign.endDate}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Budget: ${campaign.budget}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="bg-[#0A0C14] border border-[#2A2E3A] p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
            <TabsTrigger value="adsets" className="data-[state=active]:bg-blue-600">Ad Sets</TabsTrigger>
            <TabsTrigger value="creatives" className="data-[state=active]:bg-blue-600">Creatives</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-blue-600">Leads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Impressions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.metrics.impressions?.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.metrics.clicks?.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">CTR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.metrics.ctr}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaign.metrics.spend}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                <CardHeader>
                  <CardTitle className="text-white">Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Total</span>
                        <span className="font-medium text-white">{campaign.metrics.conversions}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${campaign.performance.conversions}%` }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Cost Per Acquisition</span>
                        <span className="font-medium text-white">{campaign.metrics.cpa}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${campaign.performance.cpa}%` }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Leads</span>
                        <span className="font-medium text-white">{campaign.metrics.leads}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (campaign.metrics.leads / campaign.metrics.conversions) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-white">Performance Trend</CardTitle>
                  <div className="flex space-x-2 text-sm text-gray-400">
                    <span>Last 30 days</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex-1 min-h-[180px] flex items-center justify-center text-gray-500">
                    <LineChart className="h-16 w-16 opacity-30" />
                    <span className="ml-2">Performance Chart</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="adsets" className="pt-4">
            <div className="bg-[#0A0C14] border border-[#2A2E3A] rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Ad Sets ({campaign.adSets?.length || 0})</h3>
              {campaign.adSets && campaign.adSets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[#2A2E3A]">
                      <tr>
                        <th className="text-left font-medium text-gray-400 pb-2">Name</th>
                        <th className="text-left font-medium text-gray-400 pb-2">Status</th>
                        <th className="text-left font-medium text-gray-400 pb-2">Budget</th>
                        <th className="text-left font-medium text-gray-400 pb-2">Impressions</th>
                        <th className="text-left font-medium text-gray-400 pb-2">Clicks</th>
                        <th className="text-left font-medium text-gray-400 pb-2">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2E3A]">
                      {campaign.adSets.map((adSet: any) => (
                        <tr key={adSet.id} className="hover:bg-[#0a0c14]/50">
                          <td className="py-3">{adSet.name}</td>
                          <td className="py-3">
                            <Badge className={adSet.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}>
                              {adSet.status}
                            </Badge>
                          </td>
                          <td className="py-3">${adSet.budget}</td>
                          <td className="py-3">{adSet.impressions.toLocaleString()}</td>
                          <td className="py-3">{adSet.clicks.toLocaleString()}</td>
                          <td className="py-3">{((adSet.clicks / adSet.impressions) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">No ad sets available</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="creatives" className="pt-4">
            <div className="bg-[#0A0C14] border border-[#2A2E3A] rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Ad Creatives ({campaign.creatives?.length || 0})</h3>
              {campaign.creatives && campaign.creatives.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[#2A2E3A]">
                      <tr>
                        <th className="text-left font-medium text-gray-400 pb-2">Name</th>
                        <th className="text-left font-medium text-gray-400 pb-2">Status</th>
                        <th className="text-left font-medium text-gray-400 pb-2">Impressions</th>
                        <th className="text-left font-medium text-gray-400 pb-2">Clicks</th>
                        <th className="text-left font-medium text-gray-400 pb-2">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2E3A]">
                      {campaign.creatives.map((creative: any) => (
                        <tr key={creative.id} className="hover:bg-[#0a0c14]/50">
                          <td className="py-3">{creative.name}</td>
                          <td className="py-3">
                            <Badge className={creative.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}>
                              {creative.status}
                            </Badge>
                          </td>
                          <td className="py-3">{creative.impressions.toLocaleString()}</td>
                          <td className="py-3">{creative.clicks.toLocaleString()}</td>
                          <td className="py-3">{creative.ctr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">No creatives available</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="leads" className="pt-4">
            <div className="bg-[#0A0C14] border border-[#2A2E3A] rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Leads Generated: {campaign.metrics.leads || 0}</h3>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <BarChart className="h-4 w-4 mr-2" />
                  Download Leads
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="bg-[#1A1D29] border-[#2A2E3A]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      Lead Demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex-1 min-h-[180px] flex items-center justify-center text-gray-500">
                      <PieChart className="h-16 w-16 opacity-30" />
                      <span className="ml-2">Demographics Chart</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#1A1D29] border-[#2A2E3A]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      Lead Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex-1 min-h-[180px] flex items-center justify-center text-gray-500">
                      <BarChart className="h-16 w-16 opacity-30" />
                      <span className="ml-2">Sources Chart</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            className="border-[#2A2E3A] hover:bg-[#2A2E3A] text-gray-300"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}