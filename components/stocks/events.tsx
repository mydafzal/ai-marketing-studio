import { format, parseISO } from 'date-fns'

interface Event {
  date: string
  headline: string
  description: string
  category?: string
  importance?: 'high' | 'medium' | 'low'
}

export function Events({ props: events }: { props: Event[] }) {
  return (
    <div className="-mt-2 flex w-full flex-col gap-4 py-4">
      {events.map(event => (
        <div
          key={event.date}
          className={`flex shrink-0 flex-col gap-2 rounded-lg p-4 ${
            event.importance === 'high'
              ? 'bg-red-800'
              : event.importance === 'medium'
              ? 'bg-yellow-800'
              : 'bg-zinc-800'
          }`}
        >
          <div className="text-xs text-zinc-400">
            {format(parseISO(event.date), 'dd LLL, yyyy')}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-zinc-200">{event.headline}</div>
            {event.category && (
              <div className="rounded-full bg-zinc-700 px-2 py-1 text-xs text-zinc-400">
                {event.category}
              </div>
            )}
          </div>
          <div className="text-zinc-400">
            {event.description}
          </div>
        </div>
      ))}
    </div>
  )
}
