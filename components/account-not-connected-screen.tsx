import { ExternalLink } from '@/components/external-link'
import Link from "next/link";

export function AccountNotConnected() {
  return (
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-300 bg-gray-100 p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-blue-700">Welcome to Reeply AI</h1>
          <p className="leading-relaxed text-gray-700">
            The <span className="text-green-600 font-medium">AI Marketing Manager</span> tool feature is coming soon!
            You are currently subscribed to use our{' '}
            <span className="text-blue-600 font-medium">AI Creatives Generator</span> tool.
          </p>
          <p className="text-gray-600">
            <Link href="https://platform.reeply.ai/ai-content" className="text-blue-600 hover:underline">
              Click here to access the AI Creatives Generator!
            </Link>
          </p>
        </div>
      </div>
  )
}
