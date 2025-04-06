import React from 'react'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-[#8A8F99]',
        className
      )}
      {...props}
    >
        Reeply AI&apos;s decisions on marketing campaigns are reviewed and overseen by marketing experts to ensure high-quality results.
    </p>
  )
}
