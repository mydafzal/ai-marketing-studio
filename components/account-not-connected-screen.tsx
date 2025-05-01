'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { openCrispChat } from './crisp-chat'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

interface AccountConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Add a declaration for TidyCal to avoid TypeScript errors
declare global {
  interface Window {
    TidyCal?: {
      init?: () => void;
    };
  }
}

export function AccountConnectionModal({ isOpen, onClose }: AccountConnectionModalProps) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  return (
    <>
      {/* Main Connection Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
      }}>
        <DialogContent className="w-[90vw] max-w-md bg-[#1A1D29] border border-[#2A2E3A] text-white shadow-xl p-4 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-4">
            <div className="flex items-center justify-center mb-2 sm:mb-4">
              <div className="rounded-full bg-[#151925] p-2 sm:p-3 border border-[#2A2E3A]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-6 w-6 sm:h-8 sm:w-8 text-[#4BF29C]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-center text-lg sm:text-xl text-white">⚠️ Facebook Configuration Issue Detected</DialogTitle>
          </DialogHeader>
          
          <div className="text-[#ADB0B8] leading-relaxed text-sm sm:text-base">
            <p className="mb-3 sm:mb-4">
              <strong className="text-[#4BF29C]">Your Facebook account is connected</strong>, but our AI can&apos;t work properly because there&apos;s a <strong className="text-white">misconfiguration in your Facebook Business setup</strong>.
            </p>
            
            <p className="mb-4 sm:mb-6">
              Don&apos;t worry! Our team can <strong className="text-white">quickly solve this for you</strong>. After a brief 5-minute fix, you&apos;ll be able to start generating campaigns in just minutes. We&apos;re experts at resolving these common Facebook setup issues.
            </p>
            
            <div className="text-xs sm:text-sm text-[#8A8F99] p-3 sm:p-4 bg-[#151925] rounded-lg border border-[#2A2E3A] mb-4 sm:mb-6">
              <p className="font-medium mb-1 sm:mb-2 text-white">What&apos;s wrong with my setup?</p>
              <p>
                Our AI needs access to your complete Facebook marketing structure: Meta Business Manager, Ad Account, Facebook Page, and Instagram Account. One or more of these connections is missing or misconfigured.
              </p>
              <p className="mt-2 font-medium text-[#4BF29C]">
                Please contact us via chat or book a quick call, mentioning that you saw this popup. We&apos;ll fix this for you right away so you can start using our AI Marketing Assistant.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
            <button
              onClick={() => {
                openCrispChat();
                onClose();
              }}
              className="inline-flex items-center justify-center rounded-lg bg-[#3B82F6] px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 w-full"
            >
              Chat with Support
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowCalendarModal(true)}
              className="inline-flex items-center justify-center rounded-lg bg-[#4BF29C] px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium text-black transition-colors hover:bg-[#3BD080] focus:outline-none focus:ring-2 focus:ring-[#3BD080] focus:ring-offset-2 w-full"
            >
              Book Quick Call
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Modal */}
      <Dialog open={showCalendarModal} onOpenChange={(open) => {
        if (!open) setShowCalendarModal(false);
      }}>
        <DialogContent className="w-[95vw] max-w-lg bg-[#1A1D29] border border-[#2A2E3A] text-white shadow-xl p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-lg sm:text-xl text-white">Schedule a Support Call</DialogTitle>
          </DialogHeader>
          
          <div className="mt-3 sm:mt-4 p-2 sm:p-4 rounded-lg border border-[#2A2E3A]">
            <iframe 
              src="https://tidycal.com/max-reeply-ai/support" 
              frameBorder="0" 
              style={{ 
                width: '100%', 
                height: '350px', 
                overflow: 'visible',
                maxHeight: '70vh'
              }}
              allowFullScreen
            ></iframe>
          </div>
          
          <DialogFooter className="mt-3 sm:mt-4">
            <button
              onClick={() => setShowCalendarModal(false)}
              className="inline-flex items-center justify-center rounded-lg bg-[#2A2E3A] px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-[#222630] focus:outline-none focus:ring-2 focus:ring-[#222630] focus:ring-offset-2 w-full sm:w-auto"
            >
              Close Calendar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// For backwards compatibility, keeping the HomePageInfoCard component
interface HomePageInfoCardProps {
  adAccountConnected?: boolean;
  awaitingToGetReady?: boolean;
  isSubscribedToAIContent?: boolean;
  upgradeToUseContentCreator?: boolean;
  facebookConnectedButNoAccounts?: boolean;
  missingConnection?: boolean;
  noBusinessSelected?: boolean;
}

export function HomePageInfoCard({ adAccountConnected, awaitingToGetReady, isSubscribedToAIContent, upgradeToUseContentCreator, facebookConnectedButNoAccounts, missingConnection, noBusinessSelected }: HomePageInfoCardProps) {
  return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-8 shadow-md">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-green-50 p-3">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-8 w-8 text-green-600"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              AI Marketing Assistant
            </h1>

            <div className="space-y-3">
              {isSubscribedToAIContent && (
                  <p className="text-gray-700 leading-relaxed">
                    You are currently subscribed to use our{' '}
                    <span className="font-medium text-green-600">
                  AI Creatives Generator
                </span>{' '} tool.
                  </p>
              )}

              {adAccountConnected && (
                  <p className="text-gray-700 leading-relaxed">
                    You are subscribed to use the{' '}
                    <span className="font-medium text-green-600">
                  AI Content Creator
                </span>. To access the AI Marketer tool, please upgrade your plan.
                  </p>
              )}

              {upgradeToUseContentCreator && (
                  <div className="pt-2">
                    <Link
                        href="https://platform.reeply.ai/subscription"
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Subscription is needed to access this tool.
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="ml-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                      >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                  </div>
              )}


              {awaitingToGetReady && (
                <div className="text-gray-700 leading-relaxed">
                  <p>
                    You have an AI Marketer subscription, but your Facebook account is not connected yet.
                    Connecting to your Facebook account should only take a few minutes.{' '}
                    <strong>
                      Click{' '}
                      <a
                        href="https://joyous-brow-6da.notion.site/How-to-connect-to-Facebook-1e616186aac980c0a054f5452b53be7e"
                        className="text-blue-600 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        HERE
                      </a>{' '}
                      to view our official guide and connect your Facebook account quickly.
                    </strong>
                  </p>

                  <hr className="my-6 border-gray-300" />

                  <div className="text-sm text-gray-600 mt-4">
                    <p className="italic">
                      If you are having difficulties connecting your Facebook account, use the chat widget at the bottom right side of the screen. We will get back to you as soon as we can to help you with your issue.
                    </p>
                    <br />
                    <p>
                      Would you like to email us instead? Use{' '}
                      <a href="mailto:contact@reeply.ai" className="text-blue-600 underline">
                        contact@reeply.ai
                      </a>.
                    </p>
                    <br />
                    <p>All the best with your marketing journey!</p>
                  </div>
                </div>
              )}
              
              {(facebookConnectedButNoAccounts || missingConnection || noBusinessSelected) && (
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">
                    <strong className="text-green-600">Your Facebook account is connected!</strong> However, no Meta Business Manager is selected in the dropdown navigation above.
                  </p>
                  
                  <p className="mb-6">
                    We want to help you get onboarded as quickly as possible. Our team can guide you through selecting or setting up the necessary Meta Business Manager, Ad Account, or Facebook Page to start using our AI Marketing Assistant right away.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                    <button
                      onClick={() => openCrispChat()}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
                    >
                      Chat with Support
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </button>
                    
                    <a
                      href="https://calendly.com/reeply/30min"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full sm:w-auto"
                    >
                      Book Quick Call
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </a>
                  </div>
                  
                  <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium mb-2">Why am I seeing this?</p>
                    <p>
                      To use our AI Marketing Assistant effectively, you need to select a Meta Business Manager from the green dropdown menu above. 
                      If you don&apos;t see any options in the dropdown, our team can help you set these up or troubleshoot any connection issues you&apos;re experiencing.
                    </p>
                  </div>
                </div>
              )}

              {isSubscribedToAIContent && (
                  <div className="pt-2">
                    <Link
                        href="https://platform.reeply.ai/ai-content"
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Access Your AI Creatives Generator
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="ml-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                      >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}