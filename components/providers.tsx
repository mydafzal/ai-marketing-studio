'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { I18nProvider } from '@/lib/i18n/context'

interface ProvidersProps extends ThemeProviderProps {
  userLanguage?: string | null; // Add user language prop
}

export function Providers({ children, userLanguage, ...props }: ProvidersProps) {
  // Override any passed props to force dark theme
  const darkThemeProps: ThemeProviderProps = {
    ...props,
    children, // Add children to fix the TypeScript error
    defaultTheme: 'dark',
    forcedTheme: 'dark', // This forces dark mode always
    enableSystem: false, // Don't use system preference
    disableTransitionOnChange: false
  }
  
  return (
    <NextThemesProvider {...darkThemeProps}>
      <SidebarProvider>
        <TooltipProvider>
          <I18nProvider userLanguage={userLanguage}>
            {children}
          </I18nProvider>
        </TooltipProvider>
      </SidebarProvider>
    </NextThemesProvider>
  )
}
