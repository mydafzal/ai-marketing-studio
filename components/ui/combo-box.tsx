import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconTrash } from '@/components/ui/icons'

interface ComboBoxProps {
  selectedOptions: {
    value: string
    label: string
  }[]
  options: {
    value: string
    label: string
  }[]
  onChangeKeyword: (value: string) => void
  onSelect: (value: string) => void
  onRemove: (value: string) => void
}

const ComboBox: React.FC<ComboBoxProps> = ({
  selectedOptions,
  options,
  onSelect,
  onRemove,
  onChangeKeyword
}) => {
  const [query, setQuery] = useState('')
  return (
    <div className="relative w-full">
     
      <Input
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          onChangeKeyword(e.target.value)
        }}
        placeholder="Enter city name"
        className={`dark:bg-zinc-700 dark:text-zinc-200`}
      />
      {options.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto focus:outline-none">
          {options.map((option, index) => (
            <li
              key={index}
              onClick={() => {
                onSelect(option.value)
                setQuery('')
              }}
              className="cursor-pointer text-sm select-none relative py-2 pl-3 pr-9 hover:bg-gray-950 hover:text-white"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
       {selectedOptions.length > 0 && (
        <div className="flex gap-x-6">
          {selectedOptions.map(selected => (
            <>
              <div className="flex justify-items-center mt-2">
                <Badge>{selected.label}</Badge>
                <Button
                  variant="ghost"
                  onClick={() => onRemove(selected.value)}
                  className="size-7 p-0 hover:bg-background"
                >
                  <IconTrash />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </>
          ))}
        </div>
      )}
    </div>
  )
}

export { ComboBox }
