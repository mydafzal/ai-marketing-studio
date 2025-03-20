// subscription-bypass-list.ts

// List of emails that bypass subscription requirements
export const subscriptionBypassList: string[] = [
  // Add emails here
];

import Link from 'next/link'

interface HomePageInfoCardProps {
  adAccountConnected?: boolean;
  awaitingToGetReady?: boolean;
  isSubscribedToAIContent?: boolean;
}

export function HomePageInfoCard({ adAccountConnected, awaitingToGetReady, isSubscribedToAIContent }: HomePageInfoCardProps) {
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
              Welcome to Reeply AI
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

              {awaitingToGetReady && (
                  <p className="text-gray-700 leading-relaxed">
                    You have an AI Marketer subscription, but your Facebook account is not connected yet.
                    Contact <a href="mailto:contact@reeply.net" className="text-blue-600 underline">contact@reeply.net</a>{' '} to get started.
                  </p>
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
