import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'
import { Geist, Geist_Mono } from 'next/font/google'
import SyncUser from '@/components/auth/SyncUser'
import { Toaster } from '@/components/ui/sonner'
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
  title: 'Velo Repar Lyon',
  description: 'Service de réparation de vélos à domicile sur Lyon',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <SyncUser />
            {children}
            <Toaster position="bottom-right" />
          </body>
        </html>
      </ClerkProvider>
      )
}