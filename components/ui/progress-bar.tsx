import React from 'react'
import * as RadixProgress from '@radix-ui/react-progress'

interface ProgressBarProps {
  value: number
  max?: number
  width?: string
  height?: string
  color?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  width = 'w-full',
  height = 'h-4',
  color = 'bg-blue-500'
}) => {
  const progressValue = Math.min(value, max) // Ensure the value doesn't exceed max

  return (
    <RadixProgress.Root
      className={`relative overflow-hidden ${width} ${height} bg-gray-200 rounded-full`}
      value={progressValue}
    >
      <RadixProgress.Indicator
        className={`h-full transition-transform duration-300 ease-in-out ${color}`}
        style={{ width: `${(progressValue / max) * 100}%` }}
      />
    </RadixProgress.Root>
  )
}

export { ProgressBar }
