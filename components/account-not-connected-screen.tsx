
import Link from 'next/link'

interface HomePageInfoCardProps {
  adAccountConnected?: boolean;
  awaitingToGetReady?: boolean;
  isSubscribedToAIContent?: boolean;
  upgradeToUseContentCreator?: boolean;
}

export function HomePageInfoCard({ adAccountConnected, awaitingToGetReady, isSubscribedToAIContent, upgradeToUseContentCreator }: HomePageInfoCardProps) {
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
                        href="https://reeply-ai.crisp.help/en/article/how-to-connect-your-account-to-facebook-mr0zul/"
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
