'use client'

/**
 * SPPB 平衡測試 — 相機 + HUD + Supabase 整合
 * 手機後鏡頭（facingMode: environment）
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'
import {
    useBalanceTest,
    STAGE_NAMES,
    STAGE_DESCRIPTIONS,
    type BalanceTestResult,
} from '@/hooks/useBalanceTest'
import type { NormalizedLandmark } from '@/utils/balanceMath'

// ============================================================================
// Props
// ============================================================================

interface BalanceCameraProps {
    assessmentId: string
    patientName?: string
    onClose?: () => void
}

// ============================================================================
// Component
// ============================================================================

export default function BalanceCamera({
    assessmentId,
    patientName = '',
    onClose,
}: BalanceCameraProps) {
    const webcamRef = useRef<Webcam>(null)
    const poseRef = useRef<{ send: (input: { image: HTMLVideoElement }) => Promise<void> } | null>(null)
    const animFrameRef = useRef<number>(0)

    const [cameraReady, setCameraReady] = useState(false)
    const [poseLoaded, setPoseLoaded] = useState(false)
    const [saving, setSaving] = useState(false)
    const [finalResult, setFinalResult] = useState<BalanceTestResult | null>(null)

    /** Supabase UPDATE */
    const handleComplete = useCallback(async (result: BalanceTestResult) => {
        setFinalResult(result)
        setSaving(true)

        try {
            const supabase = createClient()

            const { data: existing } = await supabase
                .from('secondary_assessments')
                .select('id')
                .eq('assessment_id', assessmentId)
                .single()

            const updateData = { sppb_score: result.totalScore }

            if (existing) {
                const { error } = await supabase
                    .from('secondary_assessments')
                    .update(updateData)
                    .eq('assessment_id', assessmentId)
                if (error) throw new Error(error.message)
            } else {
                const { error } = await supabase
                    .from('secondary_assessments')
                    .insert({ assessment_id: assessmentId, ...updateData })
                if (error) throw new Error(error.message)
            }

            logActivity(
                'SPPB 平衡測試 AI 完成',
                `長者: ${patientName}, 總分: ${result.totalScore}/4, 通過關卡: ${result.stages.filter(s => s.passed).length}/3`,
                'assessment',
                assessmentId
            )

            toast.success(`平衡測試完成！總分 ${result.totalScore}/4`)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '未知錯誤'
            toast.error('儲存失敗: ' + msg)
        } finally {
            setSaving(false)
        }
    }, [assessmentId, patientName])

    const {
        currentStage,
        poseState,
        holdTime,
        stageResults,
        totalScore,
        stability,
        failReason,
        processPose,
        reset,
    } = useBalanceTest({ onComplete: handleComplete })

    /** 初始化 MediaPipe Pose */
    useEffect(() => {
        let isMounted = true

        const initPose = async () => {
            try {
                const { Pose } = await import('@mediapipe/pose')

                const pose = new Pose({
                    locateFile: (file: string) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
                })

                pose.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                })

                pose.onResults((results: { poseLandmarks?: NormalizedLandmark[] }) => {
                    if (!isMounted) return
                    if (results.poseLandmarks) {
                        processPose(results.poseLandmarks)
                    }
                })

                poseRef.current = pose
                if (isMounted) setPoseLoaded(true)
            } catch (err) {
                console.error('MediaPipe Pose 初始化失敗:', err)
                toast.error('骨架偵測引擎載入失敗')
            }
        }

        initPose()
        return () => {
            isMounted = false
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [processPose])

    /** 持續送幀 */
    useEffect(() => {
        if (!cameraReady || !poseLoaded || !poseRef.current) return
        if (currentStage === 'COMPLETED') return

        let running = true

        const sendFrame = async () => {
            if (!running || !webcamRef.current?.video) return

            const video = webcamRef.current.video
            if (video.readyState >= 2 && poseRef.current) {
                try {
                    await poseRef.current.send({ image: video })
                } catch {
                    // ignore
                }
            }

            if (running) {
                animFrameRef.current = requestAnimationFrame(sendFrame)
            }
        }

        animFrameRef.current = requestAnimationFrame(sendFrame)
        return () => {
            running = false
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [cameraReady, poseLoaded, currentStage])

    const videoConstraints = { width: 640, height: 480, facingMode: 'environment' as const }

    // 計算倒數
    const countdown = Math.max(0, 10 - holdTime).toFixed(1)
    // 進度條寬度（0-100%）
    const progressPercent = Math.min(100, (holdTime / 10) * 100)
    // 關卡序號
    const stageNumber = currentStage === 'COMPLETED'
        ? 3
        : ['SIDE_BY_SIDE', 'SEMI_TANDEM', 'TANDEM'].indexOf(currentStage) + 1

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* 相機 */}
            <div className="relative flex-1">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    className="absolute inset-0 w-full h-full object-cover"
                    videoConstraints={videoConstraints}
                    onUserMedia={() => setCameraReady(true)}
                    onUserMediaError={() => toast.error('無法開啟相機')}
                />

                {/* 載入中 */}
                {(!cameraReady || !poseLoaded) && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-800 mt-4 text-lg font-medium">
                            {!cameraReady ? '開啟相機中...' : '載入骨架偵測引擎...'}
                        </p>
                    </div>
                )}

                {/* HUD */}
                {cameraReady && poseLoaded && (
                    <>
                        {/* 頂部：關卡資訊 */}
                        <div className="absolute top-0 inset-x-0 z-10 bg-black/60 backdrop-blur-sm px-4 py-3 safe-top">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-primary-600 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {stageNumber}/3
                                        </span>
                                        <h2 className="text-lg font-bold text-slate-800">
                                            {STAGE_NAMES[currentStage]}
                                        </h2>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {STAGE_DESCRIPTIONS[currentStage]}
                                        {patientName && ` · ${patientName}`}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 text-xl hover:bg-slate-200"
                                    title="關閉"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 闖關進度 */}
                            <div className="flex gap-1.5 mt-3">
                                {(['SIDE_BY_SIDE', 'SEMI_TANDEM', 'TANDEM'] as const).map((stage, i) => {
                                    const r = stageResults.find(s => s.stage === stage)
                                    let bgColor = 'bg-slate-100'
                                    if (r?.passed) bgColor = 'bg-emerald-500'
                                    else if (r && !r.passed) bgColor = 'bg-red-500'
                                    else if (stage === currentStage) bgColor = 'bg-primary-500 animate-pulse'

                                    return <div key={i} className={`flex-1 h-1.5 rounded-full ${bgColor}`} />
                                })}
                            </div>
                        </div>

                        {/* 中央：倒數計時 */}
                        {currentStage !== 'COMPLETED' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    {poseState === 'DETECTING' && (
                                        <>
                                            <p className="text-6xl font-black text-amber-400 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] animate-pulse">
                                                請擺出姿勢
                                            </p>
                                            <p className="text-xl text-slate-800/60 mt-2">{STAGE_DESCRIPTIONS[currentStage]}</p>
                                        </>
                                    )}
                                    {poseState === 'HOLDING' && (
                                        <>
                                            <p className="text-[100px] font-black text-emerald-400 leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                                                {countdown}
                                            </p>
                                            <p className="text-xl text-slate-800/80 mt-2 font-medium">維持中...</p>
                                        </>
                                    )}
                                    {poseState === 'FAILED' && failReason && (
                                        <>
                                            <p className="text-5xl font-black text-red-400 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                                                ⚠️ {failReason}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 底部：數據與結果 */}
                        <div className="absolute bottom-0 inset-x-0 z-10 bg-black/60 backdrop-blur-sm px-4 py-3 safe-bottom">
                            {currentStage !== 'COMPLETED' ? (
                                <>
                                    {/* 維持進度條 */}
                                    {poseState === 'HOLDING' && (
                                        <div className="mb-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-around">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-slate-800">{holdTime.toFixed(1)}s</p>
                                            <p className="text-[10px] text-slate-500">維持時間</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100" />
                                        <div className="text-center">
                                            <p className={`text-3xl font-bold ${poseState === 'HOLDING' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {poseState === 'DETECTING' ? '偵測中' : poseState === 'HOLDING' ? '穩定' : '失敗'}
                                            </p>
                                            <p className="text-[10px] text-slate-500">姿態狀態</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100" />
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-slate-800">
                                                {stability?.shoulderTilt ?? 0}°
                                            </p>
                                            <p className="text-[10px] text-slate-500">肩膀傾斜</p>
                                        </div>
                                    </div>
                                </>
                            ) : finalResult ? (
                                <div className="space-y-3">
                                    {/* 結果摘要 */}
                                    <div className="text-center">
                                        <p className={`text-5xl font-black ${finalResult.totalScore >= 3 ? 'text-emerald-400' : finalResult.totalScore >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {finalResult.totalScore}
                                            <span className="text-xl text-slate-500">/4</span>
                                        </p>
                                        <p className="text-sm text-slate-400 mt-1">平衡測試總分</p>
                                    </div>

                                    {/* 各關卡結果 */}
                                    <div className="flex gap-2">
                                        {finalResult.stages.map((s, i) => (
                                            <div key={i} className={`flex-1 p-2 rounded-lg text-center text-xs ${s.passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                                <p className="font-bold">{STAGE_NAMES[s.stage]}</p>
                                                <p className="mt-0.5">{s.passed ? `✓ ${s.holdTime}s` : `✗ ${s.holdTime}s`}</p>
                                                <p className="text-[10px] opacity-60">{s.score}分</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 操作按鈕 */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                reset()
                                                setFinalResult(null)
                                            }}
                                            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-800 font-medium"
                                        >
                                            🔄 重測
                                        </button>
                                        <button
                                            onClick={onClose}
                                            disabled={saving}
                                            className="flex-1 py-3 rounded-xl bg-emerald-600 text-slate-800 font-bold disabled:opacity-50"
                                        >
                                            {saving ? '儲存中...' : '✓ 完成'}
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
