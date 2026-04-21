'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'
import dynamic from 'next/dynamic'
import {
    judgeCognition,
    judgeMobility,
    judgeNutrition,
    judgeVision,
    judgeHearing,
    judgeDepression,
} from '@/lib/icope/icope-judgment'
import type {
    CognitionDetails,
    MobilityDetails,
    NutritionDetails,
    VisionDetails,
    HearingDetails,
    DepressionDetails,
    PrimaryDomain,
} from '@/types/icope'

// 動態載入 AI 相機元件
const ChairStandCamera = dynamic(() => import('@/components/icope/ChairStandCamera'), { ssr: false })

// ============================================================================
// 步驟設定
// ============================================================================

const STEPS: { key: PrimaryDomain; icon: string; title: string; shortTitle: string }[] = [
    { key: 'cognition', icon: '🧠', title: 'A. 認知功能', shortTitle: '認知' },
    { key: 'mobility', icon: '🦿', title: 'B. 行動功能', shortTitle: '行動' },
    { key: 'nutrition', icon: '🍎', title: 'C. 營養不良', shortTitle: '營養' },
    { key: 'vision', icon: '👁️', title: 'D. 視力障礙', shortTitle: '視力' },
    { key: 'hearing', icon: '👂', title: 'E. 聽力障礙', shortTitle: '聽力' },
    { key: 'depression', icon: '💭', title: 'F. 憂鬱', shortTitle: '憂鬱' },
]

const TOTAL_STEPS = STEPS.length // 6 面向 + 最後總覽在另外處理

// ============================================================================
// 複評任務
// ============================================================================

type SecondaryTask = 'AD8' | 'BHT' | 'SPPB' | 'MNA-SF' | 'GDS-15' | 'Meds' | 'Social'

const TASK_LABELS: Record<SecondaryTask, string> = {
    'AD8': 'AD8 認知量表',
    'BHT': 'BHT 腦力健診',
    'SPPB': 'SPPB 行動量表',
    'MNA-SF': 'MNA-SF 營養量表',
    'GDS-15': 'GDS-15 憂鬱量表',
    'Meds': '用藥評估',
    'Social': '社會照護與支持評估',
}

const TASK_ICONS: Record<SecondaryTask, string> = {
    'AD8': '🧠',
    'BHT': '🧠',
    'SPPB': '🦿',
    'MNA-SF': '🍎',
    'GDS-15': '💭',
    'Meds': '💊',
    'Social': '🤝',
}

// ============================================================================
// Props
// ============================================================================

interface PrimaryAssessmentFormProps {
    patientId: string
    patientName: string
    stage: 'initial' | 'post'
}

// ============================================================================
// Component
// ============================================================================

