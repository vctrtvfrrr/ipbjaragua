import type { Metadata } from 'next'
import { PT_Sans, PT_Sans_Narrow, PT_Serif } from 'next/font/google'
import './globals.css'

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-pt-sans',
  display: 'swap',
})

const ptSerif = PT_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-pt-serif',
  display: 'swap',
})

const ptSansNarrow = PT_Sans_Narrow({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-pt-sans-narrow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IPB de Jaraguá do Sul',
  description: '',
  icons: {
    icon: '/icons/icon.png',
    apple: '/icons/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${ptSans.variable} ${ptSerif.variable} ${ptSansNarrow.variable} h-full antialiased`}>
      <body>{children}</body>
    </html>
  )
}
