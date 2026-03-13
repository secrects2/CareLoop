'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { AssessmentWithDetails } from '@/types/icope'
import { STAGE_LABELS, PRIMARY_DOMAIN_LABELS, type PrimaryDomain } from '@/types/icope'

export default function IcopePage() {
    const [assessments, setAssessments] = useState<AssessmentWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchAssessments = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('assessments')
                .select(`
                    *,
                    patients(name, id_number, gender, birth_date),
                    primary_assessments(*),
                    secondary_assessments(*)
                `)
                .order('assessed_at', { ascending: false })

            if (error) {
                toast.error('載入失敗: ' + error.message)
            } else {
                setAssessments(data || [])
            }
            setLoading(false)
        }
        fetchAssessments()
    }, [])

    /** 計算初評異常數 */
    const countAbnormal = (primary: any): number => {
        if (!primary) return 0
        const domains: PrimaryDomain[] = ['cognition', 'mobility', 'nutrition', 'vision', 'hearing', 'depression']
        return domains.filter(d => primary[d] === true).length
    }

    /** 取得異常面向名稱 */
    const getAbnormalLabels = (primary: any): string[] => {
        if (!primary) return []
        const domains: PrimaryDomain[] = ['cognition', 'mobility', 'nutrition', 'vision', 'hearing', 'depression']
        return domains.filter(d => primary[d] === true).map(d => PRIMARY_DOMAIN_LABELS[d])
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">📋 ICOPE 評估</h1>
                    <p className="text-slate-400 text-sm mt-1">長者內在能力檢測前後測管理</p>
                </div>
                <Link
                    href="/icope/new"
                    className="btn-accent text-sm"
                >
                    + 新增評估
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-white">{assessments.length}</p>
                    <p className="text-xs text-slate-400">總評估數</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                        {assessments.filter(a => a.stage === 'initial').length}
                    </p>
                    <p className="text-xs text-slate-400">初評</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                        {assessments.filter(a => a.stage === 'post').length}
                    </p>
                    <p className="text-xs text-slate-400">後測</p>
                </div>
            </div>

            {/* List */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">評估紀錄</h2>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-5xl mb-3">📋</p>
                        <p className="text-lg">尚無評估紀錄</p>
                        <p className="text-sm mt-1">點擊「新增評估」開始第一筆 ICOPE 檢測</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {assessments.map(a => {
                            const abnormalCount = countAbnormal(a.primary_assessments)
                            const abnormalLabels = getAbnormalLabels(a.primary_assessments)

                            return (
                                <div
                                    key={a.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/icope/${a.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${a.stage === 'initial' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
                                            }`}>
                                            {a.stage === 'initial' ? '📝' : '📊'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium">
                                                    {(a.patients as any)?.name || '未知'}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.stage === 'initial'
                                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    }`}>
                                                    {STAGE_LABELS[a.stage]}
                                                </span>
                                                {abnormalCount > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                                        {abnormalCount} 項異常
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {new Date(a.assessed_at).toLocaleDateString('zh-TW')}
                                                {abnormalLabels.length > 0 && (
                                                    <span className="ml-2 text-red-400/70">
                                                        {abnormalLabels.join('、')}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-slate-600 text-sm">→</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
