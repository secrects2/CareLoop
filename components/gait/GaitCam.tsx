'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import {
    transformAllLandmarks, getBodyHeightPx, GAIT_LANDMARKS,
    midpoint, distance2D, type RealLandmark
} from '@/lib/gait/coordinate-transformer'
import { checkPoseQuality, resetPoseQualityGuard, type PoseQualityResult } from '@/lib/gait/pose-quality-guard'
import { GaitEventDetector } from '@/lib/gait/gait-event-detector'
import { GaitFeatureEngine, type GaitFeatures } from '@/lib/gait/gait-feature-engine'
import { BalanceEngine, type BalanceMetrics } from '@/lib/gait/balance-engine'
import { computeFallRisk, computeSymmetryIndex, type FallRiskResult } from '@/lib/gait/fall-risk-engine'
import { evaluateBrainRules, type BrainResult } from '@/lib/gait/brain-rules-engine'

interface GaitCamProps {
    onSessionEnd?: (summary: GaitSessionSummary) => void
    onClose?: () => void
}

export interface GaitSessionSummary {
    durationSeconds: number
    features: GaitFeatures
    balance: BalanceMetrics
    fallRisk: FallRiskResult
    symmetry: { symmetryIndex: number; stepLengthAsymmetry: number; stanceTimeAsymmetry: number; swingTimeAsymmetry: number }
    brain: BrainResult
    quality: PoseQualityResult
    captureMode: 'tripod' | 'handheld'
}

// 下半身骨架連線
const LOWER_BODY_CONNECTIONS: [number, number][] = [
    [11, 12], [11, 23], [12, 24], [23, 24], // torso
    [23, 25], [24, 26], // hip-knee
    [25, 27], [26, 28], // knee-ankle
    [27, 29], [28, 30], // ankle-heel
    [27, 31], [28, 32], // ankle-foot
    [29, 31], [30, 32], // heel-foot
]

