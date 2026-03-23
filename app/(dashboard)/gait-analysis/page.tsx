'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Footprints, Play, Info, Video, Smartphone,
    ArrowRight, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react'

export default function GaitAnalysisPage() {
    const router = useRouter()
    const [starting, setStarting] = useState(false)

    const handleStart = () => {
        setStarting(true)
        router.push('/gait-analysis/session')
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
                    >
                        <Footprints className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">3D 步態分析</h1>
                        <p className="text-sm text-slate-500">AI 手機步態風險評估系統</p>
                    </div>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { icon: '🚶', title: '步速分析', desc: '即時偵測步行速度與步頻' },
                    { icon: '⚖️', title: '平衡評估', desc: '軀幹傾斜、晃動與穩定度分析' },
                    { icon: '🛡️', title: '跌倒風險', desc: '綜合評分：低/中/高/極高風險' },
                ].map((f, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
                        <div className="text-3xl mb-3">{f.icon}</div>
                        <h3 className="font-semibold text-slate-800 mb-1">{f.title}</h3>
                        <p className="text-sm text-slate-500">{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* How to Use */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-cyan-500" />
                    使用方式
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { step: '1', title: '架設手機', desc: '橫式、後鏡頭、腰部高度、側面拍攝', icon: Smartphone },
                        { step: '2', title: '走道準備', desc: '至少 4 公尺走道、背景單純、光線充足', icon: ArrowRight },
                        { step: '3', title: '開始分析', desc: '受測者正常行走，系統自動偵測步態', icon: Play },
                        { step: '4', title: '查看報告', desc: '即時 HUD + Session 完整報告 + AI 建議', icon: CheckCircle },
                    ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-sm font-bold shrink-0">
                                {s.step}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">{s.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-amber-800 mb-1">場域注意事項</h3>
                        <ul className="text-xs text-amber-700 space-y-1">
                            <li>• 建議使用<strong>後鏡頭 + 橫式</strong>拍攝，搭配腳架效果最佳</li>
                            <li>• 避免背光（勿讓窗戶在受測者背後）</li>
                            <li>• 受測者須<strong>完整入鏡</strong>（頭到腳可見）</li>
                            <li>• 下肢衣物不可過於寬鬆，鞋子需可見</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleStart}
                    disabled={starting}
                    className="px-8 py-4 rounded-2xl text-lg font-bold text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100 flex items-center gap-3"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
                >
                    {starting ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            正在啟動...
                        </>
                    ) : (
                        <>
                            <Video className="w-6 h-6" />
                            開始步態分析
                        </>
                    )}
                </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
                功能開發中 · Phase 1 MVP
            </p>
        </div>
    )
}
