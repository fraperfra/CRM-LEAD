import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
// const inter = { className: 'font-sans' }

export const metadata: Metadata = {
    title: 'ValutaCasa CRM',
    description: 'CRM per agenzie immobiliari',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="it">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
