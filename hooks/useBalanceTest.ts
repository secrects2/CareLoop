/**
 * SPPB 平衡測試 — 闖關狀態機 Hook
 * 三階段闖關：Side-by-side → Semi-tandem → Tandem
 */
import { useRef, useState, useCallback } from 'react'
import {
    checkSideBySide,
    checkSemiTandem,
    checkTandem,
    checkStability,
    type NormalizedLandmark,
    type StabilityResult,
} from '@/utils/balanceMath'

// ============================================================================
// 型別
// ============================================================================

export type TestStage = 'SIDE_BY_SIDE' | 'SEMI_TANDEM' | 'TANDEM' | 'COMPLETED'
export type PoseState = 'DETECTING' | 'HOLDING' | 'FAILED'

export interface BalanceStageResult {
    stage: TestStage
    passed: boolean
    holdTime: number // 實際維持秒數
    score: number
}

export interface BalanceTestResult {
    totalScore: number   // 0-4
    stages: BalanceStageResult[]
}

/** 闖關配置 */
const STAGE_ORDER: TestStage[] = ['SIDE_BY_SIDE', 'SEMI_TANDEM', 'TANDEM']
const HOLD_DURATION = 10 // 秒

export const STAGE_NAMES: Record<TestStage, string> = {
    SIDE_BY_SIDE: '並排站立',
    SEMI_TANDEM: '半並排站立',
    TANDEM: '直線站立',
    COMPLETED: '測試完成',
}

export const STAGE_DESCRIPTIONS: Record<TestStage, string> = {
    SIDE_BY_SIDE: '雙腳並排，維持 10 秒',
    SEMI_TANDEM: '一腳腳跟靠另一腳中段，維持 10 秒',
    TANDEM: '一腳腳跟緊貼另一腳腳尖，維持 10 秒',
    COMPLETED: '',
}

// ============================================================================
// Hook 選項
// ============================================================================

interface UseBalanceTestOptions {
    onComplete: (result: BalanceTestResult) => void
}

