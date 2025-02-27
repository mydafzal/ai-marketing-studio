// chat.tsx
'use client'

import {useActions, useAIState, useUIState} from 'ai/rsc' 
import React, {useCallback, useContext, useEffect, useState} from 'react'
import {toast} from 'sonner'

import {
   fetchChatFbAdsetId,
   fetchChatFbCampaignId,
   getFbFetchedObject,
   updateChatFbCampaignId,
   updateChatTitle
} from '@/app/actions'
import {CampaignContext, CampaignContextProvider} from '@/components/contexts/campaign-context'
import {KvContextProvider} from '@/components/contexts/kv-context'
import {ChatList} from '@/components/chat-list'
import {ChatPanel} from '@/components/chat-panel'
import {EmptyScreen} from '@/components/empty-screen'
import {useLocalStorage} from '@/lib/hooks/use-local-storage'
import {useScrollAnchor} from '@/lib/hooks/use-scroll-anchor'
import {Chat as ChatType, Message, Session} from '@/lib/types'
import {cn} from '@/lib/utils'
import CampaignOverview from "@/components/stocks/campaign-overview-basic-ui"
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper"
import {nanoid} from "nanoid";
import {UserMessage} from "@/components/stocks/message";
import {ImagePart, TextPart} from "ai";
import {AI} from "@/lib/chat/AIManager";
import {isFeatureToggleEnabled} from "@/lib/helpers/feature-toggle/feature-toggle-manager";
import {ActiveUIProvider, useActiveUI} from '@/components/stocks/active-ui-context'


interface FbFetchedObject {
   id: string;
   name: string;
   status: string;
   daily_budget: string;
   start_time: string;
   campaign_id: string;
   destination_type: string;
   is_dynamic_creative: boolean;
   targeting: {
       age_max: number;
       age_min: number;
       flexible_spec: Array<{
           interests: Array<{
               id: string;
               name: string;
           }>;
       }>;
       geo_locations: {
           countries: string[];
           location_types: string[];
       };
       publisher_platforms: string[];
       facebook_positions: string[];
       instagram_positions: string[];
       device_platforms: string[];
   };
}

export interface ChatProps extends React.ComponentProps<'div'> {
   initialMessages?: Message[]
   chat: ChatType | null
   id: string
   session?: Session
   missingKeys: string[]
}

