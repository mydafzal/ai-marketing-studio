export const StockSkeleton = () => {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-green-400">
      <div className="float-right inline-block w-fit rounded-full bg-zinc-700 px-2 py-1 text-xs text-transparent">
        xxxxxxx
      </div>
      <div className="mb-1 w-fit rounded-md bg-zinc-700 text-lg text-transparent">
        xxxx xxxx xxxx
      </div>
      <div className="w-fit rounded-md bg-zinc-700 text-3xl font-bold text-transparent">
        xxxx
      </div>
      <div className="text mt-1 w-fit rounded-md bg-zinc-700 text-xs text-transparent">
        xxxxxx xxx xx xxxx xx xxx
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">
          xxxxx: xxx
        </div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">
          xxxxxxxxxxx: xxx
        </div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">
          xxx: xxx
        </div>
        <div className="w-full rounded-md bg-zinc-700 text-sm text-transparent">
          xxxxx: xxx
        </div>
      </div>

      <div className="relative -mx-4 cursor-col-resize mt-4">
        <div style={{ height: 146 }}></div>
      </div>
    </div>
  )
}