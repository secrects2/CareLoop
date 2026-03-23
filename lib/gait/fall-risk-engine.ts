/**
 * Gait Analysis - Fall Risk Engine
 * 
 * 整合多指標計算跌倒風險分數
 * 輸出 0~100 分數與風險等級
 */

import { type GaitFeatures } from './gait-feature-engine'
import { type BalanceMetrics } from './balance-engine'

export type FallRiskLevel = 'low' | 'medium' | 'high' | 'very_high'

export interface FallRiskResult {
    score: number           // 0~100 (higher = more risk)
    level: FallRiskLevel
    factors: string[]       // 觸發的風險因子
    color: string           // UI 色彩
    label: string           // 顯示文字
}

/**
 * 計算跌倒風險分數
 */
export function computeFallRisk(
    features: GaitFeatures,
    balance: BalanceMetrics,
    symmetryIndex: number
): FallRiskResult {
    let score = 0
    const factors: string[] = []

    // 1. 步速偏慢 (20%)
    if (features.gaitSpeedRelative < 0.25) {
        score += 20
        factors.push('步速過慢')
    } else if (features.gaitSpeedRelative < 0.35) {
        score += 10
        factors.push('步速偏慢')
    }

    // 2. 步長變短 (15%)
    if (features.avgStepLengthNorm < 0.2) {
        score += 15
        factors.push('步長過短')
    } else if (features.avgStepLengthNorm < 0.3) {
        score += 8
        factors.push('步長偏短')
    }

    // 3. 左右不對稱 (15%)
    if (symmetryIndex < 0.6) {
        score += 15
        factors.push('左右嚴重不對稱')
    } else if (symmetryIndex < 0.75) {
        score += 8
        factors.push('左右不對稱')
    }

    // 4. 軀幹傾斜過大 (15%)
    if (balance.trunkTiltAvg > 20) {
        score += 15
        factors.push('軀幹嚴重傾斜')
    } else if (balance.trunkTiltAvg > 15) {
        score += 10
        factors.push('軀幹傾斜偏大')
    }

    // 5. 晃動增加 (10%)
    if (balance.lateralSwayNorm > 0.08) {
        score += 10
        factors.push('行走晃動大')
    } else if (balance.lateralSwayNorm > 0.05) {
        score += 5
        factors.push('行走晃動偏大')
    }

    // 6. 起步猶豫 (10%)
    if (features.hesitationDetected) {
        score += 10
        factors.push('起步猶豫')
    }

    // 7. 步態不連續 (10%)
    if (features.stepTimeCV > 25) {
        score += 10
        factors.push('步態不規律')
    } else if (features.stepTimeCV > 20) {
        score += 5
        factors.push('步態節奏偏不穩')
    }

    // 8. 停頓或不穩 (5%)
    if (!features.gaitContinuity) {
        score += 5
        factors.push('行走中有停頓')
    }

    score = Math.min(100, Math.max(0, score))

    let level: FallRiskLevel
    let color: string
    let label: string

    if (score >= 75) {
        level = 'very_high'
        color = 'text-red-600'
        label = '🔴 極高風險'
    } else if (score >= 50) {
        level = 'high'
        color = 'text-orange-500'
        label = '🟠 高風險'
    } else if (score >= 25) {
        level = 'medium'
        color = 'text-yellow-500'
        label = '🟡 中風險'
    } else {
        level = 'low'
        color = 'text-green-500'
        label = '🟢 低風險'
    }

    return { score, level, factors, color, label }
}

/**
 * 計算左右對稱性指數
 */
export function computeSymmetryIndex(
    leftSteps: { stepLengthPx: number; stanceDurationMs: number; swingDurationMs: number }[],
    rightSteps: { stepLengthPx: number; stanceDurationMs: number; swingDurationMs: number }[]
): { symmetryIndex: number; stepLengthAsymmetry: number; stanceTimeAsymmetry: number; swingTimeAsymmetry: number } {
    if (leftSteps.length < 2 || rightSteps.length < 2) {
        return { symmetryIndex: 1, stepLengthAsymmetry: 0, stanceTimeAsymmetry: 0, swingTimeAsymmetry: 0 }
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const asymmetry = (a: number, b: number) => {
        const mx = Math.max(a, b)
        return mx > 0 ? Math.abs(a - b) / mx : 0
    }

    const avgStepL = avg(leftSteps.map(s => s.stepLengthPx))
    const avgStepR = avg(rightSteps.map(s => s.stepLengthPx))
    const avgStanceL = avg(leftSteps.map(s => s.stanceDurationMs))
    const avgStanceR = avg(rightSteps.map(s => s.stanceDurationMs))
    const avgSwingL = avg(leftSteps.map(s => s.swingDurationMs))
    const avgSwingR = avg(rightSteps.map(s => s.swingDurationMs))

    const stepLengthAsymmetry = asymmetry(avgStepL, avgStepR)
    const stanceTimeAsymmetry = asymmetry(avgStanceL, avgStanceR)
    const swingTimeAsymmetry = asymmetry(avgSwingL, avgSwingR)

    const symmetryIndex = Math.max(0, Math.min(1,
        1 - (stepLengthAsymmetry + stanceTimeAsymmetry + swingTimeAsymmetry) / 3
    ))

    return {
        symmetryIndex: Math.round(symmetryIndex * 100) / 100,
        stepLengthAsymmetry: Math.round(stepLengthAsymmetry * 100) / 100,
        stanceTimeAsymmetry: Math.round(stanceTimeAsymmetry * 100) / 100,
        swingTimeAsymmetry: Math.round(swingTimeAsymmetry * 100) / 100,
    }
}
