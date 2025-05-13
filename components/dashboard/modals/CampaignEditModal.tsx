'use client'

import React from 'react'
import { Edit, Eye, EyeOff, Settings, DollarSign, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SafeImage from '../SafeImage'

interface CampaignEditModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: any | null // Replace with proper campaign type
}

export default function CampaignEditModal({ 
  isOpen, 
  onClose, 
  campaign 
}: CampaignEditModalProps) {
  if (!campaign) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1D29] text-white border-[#2A2E3A] max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <Settings className="mr-2 h-5 w-5 text-blue-400" />
            Edit Campaign: {campaign.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-1">
            Adjust campaign settings, budget, and toggle ad sets and creatives.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="budget" className="mt-4">
          <TabsList className="bg-[#0A0C14] border border-[#2A2E3A] p-1">
            <TabsTrigger value="budget" className="data-[state=active]:bg-blue-600">Budget</TabsTrigger>
            <TabsTrigger value="adsets" className="data-[state=active]:bg-blue-600">Ad Sets</TabsTrigger>
            <TabsTrigger value="creatives" className="data-[state=active]:bg-blue-600">Creatives</TabsTrigger>
            <TabsTrigger value="rulesets" className="data-[state=active]:bg-blue-600">Rulesets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="budget" className="py-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-white text-lg">Campaign Status</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="campaign-status" className={campaign.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-400'}>
                      {campaign.status === 'ACTIVE' ? 'Active' : 'Paused'}
                    </Label>
                    <Switch id="campaign-status" checked={campaign.status === 'ACTIVE'} />
                  </div>
                </div>
                
                <div className="border-b border-[#2A2E3A] py-2"></div>
                
                <div className="space-y-3">
                  <Label className="text-white text-lg">Campaign Budget</Label>
                  <div className="bg-[#0A0C14] p-4 rounded-lg border border-[#2A2E3A]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-400">Daily Budget</span>
                      <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-3 py-1 flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <input 
                          type="number" 
                          className="w-20 bg-transparent border-none focus:outline-none text-white" 
                          defaultValue={campaign.budget / 30}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Min: $10</span>
                          <span className="text-gray-400">Max: $1,000</span>
                        </div>
                        <Slider 
                          defaultValue={[campaign.budget / 30]} 
                          max={1000} 
                          min={10} 
                          step={10}
                          className="w-full" 
                        />
                      </div>
                      
                      <div className="flex justify-between bg-[#19222E] p-3 rounded border border-[#2a3a4a] text-sm">
                        <span className="text-blue-300">Monthly estimate</span>
                        <span className="font-semibold text-white">${campaign.budget.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-b border-[#2A2E3A] py-2"></div>
                
                <div className="space-y-3">
                  <Label className="text-white text-lg">Campaign Timeline</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-gray-400">Start Date</Label>
                      <input 
                        id="start-date"
                        type="date" 
                        className="w-full bg-[#0A0C14] border border-[#2A2E3A] rounded p-2 text-white"
                        defaultValue={campaign.startDate} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-gray-400">End Date</Label>
                      <input 
                        id="end-date"
                        type="date" 
                        className="w-full bg-[#0A0C14] border border-[#2A2E3A] rounded p-2 text-white"
                        defaultValue={campaign.endDate} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="adsets" className="py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ad Sets ({campaign.adSets?.length || 0})</h3>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Create New Ad Set
                </Button>
              </div>
              
              {campaign.adSets && campaign.adSets.length > 0 ? (
                <div className="bg-[#0A0C14] rounded-lg border border-[#2A2E3A] divide-y divide-[#2A2E3A]">
                  {campaign.adSets.map((adSet: any) => (
                    <div key={adSet.id} className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-white">{adSet.name}</h4>
                        <p className="text-sm text-gray-400">Budget: ${adSet.budget} • {adSet.impressions.toLocaleString()} impressions</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch id={`adset-status-${adSet.id}`} checked={adSet.status === 'ACTIVE'} />
                          <Label htmlFor={`adset-status-${adSet.id}`} className={adSet.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-400'}>
                            {adSet.status === 'ACTIVE' ? 'Active' : 'Paused'}
                          </Label>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">No ad sets available</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="creatives" className="py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ad Creatives ({campaign.creatives?.length || 0})</h3>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Create New Creative
                </Button>
              </div>
              
              {campaign.creatives && campaign.creatives.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {campaign.creatives.map((creative: any) => (
                    <Card key={creative.id} className="bg-[#0A0C14] border-[#2A2E3A] overflow-hidden">
                      <div className="h-32 bg-gray-800 flex items-center justify-center border-b border-[#2A2E3A]">
                        <SafeImage 
                          src={campaign.thumbnail}
                          alt={creative.name}
                          width={125}
                          height={125}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{creative.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">CTR: {creative.ctr} • {creative.clicks.toLocaleString()} clicks</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {creative.status === 'ACTIVE' ? (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-400 hover:text-green-500" title="Pause">
                                <Eye className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-300" title="Activate">
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">No creatives available</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="rulesets" className="py-4">
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Automation Rules</h3>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Add New Rule
                </Button>
              </div>
              
              <div className="bg-[#0A0C14] rounded-lg border border-[#2A2E3A] divide-y divide-[#2A2E3A]">
                {/* Rule 1: Pause underperforming ads */}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium text-white">Rule 1</h4>
                    <div className="flex items-center space-x-2">
                      <Switch id="rule1-active" defaultChecked />
                      <Label htmlFor="rule1-active" className="text-green-400">Active</Label>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-300">If</span>
                    <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                      <option>ROAS</option>
                      <option>CTR</option>
                      <option selected>CPC</option>
                    </select>
                    <span className="text-gray-300">is</span>
                    <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                      <option>below</option>
                      <option selected>above</option>
                    </select>
                    <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                      <input 
                        type="number" 
                        className="w-16 bg-transparent border-none focus:outline-none text-white"
                        defaultValue={1.5} 
                      />
                    </div>
                    <span className="text-gray-300">then</span>
                    <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                      <option selected>pause</option>
                      <option>reduce budget by</option>
                      <option>send alert</option>
                    </select>
                    <span className="text-gray-300">the</span>
                    <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                      <option>campaign</option>
                      <option selected>ad creative</option>
                      <option>ad set</option>
                    </select>
                  </div>
                </div>
                
                {/* Rule 2: Scale budgets */}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium text-white">Rule 2</h4>
                    <div className="flex items-center space-x-2">
                      <Switch id="rule2-active" defaultChecked />
                      <Label htmlFor="rule2-active" className="text-green-400">Active</Label>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-300">If</span>
                    <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                      <option selected>ROAS</option>
                      <option>CTR</option>
                      <option>CPC</option>
                    </select>
                    <span className="text-gray-300">is</span>
                    <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                      <option>below</option>
                      <option selected>above</option>
                    </select>
                    <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                      <input 
                        type="number" 
                        className="w-16 bg-transparent border-none focus:outline-none text-white"
                        defaultValue={3.0} 
                      />
                    </div>
                    <span className="text-gray-300">for</span>
                    <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                      <input 
                        type="number" 
                        className="w-10 bg-transparent border-none focus:outline-none text-white"
                        defaultValue={3} 
                      />
                    </div>
                    <span className="text-gray-300">consecutive days then</span>
                    <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                      <option>pause</option>
                      <option selected>increase budget by</option>
                      <option>send alert</option>
                    </select>
                    <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                      <input 
                        type="number" 
                        className="w-10 bg-transparent border-none focus:outline-none text-white"
                        defaultValue={20} 
                      />
                      <span className="text-white">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex justify-between">
          <Button 
            variant="outline" 
            className="border-[#2A2E3A] hover:bg-[#2A2E3A] text-gray-300"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}