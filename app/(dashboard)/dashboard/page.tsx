'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
    elderCount: number
    sessionCount: number
    preTestCount: number
    postTestCount: number
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({ elderCount: 0, sessionCount: 0, preTestCount: 0, postTestCount: 0 })
    const [recentSessions, setRecentSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 取得長輩數量
            const { count: elderCount } = await supabase
                .from('elders')
                .select('*', { count: 'exact', head: true })
                .eq('instructor_id', user.id)

            // 取得分析會話統計
            const { data: sessions } = await supabase
                .from('analysis_sessions')
                .select('id, test_type, created_at, elder_id, elders(name)')
                .eq('instructor_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            const preCount = sessions?.filter(s => s.test_type === 'pre').length || 0
            const postCount = sessions?.filter(s => s.test_type === 'post').length || 0

            setStats({
                elderCount: elderCount || 0,
                sessionCount: sessions?.length || 0,
                preTestCount: preCount,
                postTestCount: postCount,
            })
            setRecentSessions(sessions || [])
            setLoading(false)
        }

        fetchData()
    }, [])

    const statsCards = [
        { label: '管理長輩', value: stats.elderCount, icon: '👥', color: 'from-blue-500 to-blue-700' },
        { label: '分析次數', value: stats.sessionCount, icon: '🤖', color: 'from-emerald-500 to-emerald-700' },
        { label: '前測完成', value: stats.preTestCount, icon: '📋', color: 'from-amber-500 to-amber-700' },
        { label: '後測完成', value: stats.postTestCount, icon: '✅', color: 'from-purple-500 to-purple-700' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">儀表板</h1>
                    <p className="text-slate-400 text-sm mt-1">歡迎回來，查看您的數據概覽</p>
                </div>
                <Link href="/elders?add=true" className="btn-primary text-center text-sm">
                    + 新增長輩
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((card, i) => (
                    <div key={i} className="glass-card p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                        <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[40px] bg-gradient-to-br ${card.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                        <p className="text-3xl mb-1">{card.icon}</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {loading ? <span className="inline-block w-8 h-6 bg-slate-700 rounded animate-pulse" /> : card.value}
                        </p>
                        <p className="text-sm text-slate-400">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions — with images */}
            <div className="glass-card p-6">
                <h2 className="section-title mb-4">快速操作</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link href="/elders" className="group rounded-2xl overflow-hidden border border-[#eee] hover:shadow-md transition-shadow">
                        <div className="relative h-40 overflow-hidden">
                            <img src="/images/health-assessment.png" alt="管理長輩" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <p className="absolute bottom-2 left-3 text-white font-bold text-sm">管理長輩</p>
                        </div>
                        <div className="p-3">
                            <p className="text-xs text-[#888]">新增或查看長輩資料</p>
                        </div>
                    </Link>
                    <Link href="/elders" className="group rounded-2xl overflow-hidden border border-[#eee] hover:shadow-md transition-shadow">
                        <div className="relative h-40 overflow-hidden">
                            <img src="/images/floor-curling.png" alt="開始分析" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <p className="absolute bottom-2 left-3 text-white font-bold text-sm">開始分析</p>
                        </div>
                        <div className="p-3">
                            <p className="text-xs text-[#888]">選擇長輩進行 AI 動作分析</p>
                        </div>
                    </Link>
                    <Link href="/elders" className="group rounded-2xl overflow-hidden border border-[#eee] hover:shadow-md transition-shadow">
                        <div className="relative h-40 overflow-hidden">
                            <img src="/images/exercise-elderly.png" alt="匯出報告" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <p className="absolute bottom-2 left-3 text-white font-bold text-sm">匯出報告</p>
                        </div>
                        <div className="p-3">
                            <p className="text-xs text-[#888]">下載前後測 Excel 檔案</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Sessions */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">最近分析紀錄</h2>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : recentSessions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <p className="text-4xl mb-3">📭</p>
                        <p>尚無分析紀錄</p>
                        <p className="text-sm mt-1">前往「長輩管理」新增長輩後開始分析</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentSessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-100 hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${session.test_type === 'pre' ? 'bg-amber-500/20 text-amber-400' :
                                        session.test_type === 'post' ? 'bg-emerald-500/20 text-emerald-400' :
                                            'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        {session.test_type === 'pre' ? '前測' : session.test_type === 'post' ? '後測' : '練習'}
                                    </span>
                                    <span className="text-slate-800 text-sm">{(session.elders as any)?.name || '未知'}</span>
                                </div>
                                <span className="text-xs text-slate-500">
                                    {new Date(session.created_at).toLocaleDateString('zh-TW')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
