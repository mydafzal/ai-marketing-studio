import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface ComboBoxProps {
  options: string[]
  onSelect: (value: string) => void
}

const ComboBox: React.FC<ComboBoxProps> = ({ options, onSelect }) => {
  const [query, setQuery] = useState('')
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])

  useEffect(() => {
    if (query === '') {
      setFilteredOptions([])
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }, [query, options])

  return (
    <div className="relative w-full">
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Enter city name"
        className={`dark:bg-zinc-700 dark:text-zinc-200`}
      />
      {filteredOptions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto focus:outline-none">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onClick={() => {
                onSelect(option)
                setQuery(option)
                setFilteredOptions([])
              }}
              className="cursor-pointer text-sm select-none relative py-2 pl-3 pr-9 hover:bg-gray-950 hover:text-white"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { ComboBox }
