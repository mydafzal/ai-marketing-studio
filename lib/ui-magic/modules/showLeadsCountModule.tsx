import { z } from 'zod'
import { BotCard } from '@/components/stocks'
import LeadsCountUI from '@/components/campaign-leads-count'
import { ModuleConfigBuilder } from '@/lib/ui-magic/moduleConfigBuilder'



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
  


export interface ShowLeadsCountUIParams {
    toolCallId: string
    toolCallResult?:{
        data?:LeadData;
        success:boolean;
      };
}


export const showLeadsCountModule = new ModuleConfigBuilder(
    'showLeadsCountUI'
)
    .setDescription('Show a UI to display leads count for the campaign.')
    .setParameters(z.object({}))
    .setComponent(async ({ toolCallId,toolCallResult }: ShowLeadsCountUIParams) => {
        return (
            <BotCard>
                <LeadsCountUI toolCallId={toolCallId} toolCallResult={toolCallResult}/>
            </BotCard>
        )
    })
    .build()

export default showLeadsCountModule
