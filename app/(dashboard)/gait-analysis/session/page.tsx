'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

// Dynamic import to avoid SSR issues with webcam/mediapipe
const GaitCam = dynamic(() => import('@/components/gait/GaitCam'), { ssr: false })

export default function GaitSessionPage() {
    const router = useRouter()

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <GaitCam
                onClose={() => router.push('/gait-analysis')}
                onSessionEnd={(summary) => {
                    console.log('Gait session summary:', summary)
                }}
            />
        </div>
    )
}