export default function PrimaryAssessmentForm({
    patientId,
    patientName,
    stage,
}: PrimaryAssessmentFormProps) {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [showSummary, setShowSummary] = useState(false)
    const [aiCameraOpen, setAiCameraOpen] = useState(false)

    // === 各面向細項狀態 ===
    const [cognition, setCognition] = useState<CognitionDetails>({
        memory_repeat: true,
        orientation_date: true,
        orientation_place: true,
        memory_recall: true,
    })

    const [mobility, setMobility] = useState<MobilityDetails>({
        chair_stand_seconds: null,
        completed: true,
    })

    const [nutrition, setNutrition] = useState<NutritionDetails>({
        weight_loss: false,
        appetite_loss: false,
    })

    const [vision, setVision] = useState<VisionDetails>({
        difficulty_reported: false,
        who_far_pass: null,
        who_near_pass: null,
        high_risk_eye: false,
    })

    const [hearing, setHearing] = useState<HearingDetails>({
        group1_pass: true,
        group2_pass: null,
    })

    const [depression, setDepression] = useState<DepressionDetails>({
        feeling_hopeless: false,
        reduced_interest: false,
    })

    // === 自動判定結果 ===
    const results = useMemo(() => ({
        cognition: judgeCognition(cognition),
        mobility: judgeMobility(mobility),
        nutrition: judgeNutrition(nutrition),
        vision: judgeVision(vision),
        hearing: judgeHearing(hearing),
        depression: judgeDepression(depression),
    }), [cognition, mobility, nutrition, vision, hearing, depression])

    // === 複評任務清單 ===
    const secondaryTasks = useMemo<SecondaryTask[]>(() => {
        const tasks: SecondaryTask[] = []
        if (results.cognition) tasks.push('AD8', 'BHT')
        if (results.mobility) tasks.push('SPPB')
        if (results.nutrition) tasks.push('MNA-SF')
        if (results.depression) tasks.push('GDS-15')
        if (tasks.length > 0) tasks.push('Meds', 'Social')
        return tasks
    }, [results])

    const abnormalCount = useMemo(() =>
        Object.values(results).filter(Boolean).length
    , [results])

    // === 導覽 ===
    const goNext = useCallback(() => {
        if (currentStep < TOTAL_STEPS - 1) {
            setCurrentStep(s => s + 1)
        } else {
            setShowSummary(true)
        }
    }, [currentStep])

    const goPrev = useCallback(() => {
        if (showSummary) {
            setShowSummary(false)
        } else if (currentStep > 0) {
            setCurrentStep(s => s - 1)
        }
    }, [currentStep, showSummary])

    // === 提交 ===
    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('尚未登入，請重新登入')
                router.push('/login')
                return
            }

            const { data: assessment, error: assessmentErr } = await supabase
                .from('assessments')
                .insert({
                    patient_id: patientId,
                    instructor_id: user.id,
                    stage,
                })
                .select('id')
                .single()

            if (assessmentErr || !assessment) {
                throw new Error(assessmentErr?.message || '建立評估失敗')
            }

            const { error: primaryErr } = await supabase
                .from('primary_assessments')
                .insert({
                    assessment_id: assessment.id,
                    cognition: results.cognition,
                    mobility: results.mobility,
                    nutrition: results.nutrition,
                    vision: results.vision,
                    hearing: results.hearing,
                    depression: results.depression,
                    cognition_details: cognition,
                    mobility_details: mobility,
                    nutrition_details: nutrition,
                    vision_details: vision,
                    hearing_details: hearing,
                    depression_details: depression,
                })

            if (primaryErr) {
                throw new Error(primaryErr.message || '儲存初評失敗')
            }

            logActivity(
                '完成 ICOPE 初評',
                `長者: ${patientName}, 異常: ${abnormalCount} 項, 複評任務: ${secondaryTasks.join(', ') || '無'}`,
                'assessment',
                assessment.id
            )

            toast.success('初評已儲存！')

            if (secondaryTasks.length > 0) {
                const params = new URLSearchParams({
                    assessment_id: assessment.id,
                    tasks: secondaryTasks.join(','),
                    patient_name: patientName,
                })
                router.push(`/icope/secondary?${params.toString()}`)
            } else {
                toast.success('所有面向皆正常，無需複評')
                router.push('/icope')
            }
        } catch (err: any) {
            toast.error(err.message || '儲存失敗，請重試')
        } finally {
            setSubmitting(false)
        }
    }

    // === AI 相機全螢幕 ===
    if (aiCameraOpen) {
        return (
            <ChairStandCamera
                assessmentId="primary-preview"
                patientName={patientName}
                onClose={() => setAiCameraOpen(false)}
            />
        )
    }

    // === 進度列 ===
    const ProgressBar = () => (
        <div className="glass-card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">ICOPE 初評</h2>
                        <p className="text-xs text-slate-400">
                            長者：<span className="text-slate-800 font-medium">{patientName}</span>
                            <span className="mx-1">·</span>
                            {stage === 'initial' ? '初評' : '後測'}
                        </p>
                    </div>
                </div>
                <span className="text-sm text-slate-500 font-medium">
                    {showSummary ? '總覽' : `${currentStep + 1} / ${TOTAL_STEPS}`}
                </span>
            </div>
            {/* 進度條 */}
            <div className="flex gap-1">
                {STEPS.map((step, i) => {
                    const isActive = !showSummary && i === currentStep
                    const isDone = showSummary || i < currentStep
                    const isAbnormal = results[step.key]
                    return (
                        <button
                            key={step.key}
                            type="button"
                            onClick={() => { setShowSummary(false); setCurrentStep(i) }}
                            className={`flex-1 h-2 rounded-full transition-all ${
                                isActive ? 'bg-blue-500' :
                                isDone ? (isAbnormal ? 'bg-red-400' : 'bg-emerald-400') :
                                'bg-slate-200'
                            }`}
                            title={`${step.title} ${isAbnormal ? '(異常)' : '(正常)'}`}
                        />
                    )
                })}
            </div>
            {/* 步驟標籤 */}
            <div className="flex gap-1 mt-1.5">
                {STEPS.map((step, i) => {
                    const isActive = !showSummary && i === currentStep
                    return (
                        <button
                            key={step.key}
                            type="button"
                            onClick={() => { setShowSummary(false); setCurrentStep(i) }}
                            className={`flex-1 text-center text-[10px] transition-colors ${
                                isActive ? 'text-blue-600 font-bold' : 'text-slate-400'
                            }`}
                        >
                            {step.icon} {step.shortTitle}
                        </button>
                    )
                })}
            </div>
        </div>
    )

    // === 共用的「是/否」按鈕元件 ===
    const YesNoButton = ({
        label,
        description,
        value,
        onChange,
        yesLabel = '是',
        noLabel = '否',
        yesIsAbnormal = true,
    }: {
        label: string
        description?: string
        value: boolean
        onChange: (v: boolean) => void
        yesLabel?: string
        noLabel?: string
        yesIsAbnormal?: boolean
    }) => (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{label}</p>
                {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onChange(true)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        value
                            ? (yesIsAbnormal
                                ? 'bg-red-500/15 text-red-600 border-2 border-red-500/40 shadow-sm'
                                : 'bg-emerald-500/15 text-emerald-600 border-2 border-emerald-500/40 shadow-sm')
                            : 'bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {yesLabel}
                </button>
                <button
                    type="button"
                    onClick={() => onChange(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        !value
                            ? (!yesIsAbnormal
                                ? 'bg-red-500/15 text-red-600 border-2 border-red-500/40 shadow-sm'
                                : 'bg-emerald-500/15 text-emerald-600 border-2 border-emerald-500/40 shadow-sm')
                            : 'bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {noLabel}
                </button>
            </div>
        </div>
    )

    // === 面向結果徽章 ===
    const DomainBadge = ({ isAbnormal }: { isAbnormal: boolean }) => (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
            isAbnormal
                ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
        }`}>
            {isAbnormal ? '⚠️ 異常' : '✓ 正常'}
        </span>
    )

    // ============================================================================
    // 各面向的步驟頁面
    // ============================================================================

    const renderStep = () => {
        const step = STEPS[currentStep]

        switch (step.key) {
            // ================================================================
            // A. 認知功能
            // ================================================================
            case 'cognition':
                return (
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🧠</span>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">A. 認知功能</h3>
                                    <p className="text-xs text-slate-400">記憶力、定向力測試</p>
                                </div>
                            </div>
                            <DomainBadge isAbnormal={results.cognition} />
                        </div>

                        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                            <p className="font-medium mb-1">📖 操作說明</p>
                            <p>1. 先說出「鉛筆、汽車、書」三項物品，請長者重複並記住</p>
                            <p>2. 依序詢問定向力問題</p>
                            <p>3. 最後再問長者是否記得三項物品</p>
                        </div>

                        <div className="space-y-3">
                            <YesNoButton
                                label="① 記憶力：長者是否能正確重複「鉛筆、汽車、書」？"
                                description="說出三項物品，請長者跟著唸一遍"
                                value={cognition.memory_repeat}
                                onChange={v => setCognition(c => ({ ...c, memory_repeat: v }))}
                                yesLabel="✓ 正確"
                                noLabel="✗ 不正確"
                                yesIsAbnormal={false}
                            />
                            <YesNoButton
                                label="② 定向力：長者能否正確回答今天的日期（年/月/日）？"
                                description="詢問：「請問今天是幾年幾月幾日？」"
                                value={cognition.orientation_date}
                                onChange={v => setCognition(c => ({ ...c, orientation_date: v }))}
                                yesLabel="✓ 正確"
                                noLabel="✗ 不正確"
                                yesIsAbnormal={false}
                            />
                            <YesNoButton
                                label="③ 定向力：長者能否正確回答「您現在在哪裡？」"
                                description="詢問：「請問您現在在什麼地方？」"
                                value={cognition.orientation_place}
                                onChange={v => setCognition(c => ({ ...c, orientation_place: v }))}
                                yesLabel="✓ 正確"
                                noLabel="✗ 不正確"
                                yesIsAbnormal={false}
                            />
                            <YesNoButton
                                label="④ 回憶：長者能否正確回憶剛才的三項物品（鉛筆、汽車、書）？"
                                description="第③題完成後，再問：「剛才請您記住的三樣東西是什麼？」"
                                value={cognition.memory_recall}
                                onChange={v => setCognition(c => ({ ...c, memory_recall: v }))}
                                yesLabel="✓ 正確"
                                noLabel="✗ 不正確"
                                yesIsAbnormal={false}
                            />
                        </div>

                        {results.cognition && (
                            <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                                <span>⚠️</span>
                                <p>任一答案為「不正確」→ 判定異常，需擇一（BHT 或 AD8）量表進行複評</p>
                            </div>
                        )}
                    </div>
                )

            // ================================================================
            // B. 行動功能
            // ================================================================
            case 'mobility':
                return (
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🦿</span>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">B. 行動功能</h3>
                                    <p className="text-xs text-slate-400">椅子起身測試</p>
                                </div>
                            </div>
                            <DomainBadge isAbnormal={results.mobility} />
                        </div>

                        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                            <p className="font-medium mb-1">📖 操作說明</p>
                            <p>請長者坐在穩固的椅子上，<strong>雙手抱胸</strong>，連續起立坐下 <strong>5 次</strong>。</p>
                            <p className="mt-1">計時：從開始起身計時，到完成第 5 次坐下為止。</p>
                            <p className="mt-1">判定：超過 <strong>12 秒</strong> 或無法獨立完成 → 異常</p>
                        </div>

                        <div className="space-y-3">
                            <YesNoButton
                                label="② 長者是否能獨立完成測試？"
                                description="是否能在無協助下完成 5 次起立坐下"
                                value={mobility.completed}
                                onChange={v => setMobility(m => ({
                                    ...m,
                                    completed: v,
                                    chair_stand_seconds: v ? m.chair_stand_seconds : null,
                                }))}
                                yesLabel="✓ 能完成"
                                noLabel="✗ 無法完成"
                                yesIsAbnormal={false}
                            />

                            {mobility.completed && (
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        ⏱️ 記錄秒數（起立坐下 5 次）
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={mobility.chair_stand_seconds ?? ''}
                                            onChange={e => {
                                                const val = e.target.value
                                                setMobility(m => ({
                                                    ...m,
                                                    chair_stand_seconds: val ? Number(val) : null,
                                                }))
                                            }}
                                            placeholder="輸入秒數"
                                            min={0}
                                            step={0.1}
                                            className="w-32 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-lg focus:border-blue-500 focus:outline-none"
                                        />
                                        <span className="text-sm text-slate-500">秒</span>
                                        {mobility.chair_stand_seconds !== null && (
                                            <span className={`text-sm font-medium ${
                                                mobility.chair_stand_seconds > 12 ? 'text-red-500' : 'text-emerald-500'
                                            }`}>
                                                {mobility.chair_stand_seconds > 12 ? '⚠️ 超過 12 秒' : '✓ 12 秒內'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* AI 測試入口 */}
                            <button
                                type="button"
                                onClick={() => setAiCameraOpen(true)}
                                className="w-full p-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/25 hover:border-blue-500/50 hover:bg-blue-500/15 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">📸</span>
                                    <div className="flex-1">
                                        <p className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors">
                                            AI 視覺測試 — 椅子起站
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            使用手機後鏡頭自動計算起立坐下 5 次並計時
                                        </p>
                                    </div>
                                    <span className="text-slate-400 group-hover:text-blue-500 transition-colors">→</span>
                                </div>
                            </button>
                        </div>

                        {results.mobility && (
                            <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                                <span>⚠️</span>
                                <p>超過 12 秒或無法完成 → 判定異常，需進行 SPPB 量表評估</p>
                            </div>
                        )}
                    </div>
                )

            // ================================================================
            // C. 營養不良
            // ================================================================
            case 'nutrition':
                return (
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🍎</span>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">C. 營養不良</h3>
                                    <p className="text-xs text-slate-400">體重減輕與食慾不振</p>
                                </div>
                            </div>
                            <DomainBadge isAbnormal={results.nutrition} />
                        </div>

                        <div className="space-y-3">
                            <YesNoButton
                                label="① 過去三個月，您的體重是否在無意中減輕了 3 公斤以上？"
                                description="非刻意節食或運動減重導致的體重下降"
                                value={nutrition.weight_loss}
                                onChange={v => setNutrition(n => ({ ...n, weight_loss: v }))}
                                yesLabel="是（有減輕）"
                                noLabel="否（沒有）"
                            />
                            <YesNoButton
                                label="② 過去三個月，您是否曾經食慾不振？"
                                description="是否有吃不下飯、食慾明顯下降的情形"
                                value={nutrition.appetite_loss}
                                onChange={v => setNutrition(n => ({ ...n, appetite_loss: v }))}
                                yesLabel="是（有食慾不振）"
                                noLabel="否（沒有）"
                            />
                        </div>

                        {results.nutrition && (
                            <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                                <span>⚠️</span>
                                <p>任一答案為「是」→ 判定異常，需進行 MNA-SF 量表評估</p>
                            </div>
                        )}
                    </div>
                )

            // ================================================================
            // D. 視力障礙
            // ================================================================
            case 'vision':
                return (
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">👁️</span>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">D. 視力障礙</h3>
                                    <p className="text-xs text-slate-400">WHO 視力圖 + 高風險調查</p>
                                </div>
                            </div>
                            <DomainBadge isAbnormal={results.vision} />
                        </div>

                        <div className="space-y-3">
                            <YesNoButton
                                label="① 您的眼睛看遠、看近或閱讀是否有困難？"
                                value={vision.difficulty_reported}
                                onChange={v => setVision(vi => ({ ...vi, difficulty_reported: v }))}
                                yesLabel="是（有困難）"
                                noLabel="否（沒有）"
                            />

                            {/* 第①題答「否」→ 執行 WHO 視力圖測試 */}
                            {!vision.difficulty_reported && (
                                <div className="border-l-4 border-blue-300 pl-4 space-y-3">
                                    <p className="text-xs text-blue-600 font-medium">
                                        ▸ 答案為「否」，請接續執行 WHO 簡單視力圖測試
                                    </p>
                                    <YesNoButton
                                        label="②a 遠距離測試（四個小E）是否通過？"
                                        description="使用 WHO 簡單視力圖進行遠距離測試"
                                        value={vision.who_far_pass ?? true}
                                        onChange={v => setVision(vi => ({ ...vi, who_far_pass: v }))}
                                        yesLabel="✓ 通過"
                                        noLabel="✗ 未通過"
                                        yesIsAbnormal={false}
                                    />
                                    <YesNoButton
                                        label="②b 近距離測試是否通過？"
                                        description="使用 WHO 簡單視力圖進行近距離測試"
                                        value={vision.who_near_pass ?? true}
                                        onChange={v => setVision(vi => ({ ...vi, who_near_pass: v }))}
                                        yesLabel="✓ 通過"
                                        noLabel="✗ 未通過"
                                        yesIsAbnormal={false}
                                    />
                                </div>
                            )}

                            <YesNoButton
                                label="③ 高風險眼科調查：是否有眼睛疾病未定期追蹤，或慢性病（如糖尿病）過去一年未接受眼科檢查？"
                                description="如：白內障、青光眼、黃斑部病變未追蹤；或糖尿病未定期眼底檢查"
                                value={vision.high_risk_eye}
                                onChange={v => setVision(vi => ({ ...vi, high_risk_eye: v }))}
                                yesLabel="是（有上述情形）"
                                noLabel="否（沒有）"
                            />
                        </div>

                        {results.vision && (
                            <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                                <span>⚠️</span>
                                <p>視力有困難、視力圖測試未通過、或高風險未追蹤 → 判定異常，建議轉介眼科檢查</p>
                            </div>
                        )}
                    </div>
                )

            // ================================================================
            // E. 聽力障礙
            // ================================================================
            case 'hearing':
                return (
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">👂</span>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">E. 聽力障礙</h3>
                                    <p className="text-xs text-slate-400">氣音測試</p>
                                </div>
                            </div>
                            <DomainBadge isAbnormal={results.hearing} />
                        </div>

                        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                            <p className="font-medium mb-1">📖 操作說明</p>
                            <p>使用<strong>氣音</strong>（輕聲、用氣流帶動聲音）對長者說出數字。</p>
                            <p className="mt-1">先測第一組「<strong>6、1、9</strong>」，請長者複誦。</p>
                            <p className="mt-1">若未正確，再測第二組「<strong>2、5、7</strong>」。</p>
                        </div>

                        <div className="space-y-3">
                            <YesNoButton
                                label="① 氣音測試第一組：長者能否正確複誦「6、1、9」？"
                                description="用氣音說出數字，請長者跟著唸一遍"
                                value={hearing.group1_pass}
                                onChange={v => setHearing(h => ({
                                    ...h,
                                    group1_pass: v,
                                    group2_pass: v ? null : h.group2_pass, // 通過就清除第二組
                                }))}
                                yesLabel="✓ 正確複誦"
                                noLabel="✗ 未能正確複誦"
                                yesIsAbnormal={false}
                            />

                            {/* 第一組未通過 → 顯示第二組 */}
                            {!hearing.group1_pass && (
                                <div className="border-l-4 border-amber-300 pl-4">
                                    <p className="text-xs text-amber-600 font-medium mb-2">
                                        ▸ 第一組未通過，請再測第二組
                                    </p>
                                    <YesNoButton
                                        label="② 氣音測試第二組：長者能否正確複誦「2、5、7」？"
                                        description="用氣音再次說出數字，請長者跟著唸"
                                        value={hearing.group2_pass ?? false}
                                        onChange={v => setHearing(h => ({ ...h, group2_pass: v }))}
                                        yesLabel="✓ 正確複誦"
                                        noLabel="✗ 未能正確複誦"
                                        yesIsAbnormal={false}
                                    />
                                </div>
                            )}
                        </div>

                        {results.hearing && (
                            <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                                <span>⚠️</span>
                                <p>兩組數字皆未能正確複誦 → 判定異常，建議轉介醫療院所接受聽力檢測</p>
                            </div>
                        )}
                    </div>
                )

            // ================================================================
            // F. 憂鬱
            // ================================================================
            case 'depression':
                return (
                    <div className="glass-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">💭</span>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">F. 憂鬱</h3>
                                    <p className="text-xs text-slate-400">過去兩週情緒評估</p>
                                </div>
                            </div>
                            <DomainBadge isAbnormal={results.depression} />
                        </div>

                        <div className="space-y-3">
                            <YesNoButton
                                label="① 過去兩週，您是否常感到厭煩（心煩、台語「阿雜」），或沒有希望？"
                                value={depression.feeling_hopeless}
                                onChange={v => setDepression(d => ({ ...d, feeling_hopeless: v }))}
                                yesLabel="是"
                                noLabel="否"
                            />
                            <YesNoButton
                                label="② 過去兩週，您是否減少很多的活動和興趣的事？"
                                description="例如不太想出門、對原本喜歡的事失去興趣"
                                value={depression.reduced_interest}
                                onChange={v => setDepression(d => ({ ...d, reduced_interest: v }))}
                                yesLabel="是"
                                noLabel="否"
                            />
                        </div>

                        {results.depression && (
                            <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 flex items-start gap-2">
                                <span>⚠️</span>
                                <p>任一答案為「是」→ 判定異常，需進行 GDS-15 量表評估</p>
                            </div>
                        )}
                    </div>
                )

            default:
                return null
        }
    }

    // ============================================================================
    // 總覽頁
    // ============================================================================

    const renderSummary = () => (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h3 className="text-lg font-bold text-slate-800 mb-4">📊 初評結果總覽</h3>

                <div className="space-y-2">
                    {STEPS.map((step, i) => {
                        const isAbnormal = results[step.key]
                        return (
                            <button
                                key={step.key}
                                type="button"
                                onClick={() => { setShowSummary(false); setCurrentStep(i) }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all hover:ring-2 hover:ring-blue-300 ${
                                    isAbnormal ? 'bg-red-50' : 'bg-emerald-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{step.icon}</span>
                                    <span className="text-sm font-medium text-slate-800">{step.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DomainBadge isAbnormal={isAbnormal} />
                                    <span className="text-slate-400 text-xs">✎</span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {abnormalCount > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-amber-50 text-xs text-amber-700">
                        <p className="font-medium">⚠️ 共 {abnormalCount} 項異常</p>
                        <p className="mt-1">
                            依國健署規範，初評任一項異常 → 需進行「用藥」及「社會性照護與支持」評估
                        </p>
                    </div>
                )}
            </div>

            {/* 複評任務清單 */}
            {secondaryTasks.length > 0 && (
                <div className="glass-card p-5 ring-2 ring-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">📋</span>
                        <div>
                            <h3 className="text-lg font-bold text-amber-600">後續複評任務</h3>
                            <p className="text-xs text-slate-500">以下量表將在初評送出後依序進行</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {secondaryTasks.map((task) => (
                            <div
                                key={task}
                                className="flex items-center gap-2 p-3 rounded-xl bg-white/80"
                            >
                                <span className="text-lg">{TASK_ICONS[task]}</span>
                                <span className="text-sm text-slate-800 font-medium">{TASK_LABELS[task]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    // ============================================================================
    // 主渲染
    // ============================================================================

    return (
        <div className="space-y-4">
            <ProgressBar />

            {showSummary ? renderSummary() : renderStep()}

            {/* 導覽按鈕 */}
            <div className="flex gap-3 sticky bottom-4">
                <button
                    type="button"
                    onClick={currentStep === 0 && !showSummary ? () => router.back() : goPrev}
                    className="flex-1 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                >
                    {currentStep === 0 && !showSummary ? '← 返回' : '← 上一步'}
                </button>
                {showSummary ? (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 btn-accent text-sm py-3.5 disabled:opacity-50"
                    >
                        {submitting ? '儲存中...' : secondaryTasks.length > 0 ? '送出初評，開始複評 →' : '✓ 送出初評'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={goNext}
                        className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        {currentStep < TOTAL_STEPS - 1 ? '下一步 →' : '查看總覽 →'}
                    </button>
                )}
            </div>
        </div>
    )
}
