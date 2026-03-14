'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { AssessmentStage } from '@/types/icope'
import PrimaryAssessmentForm from '@/components/icope/PrimaryAssessmentForm'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

/** 統一的長者資料（來自 elders 表） */
interface ElderRow {
    id: string
    name: string
    gender: string | null
    birth_date: string | null
    notes: string | null
}

export default function NewAssessmentPage() {
    const router = useRouter()
    const [elders, setElders] = useState<ElderRow[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedElderId, setSelectedElderId] = useState('')
    const [stage, setStage] = useState<AssessmentStage>('initial')
    const [showForm, setShowForm] = useState(false)
    const [patientId, setPatientId] = useState<string | null>(null)
    const [syncing, setSyncing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // === 新增：追蹤長者的初評狀態 ===
    const [hasInitial, setHasInitial] = useState<boolean | null>(null)
    const [checkingStatus, setCheckingStatus] = useState(false)

    // 從 elders 表取資料（所有長輩的統一來源）
    useEffect(() => {
        const fetchElders = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('elders')
                .select('id, name, gender, birth_date, notes')
                .eq('instructor_id', user.id)
                .order('name')

            setElders(data || [])
            setLoading(false)
        }
        fetchElders()
    }, [])

    // === 新增：選擇長者時，檢查是否已有初評紀錄 ===
    useEffect(() => {
        if (!selectedElderId) {
            setHasInitial(null)
            return
        }
        const selectedElder = elders.find(e => e.id === selectedElderId)
        if (!selectedElder) return

        const checkExisting = async () => {
            setCheckingStatus(true)
            setHasInitial(null)

            try {
                const supabase = createClient()

                // 先找 patients 表對應的 patient_id
                let query = supabase
                    .from('patients')
                    .select('id')
                    .eq('name', selectedElder.name)

                if (selectedElder.birth_date) {
                    query = query.eq('birth_date', selectedElder.birth_date)
                }

                const { data: patients } = await query

                if (!patients || patients.length === 0) {
                    // 沒有 patient 記錄 → 一定沒有初評
                    setHasInitial(false)
                    setStage('initial')
                    setCheckingStatus(false)
                    return
                }

                // 查該 patient 是否有 initial stage 的 assessment
                const patientIds = patients.map(p => p.id)
                const { data: assessments } = await supabase
                    .from('assessments')
                    .select('id, stage')
                    .in('patient_id', patientIds)
                    .eq('stage', 'initial')
                    .limit(1)

                const exists = (assessments && assessments.length > 0)
                setHasInitial(exists)
                // 自動切換到正確的階段
                setStage(exists ? 'post' : 'initial')
            } catch (err) {
                console.error('檢查初評狀態失敗:', err)
            } finally {
                setCheckingStatus(false)
            }
        }

        checkExisting()
    }, [selectedElderId, elders])

    const selectedElder = elders.find(e => e.id === selectedElderId)

    const filteredElders = elders.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    /**
     * 開始評估：確保 patients 表有對應記錄
     */
    const handleStartAssessment = async () => {
        if (!selectedElder) return

        // 規則驗證
        if (stage === 'initial' && hasInitial) {
            toast.error('此長者已完成初評，請選擇「後測」')
            return
        }
        if (stage === 'post' && !hasInitial) {
            toast.error('此長者尚未完成初評，請先進行「初評」')
            return
        }

        setSyncing(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('未登入')

            // 查 patients 表是否有同名同生日的記錄
            let query = supabase
                .from('patients')
                .select('id')
                .eq('name', selectedElder.name)

            if (selectedElder.birth_date) {
                query = query.eq('birth_date', selectedElder.birth_date)
            }

            const { data: existingPatients } = await query

            if (existingPatients && existingPatients.length > 0) {
                setPatientId(existingPatients[0].id)
            } else {
                const { data: newPatient, error } = await supabase
                    .from('patients')
                    .insert({
                        instructor_id: user.id,
                        name: selectedElder.name,
                        id_number: `SYNC-${selectedElder.id.slice(0, 8).toUpperCase()}`,
                        gender: selectedElder.gender || 'male',
                        birth_date: selectedElder.birth_date || new Date().toISOString().slice(0, 10),
                        notes: selectedElder.notes || null,
                        chronic_diseases: [],
                    })
                    .select('id')
                    .single()

                if (error) throw new Error(error.message)
                setPatientId(newPatient.id)
                toast.success('長者資料已自動同步至 ICOPE 系統')
            }

            setShowForm(true)
        } catch (err: any) {
            toast.error('資料同步失敗: ' + err.message)
        } finally {
            setSyncing(false)
        }
    }

    // 已選好長者 → 顯示初評表單
    if (showForm && patientId && selectedElder) {
        return (
            <div className="max-w-2xl mx-auto">
                <PrimaryAssessmentForm
                    patientId={patientId}
                    patientName={selectedElder.name}
                    stage={stage}
                />
            </div>
        )
    }

    // 選擇長者 & 評估階段
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <button onClick={() => router.push('/icope')} className="text-[#666] hover:text-[#333] transition-colors text-sm mb-2">
                    ← 返回評估列表
                </button>
                <h1 className="text-2xl font-bold text-[#333]">📋 新增 ICOPE 評估</h1>
            </div>

            {/* 先選長者 */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="section-title">選擇長者</h2>
                    <Link href="/elders?add=true" className="text-xs text-teal-600 hover:underline">
                        + 新增長者
                    </Link>
                </div>

                {elders.length > 5 && (
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="搜尋姓名..."
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f5f5f5] border border-[#eee] text-[#333] placeholder-[#999] focus:border-teal-500 focus:outline-none transition-colors text-sm"
                    />
                )}

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredElders.length === 0 ? (
                    <div className="text-center py-8 text-[#888]">
                        <p className="text-4xl mb-2">👤</p>
                        <p>尚無長者資料</p>
                        <Link href="/elders?add=true" className="text-sm text-teal-600 hover:underline mt-2 inline-block">
                            前往新增長者 →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                        {filteredElders.map(elder => (
                            <button
                                key={elder.id}
                                onClick={() => setSelectedElderId(elder.id)}
                                className={`w-full text-left p-4 rounded-xl transition-all ${selectedElderId === elder.id
                                    ? 'bg-teal-50 border-2 border-teal-400'
                                    : 'bg-[#f5f5f5] border-2 border-transparent hover:bg-[#f0f0f0]'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white ${elder.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                                        {elder.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-[#333] font-medium">{elder.name}</p>
                                        <p className="text-xs text-[#888] mt-0.5">
                                            {elder.gender === 'female' ? '女' : '男'}
                                            {elder.birth_date && ` · ${elder.birth_date}`}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 評估階段 — 根據長者的初評狀態自動限制 */}
            {selectedElderId && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="section-title">評估階段</h2>

                    {checkingStatus ? (
                        <div className="flex items-center gap-2 text-sm text-[#888]">
                            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            正在檢查評估紀錄...
                        </div>
                    ) : hasInitial === null ? null : (
                        <>
                            {/* 狀態提示 */}
                            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${hasInitial
                                ? 'bg-teal-50 text-teal-700'
                                : 'bg-amber-50 text-amber-700'
                                }`}>
                                {hasInitial ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>此長者<strong>已完成初評</strong>，可進行後測。</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>此長者<strong>尚未初評</strong>，需先完成初評才能後測。</span>
                                    </>
                                )}
                            </div>

                            {/* 階段按鈕 — disabled 對應狀態 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStage('initial')}
                                    disabled={hasInitial === true}
                                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${hasInitial
                                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                            : stage === 'initial'
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee]'
                                        }`}
                                >
                                    📝 初評 {hasInitial ? '（已完成）' : ''}
                                </button>
                                <button
                                    onClick={() => setStage('post')}
                                    disabled={hasInitial === false}
                                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${!hasInitial
                                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                            : stage === 'post'
                                                ? 'bg-teal-500 text-white'
                                                : 'bg-[#f5f5f5] text-[#666] hover:bg-[#eee]'
                                        }`}
                                >
                                    📊 後測 {!hasInitial ? '（需先初評）' : ''}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <button
                onClick={handleStartAssessment}
                disabled={!selectedElderId || syncing || checkingStatus || hasInitial === null}
                className="w-full btn-primary text-base py-3.5 disabled:opacity-30"
            >
                {syncing ? '同步資料中...' : stage === 'initial' ? '開始初評 →' : '開始後測 →'}
            </button>
        </div>
    )
}

