import { useActions, useAIState } from 'ai/rsc'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Message } from '@/lib/types'; 

interface ITranslationContext {
    translate: (key: string) => string;
}

export const TranslationContext = createContext<ITranslationContext>({
    translate: (key: string) => '',
});

export const TranslationContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [map, setMap] = useState<{ [key: string]: string }>({});

    const [aiState] = useAIState();
    const isMapSet = useRef(false);

    const { submitUserMessage } = useActions()


    useEffect(() => {
        console.log('useEffect')
        console.log('isMapSet.current', isMapSet.current)
        if (!isMapSet.current && aiState.messages.length > 1) {
            let translations;
            aiState.messages.forEach((message: Message) => {
                if (message.role !== 'tool') return;
                const content = message.content[0];
                if (content.toolName !== 'showTranslations' || content.type !== 'tool-result') return;

                translations = (content.result as { translations: any }).translations;
            });
            
            console.log('translations', translations)
            if (translations) {
                try {
                    setMap(JSON.parse(translations));
                    isMapSet.current = true;
                } catch(e) {}
            } else {
                const fetch = async () => {
                    await submitUserMessage(
                      `Give me translatiions for my Language`,
                      [],
                      true,
                      true
                    )
                }
                setTimeout(fetch, 0);
            }
        }
    }, [aiState.messages]);

    const translate = useCallback((key: string) => {
        return map[key] ?? key;
    }, [map]);

    const value = useMemo(() => ({
        translate,
    }), [translate]);

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    )
};
