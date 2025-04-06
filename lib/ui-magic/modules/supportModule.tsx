import { z } from 'zod';
import { BotCard, BotMessage } from '@/components/stocks';
import {ModuleConfigBuilder} from "@/lib/ui-magic/moduleConfigBuilder";
import { Support } from '@/components/stocks/support';

export interface SupportParams {
    title?: string;
}

export const supportModule = new ModuleConfigBuilder('showSupportUI')
    .setDescription('Show Reeply AI Support scheduling interface in the sidebar')
    .setParameters(z.object({
        title: z.string().optional().describe('Optional custom title for the support component')
    }))
    .setComponent(async ({ title }: SupportParams) => {
        return (
            <>
                <BotCard>
                    <p>
                        I have opened our support scheduling tool in the sidebar. You can book a meeting with our support team at your convenience.
                    </p>
                </BotCard>
            </>
        );
    })
    .build();

export default supportModule;