interface UseBalanceTestReturn {
    /** 當前關卡 */
    currentStage: TestStage
    /** 當前狀態 */
    poseState: PoseState
    /** 當前維持秒數（0-10） */
    holdTime: number
    /** 各關卡結果 */
    stageResults: BalanceStageResult[]
    /** 累積分數 */
    totalScore: number
    /** 穩定性資訊 */
    stability: StabilityResult | null
    /** 失敗原因 */
    failReason: string | null
    /** 每幀呼叫 */
    processPose: (landmarks: NormalizedLandmark[]) => void
    /** 重置 */
    reset: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function useBalanceTest({ onComplete }: UseBalanceTestOptions): UseBalanceTestReturn {
    // ---- UI state ----
    const [currentStage, setCurrentStage] = useState<TestStage>('SIDE_BY_SIDE')
    const [poseState, setPoseState] = useState<PoseState>('DETECTING')
    const [holdTime, setHoldTime] = useState(0)
    const [stageResults, setStageResults] = useState<BalanceStageResult[]>([])
    const [totalScore, setTotalScore] = useState(0)
    const [stability, setStability] = useState<StabilityResult | null>(null)
    const [failReason, setFailReason] = useState<string | null>(null)

    // ---- Refs ----
    const stageRef = useRef<TestStage>('SIDE_BY_SIDE')
    const poseStateRef = useRef<PoseState>('DETECTING')
    const holdStartRef = useRef<number | null>(null)
    const scoreRef = useRef(0)
    const resultsRef = useRef<BalanceStageResult[]>([])
    const frameCountRef = useRef(0)

    /** 對應關卡的姿態檢測函式 */
    const checkPoseForStage = (stage: TestStage, landmarks: NormalizedLandmark[]): boolean => {
        switch (stage) {
            case 'SIDE_BY_SIDE': return checkSideBySide(landmarks)
            case 'SEMI_TANDEM': return checkSemiTandem(landmarks)
            case 'TANDEM': return checkTandem(landmarks)
            default: return false
        }
    }

    /** 計算關卡分數 */
    const calculateStageScore = (stage: TestStage, holdSeconds: number, passed: boolean): number => {
        if (stage === 'SIDE_BY_SIDE') {
            // Stage 1: 10 秒 = 1 分，失敗 = 0 分（結束）
            return passed ? 1 : 0
        }
        if (stage === 'SEMI_TANDEM') {
            // Stage 2: 10 秒 = 1 分，失敗 = 0 分（結束）
            return passed ? 1 : 0
        }
        if (stage === 'TANDEM') {
            // Stage 3: 10 秒 = 2 分，3~9.99 秒 = 1 分，< 3 秒 = 0 分
            if (holdSeconds >= 10) return 2
            if (holdSeconds >= 3) return 1
            return 0
        }
        return 0
    }

    /** 結束一個關卡 */
    const finishStage = useCallback((stage: TestStage, holdSeconds: number, passed: boolean) => {
        const score = calculateStageScore(stage, holdSeconds, passed)
        scoreRef.current += score
        setTotalScore(scoreRef.current)

        const result: BalanceStageResult = {
            stage,
            passed,
            holdTime: parseFloat(holdSeconds.toFixed(1)),
            score,
        }
        resultsRef.current = [...resultsRef.current, result]
        setStageResults(resultsRef.current)

        // 判斷：Stage 1 / 2 失敗 → 整體結束
        if (!passed && (stage === 'SIDE_BY_SIDE' || stage === 'SEMI_TANDEM')) {
            stageRef.current = 'COMPLETED'
            setCurrentStage('COMPLETED')
            const finalResult: BalanceTestResult = {
                totalScore: scoreRef.current,
                stages: resultsRef.current,
            }
            onComplete(finalResult)
            return
        }

        // 進入下一關
        const currentIdx = STAGE_ORDER.indexOf(stage)
        if (currentIdx < STAGE_ORDER.length - 1) {
            const nextStage = STAGE_ORDER[currentIdx + 1]
            stageRef.current = nextStage
            poseStateRef.current = 'DETECTING'
            holdStartRef.current = null
            setCurrentStage(nextStage)
            setPoseState('DETECTING')
            setHoldTime(0)
            setFailReason(null)
        } else {
            // 最後關卡完成
            stageRef.current = 'COMPLETED'
            setCurrentStage('COMPLETED')
            const finalResult: BalanceTestResult = {
                totalScore: scoreRef.current,
                stages: resultsRef.current,
            }
            onComplete(finalResult)
        }
    }, [onComplete])

    /** 重置 */
    const reset = useCallback(() => {
        stageRef.current = 'SIDE_BY_SIDE'
        poseStateRef.current = 'DETECTING'
        holdStartRef.current = null
        scoreRef.current = 0
        resultsRef.current = []
        frameCountRef.current = 0
        setCurrentStage('SIDE_BY_SIDE')
        setPoseState('DETECTING')
        setHoldTime(0)
        setStageResults([])
        setTotalScore(0)
        setStability(null)
        setFailReason(null)
    }, [])

    /** 每幀處理 */
    const processPose = useCallback((landmarks: NormalizedLandmark[]) => {
        const stage = stageRef.current
        if (stage === 'COMPLETED') return

        frameCountRef.current++

        // 穩定性檢查
        const stab = checkStability(landmarks)

        // 每 3 幀更新 UI
        if (frameCountRef.current % 3 === 0) {
            setStability(stab)
        }

        // 姿態正確？
        const poseCorrect = checkPoseForStage(stage, landmarks)

        const currentPoseState = poseStateRef.current

        if (currentPoseState === 'DETECTING') {
            if (poseCorrect && stab.stable) {
                // 姿勢正確且穩定 → 開始計時
                holdStartRef.current = Date.now()
                poseStateRef.current = 'HOLDING'
                setPoseState('HOLDING')
                setFailReason(null)
            }
        } else if (currentPoseState === 'HOLDING') {
            // 計算經過時間
            const elapsed = holdStartRef.current
                ? (Date.now() - holdStartRef.current) / 1000
                : 0

            if (frameCountRef.current % 3 === 0) {
                setHoldTime(parseFloat(elapsed.toFixed(1)))
            }

            if (!poseCorrect || !stab.stable) {
                // 姿勢跑掉或不穩定
                const reason = !stab.stable
                    ? stab.reason || '失去平衡'
                    : '姿勢不正確'

                if (stage === 'TANDEM') {
                    // Stage 3：記錄已維持的秒數，計分後結束
                    finishStage(stage, elapsed, elapsed >= 10)
                } else {
                    // Stage 1/2：失敗
                    setFailReason(reason)
                    finishStage(stage, elapsed, false)
                }
                return
            }

            // 成功維持 10 秒
            if (elapsed >= HOLD_DURATION) {
                finishStage(stage, HOLD_DURATION, true)
            }
        }
    }, [finishStage])

    return {
        currentStage,
        poseState,
        holdTime,
        stageResults,
        totalScore,
        stability,
        failReason,
        processPose,
        reset,
    }
}
