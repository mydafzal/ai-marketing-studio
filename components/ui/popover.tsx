'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(
  (
    { className, sideOffset = 4, side = 'top', align = 'center', ...props },
    ref
  ) => (
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      side={side}
      align={align}
      className={cn(
        'z-50 bg-white min-w-52 dark:bg-black  shadow-lg rounded-md p-4 ',
        className
      )}
      {...props}
    >
      {props.children}
      <PopoverPrimitive.Arrow className="fill-white dark:fill-black" />
    </PopoverPrimitive.Content>
  )
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
