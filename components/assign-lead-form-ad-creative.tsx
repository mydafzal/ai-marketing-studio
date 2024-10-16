'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SystemMessage } from '@/components/stocks'
import { AdCreative, LeadgenFrom } from '@/lib/types'


export function AssignLeadFormAdCreative() {
  const [leadForms, setLeadForms] = useState<LeadgenFrom[]>([])
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([])
  const [selectedLeadFormId, setSelectedLeadFormId] = useState<string>('')
  const [selectedAdCreativeId, setSelectedAdCreativeId] = useState<string>('')
  const [connectingUI, setConnectingUI] = useState<React.ReactNode | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadFormsResponse, adCreativesResponse] = await Promise.all([
          fetch(`/api/fasty-bot/proxy-get-leadgen-forms?page_id=119021011189054`),
          fetch('/api/fasty-bot/proxy-get-adcreatives')
        ])

        if (!leadFormsResponse.ok || !adCreativesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const leadFormsData = await leadFormsResponse.json()
        const adCreativesData = await adCreativesResponse.json()

        setLeadForms(leadFormsData.data?.data || [])
        setAdCreatives(adCreativesData.data?.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        setConnectingUI(
          <SystemMessage>
            Failed to fetch lead forms and ad creatives. Please try again.
          </SystemMessage>
        )
      }
    }

    fetchData()
  }, [])

  const handleAssign = async () => {
    if (!selectedLeadFormId || !selectedAdCreativeId) {
      setConnectingUI(
        <SystemMessage>
          Please select both a lead form and an ad creative.
        </SystemMessage>
      )
      return
    }

    setConnectingUI(
      <div className="inline-flex items-start gap-1 md:items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-900"></div>
        <p>Assigning lead form to ad creative...</p>
      </div>
    )

    try {
      const selectedAdCreative = adCreatives.find(creative => creative.id === selectedAdCreativeId)
      const payload = {
        "id": selectedAdCreativeId,
        "name": selectedAdCreative?.name,
        "object_story_spec": {
          "page_id": 119021011189054,
          "link_data": {
            "link": "https://www.example.com",
            "name": "Name heading",
            "message": "Check out our new product!",
            ...selectedAdCreative?.object_story_spec?.link_data,
            "image_url": selectedAdCreative?.object_story_spec?.link_data?.image_url || "https://rzzpeoupdh.s3.amazonaws.com/public/WDHCKUl/1724419337295_0iewek-gnos-hhUx08PuYpc-unsplash.jpg",
            "image_hash": selectedAdCreative?.object_story_spec?.link_data?.image_hash,
            "call_to_action": {
              "type": "SIGN_UP",
              "value": {
                "lead_gen_form_id": selectedLeadFormId
              }
            }
          }
        }
      }

      const response = await fetch('/api/fasty-bot/proxy-update-adcreative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to assign lead form to ad creative')

      setConnectingUI(
        <SystemMessage>
          Lead form successfully assigned to ad creative.
        </SystemMessage>
      )
    } catch (error) {
      setConnectingUI(
        <SystemMessage>
          Failed to assign lead form to ad creative. Please try again.
        </SystemMessage>
      )
    }
  }

  if (adCreatives.length === 0) {
    return (
      <div className="p-6 border rounded-x space-y-4">
        <SystemMessage>
          Please create an ad creative first to be able to assign the lead form to it.
        </SystemMessage>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded-x space-y-4">
      <Select onValueChange={setSelectedLeadFormId} value={selectedLeadFormId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a lead form" />
        </SelectTrigger>
        <SelectContent>
          {leadForms.map((form) => (
            <SelectItem key={form.id} value={form.id}>
              {form.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={setSelectedAdCreativeId} value={selectedAdCreativeId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an ad creative" />
        </SelectTrigger>
        <SelectContent>
          {adCreatives.map((creative) => (
            <SelectItem key={creative.id} value={creative.id || ''}>
              {`${creative.name} (ID: ${creative.id})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleAssign} disabled={!selectedLeadFormId || !selectedAdCreativeId}>
        Assign Lead Form to Ad Creative
      </Button>

      <div className="w-full">
        {connectingUI}
      </div>
    </div>
  )
}

export default AssignLeadFormAdCreative
