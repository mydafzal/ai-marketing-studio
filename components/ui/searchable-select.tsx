'use client'

import { useState } from 'react'
import { cn } from "@/lib/utils"
import { CaretSortIcon } from "@radix-ui/react-icons"
import { Check } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from '@/components/ui/input'

interface SearchableSelectProps {
  value?: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Search...",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  
  const selectedLabel = options.find(option => option.value === value)?.label || placeholder

  const [query, setQuery] = useState('')
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100",
            className
          )}
        >
          <span>{selectedLabel}</span>
          <CaretSortIcon className="size-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2" align="start" side="bottom">
        <div className="space-y-2">
          <Input
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
          />
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-2 text-sm text-gray-500 dark:text-zinc-400">
                No results found.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer",
                      "text-gray-900 dark:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    )}
                  >
                    {option.label}
                    {value === option.value && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}