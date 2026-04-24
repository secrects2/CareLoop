import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import OfflineSyncBanner from '@/components/OfflineSyncBanner'

export const metadata: Metadata = {
    title: 'CareLoop',
    description: 'CareLoop — 惠生醫藥集團 ICOPE 前後測系統',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-Hant">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased">
                <OfflineSyncBanner />
                {children}
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#1e293b',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                        },
                    }}
                />
            </body>
        </html>
    )
}
