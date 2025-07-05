// packages/react-frontend/src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'TimeSync - IT Service Desk Clock-In',
  description: 'IT Service Desk Clock-In System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}