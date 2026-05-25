import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alexandria Dashboard — Marketing Performance',
  description: 'Marketing Performance Dashboard untuk Tim Alexandria Islamic School',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  )
}
