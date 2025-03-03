import Link from 'next/link'

export function AccountNotConnected() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-300 bg-gray-100 p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-gray-700 text-center">
          Welcome to Reeply AI
        </h1>
        <p className="leading-relaxed text-gray-700 text-center">
          You are currently subscribed to use our{' '}
          <span className="text-green-600 font-medium">
            AI Creatives Generator
          </span>{' '}
          tool.
        </p>
        <p className="text-gray-600 text-center underline">
          <Link
            href="https://platform.reeply.ai/ai-content"
            className="text-blue-700 hover:underline"
          >
            Click here to access the tool!
          </Link>
        </p>
      </div>
    </div>
  )
}
