import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TCG Community Market',
  description: 'Buy, sell, and trade Magic: The Gathering cards in a community-driven marketplace.',
  keywords: ['MTG', 'Magic the Gathering', 'TCG', 'marketplace', 'cards', 'buy', 'sell'],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
