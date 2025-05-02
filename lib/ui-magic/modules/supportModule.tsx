import { z } from 'zod';
import { BotCard, BotMessage } from '@/components/stocks';
import {ModuleConfigBuilder} from "@/lib/ui-magic/moduleConfigBuilder";
import { Support } from '@/components/stocks/support';

export interface SupportParams {
    title?: string;
}

// Support module is deprecated - now using Crisp chat in the navbar
export const supportModule = new ModuleConfigBuilder('showSupportUI')
    .setDescription('Support is now available via the Crisp chat in the navbar')
    .setParameters(z.object({
        title: z.string().optional().describe('Optional custom title (deprecated)')
    }))
    // Disable module by setting visibility to false
    .setVisibility(() => false)  
    .setComponent(async ({ title }: SupportParams) => {
        return (
            <>
                <BotCard>
                    <p>
                        For support, please use the chat button in the top navigation bar.
                    </p>
                </BotCard>
            </>
        );
    })
    .build();

export default supportModule;