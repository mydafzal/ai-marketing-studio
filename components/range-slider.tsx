import React, { useState, useEffect, useRef, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'

interface RangeSliderProps {
  initialMin: number
  initialMax: number
  min: number
  max: number
  step: number
  priceCap: number
  onChange: (min: number, max: number) => void
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  initialMin,
  initialMax,
  min,
  max,
  step,
  priceCap,
  onChange
}) => {
  const progressRef = useRef<HTMLDivElement>(null)
  const [minValue, setMinValue] = useState<number>(initialMin)
  const [maxValue, setMaxValue] = useState<number>(initialMax)

  const handleMin = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (maxValue - minValue >= priceCap && maxValue <= max) {
      if (value <= maxValue) {
        setMinValue(value)
      }
    } else {
      if (value < minValue) {
        setMinValue(value)
      }
    }
  }

  const handleMax = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (maxValue - minValue >= priceCap && maxValue <= max) {
      if (value >= minValue) {
        setMaxValue(value)
      }
    } else {
      if (value > maxValue) {
        setMaxValue(value)
      }
    }
  }

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.left = (minValue / max) * step + '%'
      progressRef.current.style.right = (step - maxValue / max) * step + '%'
    }
  }, [minValue, maxValue, max, step])
  useEffect(() => {
    onChange(minValue, maxValue)
  }, [minValue, maxValue])
  return (
    <div className="grid place-items-center">
      <div className="flex flex-col w-full">
        <div className=" mb-6">
          <div className="rounded-md">
            <span className="py-2 text-sm"> Min age:</span>
            <Input
              onChange={e => setMinValue(parseInt(e.target.value))}
              type="number"
              value={minValue}
              className="w-24 "
            />
          </div>
          <div>
            <span className="py-2 text-sm"> Max age:</span>
            <Input
              onChange={e => setMaxValue(parseInt(e.target.value))}
              type="number"
              value={maxValue}
              className="w-24 "
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="slider relative h-1 rounded-md bg-gray-300">
            <div
              className="progress absolute h-1 bg-green-300 rounded"
              ref={progressRef}
            ></div>
          </div>

          <div className="range-input relative">
            <input
              onChange={handleMin}
              type="range"
              min={min}
              step={step}
              max={max}
              value={minValue}
              className="range-min absolute w-full -top-1 h-1 bg-transparent appearance-none pointer-events-none"
            />

            <input
              onChange={handleMax}
              type="range"
              min={min}
              step={step}
              max={max}
              value={maxValue}
              className="range-max absolute w-full -top-1 h-1 bg-transparent appearance-none pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export { RangeSlider }
