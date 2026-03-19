import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, DM_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const display = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
})

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})

const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Speel Support Tracker',
  description: 'Shift ownership, handovers, and team coverage — all in one place.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
