const placeholderEvents = [
  {
    date: '2022-10-01',
    headline: 'NVIDIA releases new AI-powered graphics card',
    description:
      'NVIDIA unveils the latest graphics card infused with AI capabilities, revolutionizing gaming and rendering experiences.',
    category: 'Technology',
    importance: 'medium'
  }
]

export const EventsSkeleton = () => {
  return (
    <div className="-mt-2 flex w-full flex-col gap-4 py-4">
      {placeholderEvents.map(event => (
        <div
          key={event.date}
          className={`flex shrink-0 flex-col gap-2 rounded-lg p-4 bg-zinc-700`}
        >
          <div className="w-24 rounded-md bg-zinc-600 text-sm text-transparent">
            {event.date}
          </div>
          <div className="flex items-center justify-between">
            <div className="w-48 rounded-md bg-zinc-600 text-lg text-transparent">
              {event.headline}
            </div>
            <div className="w-16 rounded-full bg-zinc-600 px-2 py-1 text-xs text-transparent">
              {event.category}
            </div>
          </div>
          <div className="w-full rounded-md bg-zinc-600 text-transparent">
            {event.description.slice(0, 70)}...
          </div>
        </div>
      ))}
    </div>
  )
}
