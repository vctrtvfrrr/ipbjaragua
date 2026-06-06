import MainNav from '@/components/MainNav'
import SocialLinks from '@/components/SocialLinks'
import type { Metadata } from 'next'
import { PT_Sans, PT_Sans_Narrow, PT_Serif } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
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
    <html
      lang="pt-BR"
      className={`${ptSans.variable} ${ptSerif.variable} ${ptSansNarrow.variable} h-full antialiased`}
    >
      <body className="font-serif">
        <header className="container mx-auto p-4 xl:px-0">
          <div className="-mx-2 my-2 flex flex-wrap justify-center overflow-hidden px-5 md:justify-start lg:px-2">
            <div className="overflow-hidden px-2 text-center md:text-left">
              <h1 className="font-serif text-2xl font-bold text-gray-600">
                <Link href="/">
                  <Image
                    src="/images/logo.svg"
                    width={50}
                    height={40}
                    alt="IPB de Jaraguá do Sul"
                    className="mr-2 inline-block align-bottom"
                  />
                  IPB de Jaraguá do Sul
                </Link>
              </h1>
            </div>

            <nav className="my-2 mr-4 ml-auto overflow-hidden px-2 text-center md:text-left">
              <MainNav />
            </nav>

            <div className="my-2 overflow-hidden px-2 text-center md:text-right">
              <SocialLinks />
            </div>
          </div>
        </header>

        <section>{children}</section>

        <footer className="bg-gray-100 text-center sm:text-left">
          <div className="container mx-auto p-4 xl:px-0">
            <MainNav />
            <div className="px-3 sm:flex">
              <div className="w-full sm:w-1/2">
                <h4 className="pt-10 font-serif text-2xl font-bold">IPB de Jaraguá do Sul</h4>
                <span className="block pt-1 text-xs font-light tracking-wider">
                  &copy; 2026 Todos os direitos reservados.
                </span>
              </div>
              <div className="mt-10 w-full text-center sm:mt-0 sm:w-1/2 md:text-right">
                <SocialLinks />
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
