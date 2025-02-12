'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIState } from 'ai/rsc'
import { Message} from '@/lib/types'

interface LeadData {
  campaign_id: string;
  campaign_name: string;
  ads: Array<{
    ad_id: string;
    ad_name: string;
    lead_count: number;
    leads: Array<{
      id: string;
      created_time: string;
      form_id: string;
      field_data: Array<{
        name: string;
        values: string[];
      }>;
      campaign_id: string;
      ad_id: string;
      ad_name: string;
    }>;
  }>;
}

type LeadsCountUIProps = {
  toolCallId:string;
  toolCallResult?:{
    data?:LeadData;
    success:boolean;
  };
}

const LeadsCountUI = ({toolCallId,toolCallResult}:LeadsCountUIProps) => {
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [isLoading, setIsLoading] = useState(toolCallResult?false:true);
  const [error, setError] = useState<string | null>(null);

  const [aiState, setAIState] = useAIState()


  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        const response = await fetch(`/api/fasty-bot/proxy-get-campaign-leads-count`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch lead data');
        }

        const data = await response.json();
        setAIState({
          ...aiState,
          messages: [
            ...aiState.messages.map((message: Message) => {
              if (message.role === 'tool' && message.id === toolCallId) {
                const content = message.content[0]
                if (
                  content.type === 'tool-result' &&
                  content.toolName === 'showLeadsCountUI'
                ) {
                  content.result = {
                    ...(content.result as Object),
                    toolCallResult: {
                      success: true,
                      data: data
                    }
                  }
                }
              }
              return message
            })
          ]
        })
        setLeadData(data);
      } catch (err) {
        setError('Error fetching lead data');
        console.error('Error:', err);
        setAIState({
          ...aiState,
          messages: [
            ...aiState.messages.map((message: Message) => {
              if (message.role === 'tool' && message.id === toolCallId) {
                const content = message.content[0]
                if (
                  content.type === 'tool-result' &&
                  content.toolName === 'showLeadsCountUI'
                ) {
                  content.result = {
                    ...(content.result as Object),
                    toolCallResult: {
                      success: false
                    }
                  }
                }
              }
              return message
            })
          ]
        })
      } finally {
        setIsLoading(false);
      }
    };
    if(toolCallResult?.success===true){
      if (toolCallResult?.data){
        setLeadData(toolCallResult?.data);
      }
    }
    else if(toolCallResult?.success===false){
      setError("Error fetching lead data, Please try after some time")
    }
    else{
      fetchLeadData();
    }
  }, []);


  const downloadLeadsReport = (adData: any) => {
    // Convert leads data to CSV format
    const csvRows = [];
    
    // Add headers based on first lead's field_data
    if (adData.leads && adData.leads.length > 0) {
      const headers = ['Lead ID', 'Created Time'];
      console.log(adData)
      const fieldNames = adData.leads[0].field_data.map((field: any) => field.name);
      headers.push(...fieldNames);
      csvRows.push(headers.join(','));

      // Add data rows
      adData.leads.forEach((lead: any) => {
        const row = [lead.id, lead.created_time];
        
        // Create a map of field name to value for easier lookup
        const fieldMap = lead.field_data.reduce((acc: any, field: any) => {
          acc[field.name] = field.values[0];
          return acc;
        }, {});

        // Add values in same order as headers
        fieldNames.forEach((fieldName: string) => {
          row.push(fieldMap[fieldName] || '');
        });

        csvRows.push(row.join(','));
      });

      // Create and download CSV file
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_${adData.ad_name}_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  if (isLoading) {
    return <div className="dark:text-zinc-200">Loading lead data...</div>;
  }

  if (error) {
    return <div className="dark:text-zinc-200">{error}</div>;
  }

  if (!leadData || !leadData.ads || leadData.ads.length === 0) {
    return <div className="dark:text-zinc-200">No lead data available</div>;
  }

  const totalLeads = leadData.ads.reduce((sum, ad) => sum + ad.lead_count, 0);

  return (
    <Card className="w-full bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          <CardTitle className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
            Leads from
            {leadData.campaign_name && (
              <span className="ml-2 text-xl font-medium text-zinc-600 dark:text-zinc-400">
                 {leadData.campaign_name} 
              </span>
            )}
            {" "}Campaign
            </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-200">
                {totalLeads} Total Leads
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Across {leadData.ads.length} ads
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {leadData.ads.map((ad) => (
              <div 
                key={ad.ad_id} 
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg"
              >
                <div className="flex-1 mr-4">
                  <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">{ad.ad_name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-sm rounded-full bg-zinc-100 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300 font-medium">
                    {ad.lead_count} leads
                  </span>
                  {ad.lead_count > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadLeadsReport(ad)}
                      className="shadow-lg"
                    >
                      Download Report
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsCountUI;