export default function GaitCam({ onSessionEnd, onClose }: GaitCamProps) {
    const webcamRef = useRef<Webcam>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const poseRef = useRef<any>(null)
    const startTimeRef = useRef<number>(Date.now())

    // Engines
    const eventDetector = useRef(new GaitEventDetector())
    const featureEngine = useRef(new GaitFeatureEngine())
    const balanceEngine = useRef(new BalanceEngine())

    // State
    const [cameraReady, setCameraReady] = useState(false)
    const [poseLoaded, setPoseLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)

    // Metrics state (throttled)
    const [quality, setQuality] = useState<PoseQualityResult | null>(null)
    const [features, setFeatures] = useState<GaitFeatures | null>(null)
    const [balance, setBalance] = useState<BalanceMetrics | null>(null)
    const [fallRisk, setFallRisk] = useState<FallRiskResult | null>(null)
    const [brain, setBrain] = useState<BrainResult | null>(null)
    const [stepCount, setStepCount] = useState(0)
    const [symmetryIndex, setSymmetryIndex] = useState(1)
    const [captureMode, setCaptureMode] = useState<'tripod' | 'handheld'>('tripod')
    const [sessionEnded, setSessionEnded] = useState(false)
    const [showReport, setShowReport] = useState(false)
    const [sessionSummary, setSessionSummary] = useState<GaitSessionSummary | null>(null)

    // Camera shake tracking
    const shakeHistory = useRef<number[]>([])
    const lastUIUpdate = useRef(0)
    const UI_THROTTLE_MS = 400

    //  Process frame results
    const processResults = useCallback((results: any) => {
        const canvas = canvasRef.current
        const webcam = webcamRef.current
        if (!canvas || !webcam?.video || sessionEnded) return

        const video = webcam.video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (!results.poseLandmarks) return

        const landmarks = results.poseLandmarks
        const now = Date.now()
        const W = video.videoWidth || 640
        const H = video.videoHeight || 480

        // 1. Aspect-Ratio Aware 座標轉換
        const realLandmarks = transformAllLandmarks(landmarks, W, H)
        const bodyHeight = getBodyHeightPx(realLandmarks)

        // 2. 品質檢查
        const poseQuality = checkPoseQuality(realLandmarks, W, H, bodyHeight)

        // 3. Camera shake 偵測
        const lHip = realLandmarks[GAIT_LANDMARKS.LEFT_HIP]
        const rHip = realLandmarks[GAIT_LANDMARKS.RIGHT_HIP]
        if (lHip && rHip && lHip.visibility > 0.4 && rHip.visibility > 0.4) {
            const hipMid = midpoint(lHip, rHip)
            if (shakeHistory.current.length > 0) {
                const prevLen = shakeHistory.current.length
                // 簡化：用幀間位移標準差作為晃動指標
            }
            shakeHistory.current.push(hipMid.x)
            if (shakeHistory.current.length > 30) shakeHistory.current.shift()
        }

        // 自動偵測 tripod / handheld
        let cameraStable = true
        if (shakeHistory.current.length >= 15) {
            const recent = shakeHistory.current.slice(-15)
            const mean = recent.reduce((a, b) => a + b, 0) / recent.length
            const variance = recent.reduce((a, v) => a + (v - mean) ** 2, 0) / recent.length
            const std = Math.sqrt(variance)
            if (std > 8) {
                cameraStable = false
            }
        }

        // Only proceed if quality is acceptable
        if (poseQuality.visibility_ok && poseQuality.lower_body_visible) {
            // 4. 步態事件偵測
            eventDetector.current.processFrame(realLandmarks, now, 'side')

            // 5. 臀中點追蹤
            featureEngine.current.updateHipTracking(realLandmarks, now)

            // 6. 平衡分析
            balanceEngine.current.processFrame(realLandmarks, poseQuality.auto_2d_mode, bodyHeight)
        }

        //  Draw skeleton
        const good = poseQuality.visibility_ok
        const lineColor = good ? '#06b6d4' : '#f43f5e'
        const pointColor = good ? '#0891b2' : '#dc2626'

        ctx.strokeStyle = lineColor
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'

        for (const [startIdx, endIdx] of LOWER_BODY_CONNECTIONS) {
            const start = landmarks[startIdx]
            const end = landmarks[endIdx]
            if (start?.visibility > 0.4 && end?.visibility > 0.4) {
                ctx.beginPath()
                ctx.moveTo(start.x * canvas.width, start.y * canvas.height)
                ctx.lineTo(end.x * canvas.width, end.y * canvas.height)
                ctx.stroke()
            }
        }

        // Draw key points
        const keyPoints = [
            GAIT_LANDMARKS.NOSE,
            GAIT_LANDMARKS.LEFT_SHOULDER, GAIT_LANDMARKS.RIGHT_SHOULDER,
            GAIT_LANDMARKS.LEFT_HIP, GAIT_LANDMARKS.RIGHT_HIP,
            GAIT_LANDMARKS.LEFT_KNEE, GAIT_LANDMARKS.RIGHT_KNEE,
            GAIT_LANDMARKS.LEFT_ANKLE, GAIT_LANDMARKS.RIGHT_ANKLE,
            GAIT_LANDMARKS.LEFT_HEEL, GAIT_LANDMARKS.RIGHT_HEEL,
            GAIT_LANDMARKS.LEFT_FOOT_INDEX, GAIT_LANDMARKS.RIGHT_FOOT_INDEX,
        ]
        for (const idx of keyPoints) {
            const lm = landmarks[idx]
            if (lm?.visibility > 0.4) {
                ctx.fillStyle = pointColor
                ctx.beginPath()
                ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, 2 * Math.PI)
                ctx.fill()
                ctx.strokeStyle = '#fff'
                ctx.lineWidth = 1.5
                ctx.stroke()
            }
        }

        // Throttled UI update
        if ((now - lastUIUpdate.current) >= UI_THROTTLE_MS) {
            lastUIUpdate.current = now

            const steps = eventDetector.current.getSteps()
            const computedFeatures = featureEngine.current.computeFeatures(steps, bodyHeight)
            const computedBalance = balanceEngine.current.computeMetrics()

            const leftSteps = eventDetector.current.getLeftSteps()
            const rightSteps = eventDetector.current.getRightSteps()
            const sym = computeSymmetryIndex(leftSteps, rightSteps)

            const risk = computeFallRisk(computedFeatures, computedBalance, sym.symmetryIndex)
            const brainResult = evaluateBrainRules(
                poseQuality, computedFeatures, computedBalance,
                risk, sym.symmetryIndex, cameraStable
            )

            setQuality(poseQuality)
            setFeatures(computedFeatures)
            setBalance(computedBalance)
            setFallRisk(risk)
            setBrain(brainResult)
            setStepCount(steps.length)
            setSymmetryIndex(sym.symmetryIndex)
            setCaptureMode(cameraStable ? 'tripod' : 'handheld')
        }
    }, [sessionEnded])

    // Session timer
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const formattedTime = React.useMemo(() => {
        const m = Math.floor(elapsedTime / 60).toString().padStart(2, '0')
        const s = (elapsedTime % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }, [elapsedTime])

    // Init MediaPipe Pose
    useEffect(() => {
        let animationId: number

        const initPose = async () => {
            try {
                resetPoseQualityGuard()
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
                pose.onResults(processResults)
                poseRef.current = pose
                setPoseLoaded(true)

                const sendFrame = async () => {
                    if (webcamRef.current?.video?.readyState === 4) {
                        try { await pose.send({ image: webcamRef.current.video }) }
                        catch (e) { console.error('Pose send:', e) }
                    }
                    animationId = requestAnimationFrame(sendFrame)
                }
                sendFrame()
            } catch (err: any) {
                console.error('MediaPipe init error:', err)
                setError(err.message || '無法載入 AI 模型')
            }
        }

        initPose()
        return () => {
            if (animationId) cancelAnimationFrame(animationId)
            if (poseRef.current) poseRef.current.close()
        }
    }, [processResults])

    // End session
    const handleEndSession = useCallback(() => {
        setSessionEnded(true)
        const steps = eventDetector.current.getSteps()
        const bodyHeight = 400 // fallback
        const computedFeatures = featureEngine.current.computeFeatures(steps, bodyHeight)
        const computedBalance = balanceEngine.current.computeMetrics()
        const leftSteps = eventDetector.current.getLeftSteps()
        const rightSteps = eventDetector.current.getRightSteps()
        const sym = computeSymmetryIndex(leftSteps, rightSteps)
        const risk = computeFallRisk(computedFeatures, computedBalance, sym.symmetryIndex)
        const qualityResult = quality || { quality_score: 0, visibility_ok: false, z_reliable: false, full_body: false, no_multi_person: true, auto_2d_mode: true, lower_body_visible: false }
        const brainResult = evaluateBrainRules(qualityResult, computedFeatures, computedBalance, risk, sym.symmetryIndex, captureMode === 'tripod')

        const summary: GaitSessionSummary = {
            durationSeconds: elapsedTime,
            features: computedFeatures,
            balance: computedBalance,
            fallRisk: risk,
            symmetry: sym,
            brain: brainResult,
            quality: qualityResult,
            captureMode,
        }
        setSessionSummary(summary)
        setShowReport(true)
        onSessionEnd?.(summary)
    }, [quality, captureMode, elapsedTime, onSessionEnd])

    const videoConstraints = React.useMemo(() => ({ facingMode: 'environment' }), [])

    // Session Report View
    if (showReport && sessionSummary) {
        const s = sessionSummary
        return (
            <div className="min-h-screen bg-slate-50 p-4">
                <div className="max-w-lg mx-auto space-y-4">
                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                        <div className="text-4xl mb-2">{s.brain.icon}</div>
                        <h2 className="text-xl font-bold text-slate-800 mb-1">步態分析報告</h2>
                        <p className={`text-sm font-medium ${s.brain.color}`}>{s.brain.message}</p>
                        <p className="text-xs text-slate-400 mt-1">分析時間 {formattedTime} · {s.features.validSteps} 有效步</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="步速" value={`${s.features.gaitSpeedRelative} bh/s`} sub="body heights/sec" />
                        <MetricCard label="步頻" value={`${s.features.cadence}`} sub="steps/min" />
                        <MetricCard label="步長" value={`${s.features.avgStepLengthNorm} bh`} sub="body height units" />
                        <MetricCard label="對稱性" value={`${s.symmetry.symmetryIndex}`} sub="1.0 = 完美對稱" />
                        <MetricCard label="平衡" value={`${s.balance.balanceScore}/100`} sub="穩定度分數" />
                        <MetricCard label="跌倒風險" value={s.fallRisk.label} sub={`${s.fallRisk.score}/100 分`} />
                    </div>

                    {/* Details */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-800 mb-3 text-sm">詳細指標</h3>
                        <div className="space-y-2 text-xs">
                            <DetailRow label="軀幹傾斜(平均)" value={`${s.balance.trunkTiltAvg}°`} />
                            <DetailRow label="軀幹傾斜(最大)" value={`${s.balance.trunkTiltMax}°`} />
                            <DetailRow label="左右晃動" value={`${s.balance.lateralSwayNorm}`} />
                            <DetailRow label="頭部穩定" value={`${s.balance.headStabilityScore}/100`} />
                            <DetailRow label="骨盆穩定" value={`${s.balance.pelvicStabilityScore}/100`} />
                            <DetailRow label="步長變異" value={`${s.features.stepLengthCV}%`} />
                            <DetailRow label="步時變異" value={`${s.features.stepTimeCV}%`} />
                            <DetailRow label="起步延遲" value={s.features.hesitationDetected ? '是' : '否'} />
                            <DetailRow label="拍攝模式" value={s.captureMode === 'tripod' ? '📐 腳架' : '🤳 手持'} />
                            <DetailRow label="資料品質" value={`${s.quality.quality_score}/100`} />
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    {s.brain.aiSuggestions.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <h3 className="font-semibold text-slate-800 mb-3 text-sm">🤖 AI 建議</h3>
                            <ul className="space-y-2">
                                {s.brain.aiSuggestions.map((sug, i) => (
                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                        <span className="text-cyan-500 mt-0.5">•</span>
                                        {sug}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Risk Factors */}
                    {s.fallRisk.factors.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <h3 className="font-semibold text-amber-800 mb-2 text-sm">⚠️ 風險因子</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {s.fallRisk.factors.map((f, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">{f}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => onClose?.()}
                        className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
                    >
                        返回
                    </button>
                </div>
            </div>
        )
    }

    // Main Camera View
    return (
        <div className={`relative bg-black overflow-hidden flex flex-col ring-4 ${brain?.borderColor || 'ring-blue-500/60'} transition-all duration-300 min-h-screen`}>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 p-3 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex flex-col gap-1.5">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                        <span className="text-white/60 text-xs">⏱</span>
                        <span className="text-white font-mono text-lg font-bold tracking-wider">{formattedTime}</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                            <span className="text-cyan-400 text-xs">👣</span>
                            <span className="text-white font-mono text-sm font-bold">{stepCount}</span>
                            <span className="text-white/40 text-[10px]">步</span>
                        </div>
                        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                            <span className={`text-xs ${captureMode === 'tripod' ? 'text-green-400' : 'text-amber-400'}`}>
                                {captureMode === 'tripod' ? '📐' : '🤳'}
                            </span>
                            <span className="text-white/60 text-[10px]">{captureMode === 'tripod' ? '腳架' : '手持'}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => onClose?.()}
                    className="pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs"
                >
                    ✕
                </button>
            </div>

            {/* Camera */}
            <div className="relative flex-1 w-full bg-black" style={{ minHeight: '50vh' }}>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored={false}
                    className="absolute inset-0 w-full h-full object-cover"
                    videoConstraints={videoConstraints}
                    onUserMedia={() => setCameraReady(true)}
                    onUserMediaError={() => setError('無法存取相機')}
                />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

                {/* Brain diagnostic overlay */}
                {brain && (
                    <div className="absolute top-16 left-3 z-10 max-w-[75%]">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10">
                            <p className="font-bold text-sm text-white">{brain.message}</p>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {!poseLoaded && !error && (
                    <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center text-white">
                        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm">正在載入 AI 步態分析模型...</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center text-white p-6">
                        <p className="text-red-400 text-lg mb-2">⚠️ 錯誤</p>
                        <p className="text-sm text-center">{error}</p>
                    </div>
                )}
            </div>

            {/* Bottom HUD */}
            <div className="bg-gray-950 px-4 py-3 space-y-3">
                {/* Metrics Row */}
                <div className="grid grid-cols-4 gap-2">
                    <HUDMetric label="步速" value={features?.gaitSpeedRelative.toFixed(2) ?? '--'} unit="bh/s" />
                    <HUDMetric label="步頻" value={features?.cadence?.toString() ?? '--'} unit="spm" />
                    <HUDMetric label="平衡" value={balance?.balanceScore?.toString() ?? '--'} unit="/100" />
                    <HUDMetric label="風險" value={fallRisk?.label.slice(0, 2) ?? '--'} unit="" color={fallRisk?.color} />
                </div>

                {/* Quality bar */}
                <div className="flex items-center gap-3">
                    <QualityDot label="📷" ok={cameraReady} />
                    <QualityDot label="👤" ok={quality?.visibility_ok ?? false} />
                    <QualityDot label="🦶" ok={quality?.lower_body_visible ?? false} />
                    <QualityDot label="📏" ok={quality?.full_body ?? false} />
                    <div className="flex-1" />
                    <span className="text-white/40 text-xs">
                        對稱 {symmetryIndex.toFixed(2)} · 品質 {quality?.quality_score ?? 0}
                    </span>
                </div>

                {/* End Session Button */}
                <button
                    onClick={handleEndSession}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                >
                    ⏹ 結束分析 · 產生報告
                </button>
            </div>
        </div>
    )
}

// Sub-components
function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-slate-800">{value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
        </div>
    )
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-700">{value}</span>
        </div>
    )
}

function HUDMetric({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
    return (
        <div className="text-center">
            <p className="text-white/40 text-[10px]">{label}</p>
            <p className={`font-mono font-bold text-base ${color || 'text-white'}`}>{value}</p>
            <p className="text-white/30 text-[9px]">{unit}</p>
        </div>
    )
}

function QualityDot({ label, ok }: { label: string; ok: boolean }) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-xs">{label}</span>
            <div className={`w-2 h-2 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400/60'}`} />
        </div>
    )
}