function ChatCore({id, chat, className, session, missingKeys}: ChatProps) {
   const [aiState, setAIState] = useAIState()
   const [_, setNewChatId] = useLocalStorage('newChatId', id)
   const {id: campaignId, setId: setCampaignId, summary: campaignSummary} = useContext(CampaignContext)
   const [adsetId, setAdsetId] = useState<string | null>(null)
   const [adsetData, setAdsetData] = useState<FbFetchedObject | null>(null)
   const [isLoadingAdset, setIsLoadingAdset] = useState(false)
   const [messages, setMessages] = useUIState<typeof AI>()
   const {submitUserMessage} = useActions()
   
   // Use the Active UI context
   const { activeUI, clearActiveUI } = useActiveUI()
   
   // Toggle state for showing/hiding side panel
   const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
   
   // Define side panel width - increased width
   const sidePanelWidth = 450; // Increased from 350px to 450px
   
   // Auto-open side panel when activeUI is set
   useEffect(() => {
       if (activeUI) {
           setIsSidePanelOpen(true)
       }
   }, [activeUI])

   // Add sendMessage function
   const sendMessage = React.useCallback(async (message: string, userContent?: (TextPart | ImagePart)[]) => {
       // Optimistically add user message UI
       setMessages(currentMessages => [
           ...currentMessages,
           {
               id: nanoid(),
               display: <UserMessage userContent={userContent}>{message}</UserMessage>
           }
       ])

       // Submit and get response message
       const responseMessage = await submitUserMessage(message, userContent);
       setMessages(currentMessages => [...currentMessages, responseMessage])
   }, [submitUserMessage, setMessages])

   // Add handleShowMe that uses sendMessage
   const handleShowMe = useCallback((message: string) => {
       sendMessage(message);
   }, [sendMessage]);

   useEffect(() => {
       if (!aiState.messages.length) {
           setAIState((aiState: any) => ({
               ...aiState,
               messages: [
                   {
                       id: 'campaign-info-data',
                       role: 'system',
                       content: 'No campaign is connected to this chat. You should always show UI to connect a campaign to the chat when user asks about one of "setting campaign budget", "changing campaign budget" "campaign result" and "campaign status".',
                       timestamp: new Date().toISOString()
                   },
                   {
                       id: 'adset-info-data',
                       role: 'system',
                       content: 'No adset is selected to this chat. You should always show UI to select an adset for the chat when user asks to generate ad suggestion.',
                       timestamp: new Date().toISOString()
                   }
               ]
           }))
       }
   }, [aiState.messages.length, setAIState])

   // Fetch campaign ID and update title
   useEffect(() => {
       if (!campaignId && id) {
           const fetch = async () => {
               const result = await fetchChatFbCampaignId(id)
               if (result.success) {
                   setCampaignId(result.fbCampaignId as string)
               }
           }
           void fetch()
       }
   }, [campaignId, id, setCampaignId])

   useEffect(() => {
       if (campaignSummary && campaignSummary.campaign_id !== '0') {
           const updateTitle = async () => {
               await updateChatTitle(aiState.chatId, campaignSummary.campaign_name)
               window.dispatchEvent(new CustomEvent("update-chat-title", {
                   detail: {
                       campaignId: campaignSummary.campaign_id,
                       campaignName: campaignSummary.campaign_name
                   }
               }))
           }

           if (chat?.title && chat.title !== campaignSummary.campaign_name) {
               void updateTitle()
           }
       }
   }, [campaignSummary, chat, aiState.chatId])

   // Fetch adset data
   useEffect(() => {
       const initializeAdsetId = async () => {
           const chatId = getChatIdFromUrl()
           if (chatId) {
               const result = await fetchChatFbAdsetId(chatId)
               if (result.success && typeof result.fbAdsetId === 'string') {
                   setAdsetId(result.fbAdsetId)
               }
           }
       }

       initializeAdsetId()
   }, [])

   const fetchAdsetData = async (id: string) => {
       setIsLoadingAdset(true)
       try {
           const result = await getFbFetchedObject('adset', id)
           if (result.success && result.data && 'content' in result.data) {
               const content = result.data.content as Record<string, unknown>
               if (content && typeof content === 'object') {
                   setAdsetData(content as unknown as FbFetchedObject)
               }
           }
       } catch (error) {
           console.error('Error fetching adset data:', error)
       } finally {
           setIsLoadingAdset(false)
       }
   }

   useEffect(() => {
       if (adsetId) {
           fetchAdsetData(adsetId)
       }
   }, [adsetId])

   useEffect(() => {
       setNewChatId(id)
   })

   useEffect(() => {
       missingKeys.map(key => {
           toast.error(`Missing ${key} environment variable!`)
       })
   }, [missingKeys])

   const {messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom} =
       useScrollAnchor()

   const handleCampaignCreated = useCallback(async (campaignId: string) => {
       setCampaignId(campaignId)
       await updateChatFbCampaignId(id, campaignId)
   }, [id, setCampaignId])

   const handleRefreshAdset = () => {
       if (adsetId) {
           fetchAdsetData(adsetId)
       }
   }

   // Toggle side panel visibility
   const toggleSidePanel = () => {
       setIsSidePanelOpen(!isSidePanelOpen)
   }

   return (
       <div
           className="group w-full pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] relative flex h-full"
           ref={scrollRef}
       >
           {/* Main Chat Area - Adjusted to make room for side panel */}
           <div className={cn(
               "flex-1 flex flex-col h-full transition-all duration-300",
               isSidePanelOpen && activeUI ? `w-[calc(100%-${sidePanelWidth}px)]` : "w-full"
           )}>
               <div className="overflow-auto h-full">
                   <div
                       className={cn('pb-[200px] pt-4 md:pt-10 relative', className)}
                       ref={messagesRef}
                   >
                       <div>
                           {messages.length ? (
                               <ChatList messages={messages} isShared={false} session={session}/>
                           ) : (
                               <EmptyScreen/>
                           )}
                           <div className="w-full h-px" ref={visibilityRef}/>
                       </div>

                       {isFeatureToggleEnabled('rightSideOverviewCard') &&
                           <div
                               className="hidden lg:block fixed top-20 right-10 w-[350px]"
                               style={{
                                   position: 'fixed',
                                   zIndex: 40,
                               }}
                           >
                               <div className="campaign-overview-container" style={{
                                   transform: 'scale(0.55)',
                                   transformOrigin: 'top right',
                                   width: '100%',
                                   height: 'auto',
                               }}>
                                   <CampaignOverview
                                       campaignName={campaignSummary?.campaign_name}
                                       campaignId={campaignId ?? null}
                                       campaignBudget='to be implemented'
                                       adsetData={adsetData}
                                       adsetId={adsetId}
                                       isLoading={isLoadingAdset}
                                       onRefresh={handleRefreshAdset}
                                       onShowMe={sendMessage}
                                   />
                               </div>
                           </div>}
                   </div>
               </div>

               <ChatPanel
                   id={id}
                   isAtBottom={isAtBottom}
                   scrollToBottom={scrollToBottom}
                   onCampaignCreate={handleCampaignCreated}
                   campaignId={campaignId}
               />
           </div>

           {/* Side Panel for Active UI - Now wider */}
           {activeUI && (
               <div 
                   className={cn(
                       "fixed right-0 top-0 h-full border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg transition-all duration-300 z-30",
                       isSidePanelOpen ? `w-[${sidePanelWidth}px] translate-x-0` : `w-[${sidePanelWidth}px] translate-x-full`
                   )}
                   style={{ width: isSidePanelOpen ? `${sidePanelWidth}px` : `${sidePanelWidth}px` }}
               >
                   {/* Side Panel Header */}
                   <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4">
                       <h3 className="font-medium text-zinc-800 dark:text-zinc-200">
                           {activeUI.title || "Active Component"}
                       </h3>
                       <div className="flex space-x-2">
                           <button 
                               onClick={toggleSidePanel}
                               className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                           >
                               {isSidePanelOpen ? (
                                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                       <path d="M9 18l6-6-6-6" />
                                   </svg>
                               ) : (
                                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                       <path d="M15 18l-6-6 6-6" />
                                   </svg>
                               )}
                           </button>
                           <button 
                               onClick={clearActiveUI} 
                               className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                           >
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                   <path d="M18 6 6 18" />
                                   <path d="m6 6 12 12" />
                               </svg>
                           </button>
                       </div>
                   </div>
                   
                   {/* Side Panel Content */}
                   <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
                       {activeUI.component}
                   </div>
               </div>
           )}
           
           {/* Toggle button (visible when panel is closed) */}
           {activeUI && !isSidePanelOpen && (
               <button
                   onClick={toggleSidePanel}
                   className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-md shadow-md z-40"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M15 18l-6-6 6-6" />
                   </svg>
               </button>
           )}
       </div>
   )
}

export const Chat = ({...chatProps}: ChatProps) => (
   <ActiveUIProvider>
       <KvContextProvider chat={chatProps.chat}>
           <CampaignContextProvider>
               <ChatCore {...chatProps} />
           </CampaignContextProvider>
       </KvContextProvider>
   </ActiveUIProvider>
)