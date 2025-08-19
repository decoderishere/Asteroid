'use client'

import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { type ReactNode } from 'react'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      themes={['light', 'dark', 'system']}
      disableTransitionOnChange={false}
      storageKey="theme"
    >
      {children}
    </NextThemeProvider>
  )
}