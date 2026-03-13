'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'
import type {
    Patient,
    AssessmentStage,
    PrimaryDomain,
    PrimaryAssessmentInsert,
    SecondaryAssessmentInsert,
} from '@/types/icope'
import {
    STAGE_LABELS,
    PRIMARY_DOMAIN_LABELS,
    PRIMARY_DOMAIN_ICONS,
    SECONDARY_FIELD_LABELS,
    SECONDARY_THRESHOLDS,
    PRIMARY_TO_SECONDARY_MAP,
} from '@/types/icope'

type Step = 'patient' | 'primary' | 'secondary' | 'confirm'

const STEPS: { key: Step; label: string }[] = [
    { key: 'patient', label: '選擇長者' },
    { key: 'primary', label: '初評' },
    { key: 'secondary', label: '複評' },
    { key: 'confirm', label: '確認送出' },
]

export default function NewAssessmentPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('patient')
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // 表單資料
    const [selectedPatientId, setSelectedPatientId] = useState('')
    const [stage, setStage] = useState<AssessmentStage>('initial')
    const [notes, setNotes] = useState('')
    const [primary, setPrimary] = useState<Record<PrimaryDomain, boolean>>({
        cognition: false, mobility: false, nutrition: false,
        vision: false, hearing: false, depression: false,
    })
    const [secondary, setSecondary] = useState<Omit<SecondaryAssessmentInsert, 'assessment_id'>>({
        ad8_score: null, bht_score: null, sppb_score: null,
        mna_sf_score: null, gds15_score: null,
        medication_result: '', social_care_result: '',
    })

    useEffect(() => {
        const fetchPatients = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('patients')
                .select('*')
                .order('name')
            setPatients(data || [])
            setLoading(false)
        }
        fetchPatients()
    }, [])

    /** 取得有異常的面向 */
    const abnormalDomains = (Object.keys(primary) as PrimaryDomain[]).filter(d => primary[d])

    /** 取得需要填寫複評的欄位 */
    const requiredSecondaryFields = abnormalDomains.flatMap(d => PRIMARY_TO_SECONDARY_MAP[d])

    /** 選中的長者 */
    const selectedPatient = patients.find(p => p.id === selectedPatientId)

    /** 儲存評估 */
    const handleSubmit = async () => {
        if (!selectedPatientId) return
        setSaving(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSaving(false); return }

        // 1. 建立評估主記錄
        const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .insert({
                patient_id: selectedPatientId,
                instructor_id: user.id,
                stage,
                notes: notes || null,
            })
            .select('id')
            .single()

        if (assessmentError || !assessment) {
            toast.error('建立評估失敗: ' + (assessmentError?.message || '未知錯誤'))
            setSaving(false)
            return
        }

        // 2. 建立初評記錄
        const { error: primaryError } = await supabase
            .from('primary_assessments')
            .insert({
                assessment_id: assessment.id,
                ...primary,
            })

        if (primaryError) {
            toast.error('儲存初評失敗: ' + primaryError.message)
            setSaving(false)
            return
        }

        // 3. 如有異常項目，建立複評記錄
        if (abnormalDomains.length > 0) {
            const secondaryData: any = { assessment_id: assessment.id }
            requiredSecondaryFields.forEach(field => {
                secondaryData[field] = (secondary as any)[field]
            })

            // 也存入用藥與社會照護（若有填寫）
            if (secondary.medication_result) secondaryData.medication_result = secondary.medication_result
            if (secondary.social_care_result) secondaryData.social_care_result = secondary.social_care_result

            const { error: secondaryError } = await supabase
                .from('secondary_assessments')
                .insert(secondaryData)

            if (secondaryError) {
                toast.error('儲存複評失敗: ' + secondaryError.message)
                setSaving(false)
                return
            }
        }

        toast.success('評估已儲存！')
        logActivity('新增 ICOPE 評估', `長者: ${selectedPatient?.name}, 階段: ${STAGE_LABELS[stage]}, 異常: ${abnormalDomains.length} 項`, 'assessment')
        router.push('/icope')
    }

    const currentStepIndex = STEPS.findIndex(s => s.key === step)

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <button onClick={() => router.push('/icope')} className="text-slate-400 hover:text-white transition-colors text-sm mb-2">
                    ← 返回評估列表
                </button>
                <h1 className="text-2xl font-bold text-white">📋 新增 ICOPE 評估</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2">
                {STEPS.map((s, i) => {
                    // 如果沒有異常項，跳過複評步驟
                    if (s.key === 'secondary' && abnormalDomains.length === 0 && step !== 'secondary') {
                        return (
                            <div key={s.key} className="flex items-center gap-2 flex-1">
                                <div className="h-1 flex-1 rounded bg-white/5" />
                            </div>
                        )
                    }
                    const isActive = s.key === step
                    const isDone = i < currentStepIndex
                    return (
                        <div key={s.key} className="flex items-center gap-2 flex-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive ? 'bg-primary-600 text-white' :
                                    isDone ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-white/5 text-slate-600'
                                }`}>
                                {isDone ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs hidden sm:inline ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                {s.label}
                            </span>
                            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${isDone ? 'bg-emerald-500/30' : 'bg-white/5'}`} />}
                        </div>
                    )
                })}
            </div>

            {/* Step 1: 選擇長者 */}
            {step === 'patient' && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">選擇長者與評估階段</h2>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">評估階段</label>
                        <div className="flex gap-3">
                            {(['initial', 'post'] as AssessmentStage[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStage(s)}
                                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${stage === s
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    {s === 'initial' ? '📝 初評' : '📊 後測'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">選擇長者</label>
                        {loading ? (
                            <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
                        ) : patients.length === 0 ? (
                            <div className="text-center py-6 text-slate-500">
                                <p>尚無長者資料</p>
                                <p className="text-xs mt-1">請先在「長者管理」中新增長者</p>
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                {patients.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPatientId(p.id)}
                                        className={`w-full text-left p-3 rounded-xl transition-colors ${selectedPatientId === p.id
                                                ? 'bg-primary-600/20 border border-primary-500/30'
                                                : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <p className="text-white text-sm font-medium">{p.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {p.id_number} · {p.birth_date}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">備註（選填）</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-primary-500 focus:outline-none resize-none"
                            rows={2}
                            placeholder="輸入備註..."
                        />
                    </div>

                    <button
                        onClick={() => setStep('primary')}
                        disabled={!selectedPatientId}
                        className="w-full btn-accent text-sm disabled:opacity-30"
                    >
                        下一步 →
                    </button>
                </div>
            )}

            {/* Step 2: 初評 */}
            {step === 'primary' && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">初評 — 6 大面向</h2>
                    <p className="text-xs text-slate-500">勾選有異常的面向，異常項將觸發複評</p>

                    <div className="grid grid-cols-2 gap-3">
                        {(Object.keys(PRIMARY_DOMAIN_LABELS) as PrimaryDomain[]).map(domain => (
                            <button
                                key={domain}
                                onClick={() => setPrimary(prev => ({ ...prev, [domain]: !prev[domain] }))}
                                className={`p-4 rounded-xl text-left transition-all ${primary[domain]
                                        ? 'bg-red-500/15 border-2 border-red-500/40'
                                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <div className="text-2xl mb-1">{PRIMARY_DOMAIN_ICONS[domain]}</div>
                                <p className={`text-sm font-medium ${primary[domain] ? 'text-red-400' : 'text-white'}`}>
                                    {PRIMARY_DOMAIN_LABELS[domain]}
                                </p>
                                <p className="text-[10px] mt-0.5 text-slate-500">
                                    {primary[domain] ? '⚠️ 異常' : '正常'}
                                </p>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep('patient')} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-colors">
                            ← 上一步
                        </button>
                        <button
                            onClick={() => setStep(abnormalDomains.length > 0 ? 'secondary' : 'confirm')}
                            className="flex-1 btn-accent text-sm"
                        >
                            {abnormalDomains.length > 0 ? '下一步（複評）→' : '確認送出 →'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: 複評 */}
            {step === 'secondary' && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">複評 — 異常項目詳細評分</h2>
                    <p className="text-xs text-slate-500">
                        異常面向：{abnormalDomains.map(d => PRIMARY_DOMAIN_LABELS[d]).join('、')}
                    </p>

                    <div className="space-y-4">
                        {requiredSecondaryFields.map(field => {
                            const label = SECONDARY_FIELD_LABELS[field] || field
                            const threshold = SECONDARY_THRESHOLDS[field]
                            const isNumeric = field.endsWith('_score')

                            return (
                                <div key={field}>
                                    <label className="block text-sm text-slate-300 mb-1">
                                        {label}
                                        {threshold && (
                                            <span className="text-[10px] text-slate-500 ml-2">
                                                （{threshold.label}）
                                            </span>
                                        )}
                                    </label>
                                    {isNumeric ? (
                                        <input
                                            type="number"
                                            value={(secondary as any)[field] ?? ''}
                                            onChange={e => {
                                                const val = e.target.value === '' ? null : Number(e.target.value)
                                                setSecondary(prev => ({ ...prev, [field]: val }))
                                            }}
                                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-primary-500 focus:outline-none"
                                            placeholder={`輸入${label}分數`}
                                        />
                                    ) : (
                                        <textarea
                                            value={(secondary as any)[field] || ''}
                                            onChange={e => setSecondary(prev => ({ ...prev, [field]: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-primary-500 focus:outline-none resize-none"
                                            rows={2}
                                            placeholder={`輸入${label}結果`}
                                        />
                                    )}
                                </div>
                            )
                        })}

                        {/* 用藥和社會照護永遠顯示 */}
                        <div>
                            <label className="block text-sm text-slate-300 mb-1">用藥評估（選填）</label>
                            <textarea
                                value={secondary.medication_result || ''}
                                onChange={e => setSecondary(prev => ({ ...prev, medication_result: e.target.value }))}
                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-primary-500 focus:outline-none resize-none"
                                rows={2}
                                placeholder="輸入用藥評估結果"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300 mb-1">社會照護與支持評估（選填）</label>
                            <textarea
                                value={secondary.social_care_result || ''}
                                onChange={e => setSecondary(prev => ({ ...prev, social_care_result: e.target.value }))}
                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-primary-500 focus:outline-none resize-none"
                                rows={2}
                                placeholder="輸入社會照護評估結果"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep('primary')} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-colors">
                            ← 上一步
                        </button>
                        <button onClick={() => setStep('confirm')} className="flex-1 btn-accent text-sm">
                            確認送出 →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: 確認 */}
            {step === 'confirm' && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">確認評估內容</h2>

                    {/* 摘要 */}
                    <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-xs text-slate-500">長者</p>
                            <p className="text-white font-medium">{selectedPatient?.name} ({selectedPatient?.id_number})</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-xs text-slate-500">評估階段</p>
                            <p className="text-white font-medium">{STAGE_LABELS[stage]}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-xs text-slate-500">初評結果</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {(Object.keys(PRIMARY_DOMAIN_LABELS) as PrimaryDomain[]).map(d => (
                                    <span key={d} className={`px-2 py-1 rounded-lg text-xs ${primary[d]
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-emerald-500/10 text-emerald-400/60'
                                        }`}>
                                        {PRIMARY_DOMAIN_ICONS[d]} {PRIMARY_DOMAIN_LABELS[d]}：{primary[d] ? '異常' : '正常'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {abnormalDomains.length > 0 && (
                            <div className="p-3 rounded-xl bg-white/5">
                                <p className="text-xs text-slate-500">複評分數</p>
                                <div className="space-y-1 mt-1">
                                    {requiredSecondaryFields.map(field => {
                                        const val = (secondary as any)[field]
                                        return val != null && val !== '' ? (
                                            <p key={field} className="text-sm text-slate-300">
                                                {SECONDARY_FIELD_LABELS[field]}：<span className="text-white font-medium">{val}</span>
                                            </p>
                                        ) : null
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep(abnormalDomains.length > 0 ? 'secondary' : 'primary')}
                            className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-colors"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex-1 btn-accent text-sm disabled:opacity-50"
                        >
                            {saving ? '儲存中...' : '✓ 確認送出'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
