import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: '活動簽到',
    description: '掃描 QR Code 完成 LINE 簽到',
}

export default function CheckinLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50">
            {children}
        </div>
    )
}
