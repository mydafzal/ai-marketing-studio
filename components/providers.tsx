'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children, ...props }: ThemeProviderProps) {
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
        <TooltipProvider>{children}</TooltipProvider>
      </SidebarProvider>
    </NextThemesProvider>
  )
}
