import React from 'react'
import { useT } from '@/lib/i18n/context'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  const t = useT()
  
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-[#8A8F99]',
        className
      )}
      {...props}
    >
        {t('footer.marketingExpertise')}
    </p>
  )
}
