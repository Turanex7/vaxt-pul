import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'PayPulse — ödənişlər və son tarixlər',
  description:
    'Növbəti 30 gündə nə qədər ödəyəcəksən və hansı tarixi qaçırmamalısan? Abunələr, kommunal, kredit və sığorta bir yerdə.',
  generator: 'v0.app',
  icons: {
    icon: '/paypulse-icon.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f9f9fc',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="az" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
