'use client'

import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-in fade-in duration-200">
            <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                </div>
            </div>
            <p className="text-sm font-medium text-slate-400 mt-1">載入中...</p>
        </div>
    )
}
