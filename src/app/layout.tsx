import './globals.css'
import { Inter } from '@next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Labulous Lab Management Platform',
  description: 'Streamline your dental lab operations with Labulous',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}