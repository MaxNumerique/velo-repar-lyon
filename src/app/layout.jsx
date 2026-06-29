import {
  ClerkProvider,
} from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'
import { Geist, Geist_Mono } from 'next/font/google'
import SyncUser from '@/components/auth/SyncUser'
import { Toaster } from '@/components/ui/sonner'
import InstallPrompt from '@/components/shared/InstallPrompt'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Velo Du Pelo',
  description: 'Service de réparation de vélos à domicile sur Lyon',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Velo Repar',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <SyncUser />
            {children}
            <Toaster position="bottom-right" />
            <InstallPrompt />
          </body>
        </html>
      </ClerkProvider>
      )
}