import type { Metadata, Viewport } from 'next'

import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Space_Grotesk, JetBrains_Mono, Fraunces } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

// Initialize fonts - Neo-brutalist typography
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-space-grotesk',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'], 
  weight: ["400", "500", "600", "700"],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})
const fraunces = Fraunces({ 
  subsets: ['latin'], 
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Finflow - All-in-One Finance Management',
  description: 'Streamline your finances with Finflow. Budget management, invoicing, expense tracking, and more for individuals and businesses.',
  generator: 'v0.app',
  keywords: ['finance', 'budget', 'invoicing', 'expense tracking', 'accounting', 'business'],
  authors: [{ name: 'Finflow' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
