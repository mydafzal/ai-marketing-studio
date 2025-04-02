import {createStreamableValue, getMutableAIState, streamUI} from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { nanoid } from '@/lib/utils';
import { BotCard, BotMessage, SystemMessage } from '@/components/stocks/message';
import { Message } from '@/lib/types';
import {ModuleConfigBuilder} from "@/lib/ui-magic/moduleConfigBuilder";
type Module = ReturnType<typeof ModuleConfigBuilder.prototype.build>;
type ModuleMap = Record<string, Module>;

export class ActionUIManager {
    private modules: ModuleMap;
    private aiState: ReturnType<typeof getMutableAIState>;

    constructor() {
        this.modules = {};
        this.aiState = getMutableAIState();
    }

    attachModule(moduleConfig: Module) {
        this.modules[moduleConfig.name] = moduleConfig;
        console.log(`Module "${moduleConfig.name}" attached`);
    }

    private getVisibleModules() {
        return Object.entries(this.modules)
            .filter(([_, module]) => module.visibility())
            .reduce((acc, [name, module]) => {
                acc[name] = {
                    description: module.description,
                    parameters: module.parameters,
                    generate: async function* (params: any) {
                        try {
                            const result = await module.component(params);
                            return (
                                <BotCard>
                                    {result}
                                </BotCard>
                            );
                        } catch (error) {
                            console.error(`Error in module ${name}:`, error);
                            return (
                                <SystemMessage>
                                    Error executing module {name}. Please try again.
                                </SystemMessage>
                            );
                        }
                    }
                };
                return acc;
            }, {} as any);
    }

    async generateReply(input: string) {
        const tools = this.getVisibleModules();

        let textStream: ReturnType<typeof createStreamableValue<string>>;
        let textNode: React.ReactNode;

        const result = await streamUI({
            model: openai('gpt-4'),
            initial: <BotMessage content="..." />,
            messages: [
                ...this.aiState.get().messages.map((message: Message) => ({
                    role: message.role,
                    content: message.content,
                }))
            ],
            text: ({ content, done, delta }) => {
                if (!textStream) {
                    textStream = createStreamableValue('');
                    textNode = <BotMessage content={textStream.value} />;
                }

                if (done) {
                    textStream.done();
                    this.aiState.done({
                        ...this.aiState.get(),
                        messages: [
                            ...this.aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content,
                                timestamp: new Date().toISOString()
                            }
                        ]
                    });
                } else {
                    textStream.update(delta);
                }

                return textNode;
            },
            tools
        });

        return {
            id: nanoid(),
            display: result.value
        };
    }
}