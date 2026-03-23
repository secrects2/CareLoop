/**
 * Gait Analysis - Gait Feature Engine
 * 
 * 計算步速、步頻、步長
 * 整合 GaitEventDetector 的步數資料
 */

import { type StepData } from './gait-event-detector'
import { type RealLandmark, GAIT_LANDMARKS, midpoint, distance2D, normalizeByBodyHeight } from './coordinate-transformer'

export interface GaitFeatures {
    // 步速
    gaitSpeedRelative: number       // body_heights/s
    gaitSpeedPxPerSec: number       // px/s (raw)
    
    // 步頻
    cadence: number                 // steps/min
    
    // 步長
    avgStepLengthPx: number         // px
    avgStepLengthNorm: number       // body_height units
    avgStrideLengthNorm: number     // body_height units (左→左或右→右)
    stepLengthCV: number            // coefficient of variation %
    
    // 時間
    avgStepDurationMs: number
    avgStanceDurationMs: number
    avgSwingDurationMs: number
    stanceSwingRatio: number        // stance / swing
    
    // 有效數據
    validSteps: number
    totalDurationSec: number
    
    // 起步延遲
    hesitationDetected: boolean
    firstStepDelayMs: number
    
    // 步態連續性
    stepTimeCV: number              // 步間時間變異係數 %
    gaitContinuity: boolean         // 無異常停頓
}

export class GaitFeatureEngine {
    private hipHistory: { x: number; y: number; timestamp: number }[] = []
    private totalHipDisplacement = 0
    private sessionStartTime = 0
    private firstFrameTime = 0

    /**
     * 每幀更新臀中點追蹤（用於速度計算）
     */
    updateHipTracking(landmarks: RealLandmark[], timestamp: number) {
        const lHip = landmarks[GAIT_LANDMARKS.LEFT_HIP]
        const rHip = landmarks[GAIT_LANDMARKS.RIGHT_HIP]
        if (!lHip || !rHip) return
        if (lHip.visibility < 0.4 || rHip.visibility < 0.4) return

        const hipCenter = midpoint(lHip, rHip)

        if (this.hipHistory.length === 0) {
            this.sessionStartTime = timestamp
            this.firstFrameTime = timestamp
        }

        if (this.hipHistory.length > 0) {
            const last = this.hipHistory[this.hipHistory.length - 1]
            const disp = distance2D(hipCenter, { x: last.x, y: last.y, z: 0 })
            this.totalHipDisplacement += disp
        }

        this.hipHistory.push({ x: hipCenter.x, y: hipCenter.y, timestamp })
    }

    /**
     * 計算所有步態特徵
     */
    computeFeatures(steps: StepData[], bodyHeightPx: number): GaitFeatures {
        const validSteps = steps.length
        const now = this.hipHistory.length > 0
            ? this.hipHistory[this.hipHistory.length - 1].timestamp
            : Date.now()
        const totalDurationSec = (now - this.sessionStartTime) / 1000

        // 步速（相對）
        let gaitSpeedRelative = 0
        let gaitSpeedPxPerSec = 0
        if (totalDurationSec > 0 && bodyHeightPx > 0) {
            gaitSpeedPxPerSec = this.totalHipDisplacement / totalDurationSec
            gaitSpeedRelative = normalizeByBodyHeight(gaitSpeedPxPerSec, bodyHeightPx)
        }

        // 步頻
        const cadence = totalDurationSec > 0 ? (validSteps / totalDurationSec) * 60 : 0

        // 步長
        const stepLengths = steps.map(s => s.stepLengthPx)
        const avgStepLengthPx = stepLengths.length > 0
            ? stepLengths.reduce((a, b) => a + b, 0) / stepLengths.length : 0
        const avgStepLengthNorm = normalizeByBodyHeight(avgStepLengthPx, bodyHeightPx)
        const avgStrideLengthNorm = avgStepLengthNorm * 2 // 近似

        // 步長變異係數
        const stepLengthCV = this.calcCV(stepLengths)

        // 時間指標
        const stepDurations = steps.map(s => s.stanceDurationMs + s.swingDurationMs)
        const stanceDurations = steps.map(s => s.stanceDurationMs)
        const swingDurations = steps.map(s => s.swingDurationMs)

        const avgStepDurationMs = this.avg(stepDurations)
        const avgStanceDurationMs = this.avg(stanceDurations)
        const avgSwingDurationMs = this.avg(swingDurations)
        const stanceSwingRatio = avgSwingDurationMs > 0 ? avgStanceDurationMs / avgSwingDurationMs : 0

        // 步間時間 CV
        const stepTimeCV = this.calcCV(stepDurations)

        // 起步延遲
        const firstStepDelayMs = steps.length > 0
            ? steps[0].icTimestamp - this.firstFrameTime : 0
        const hesitationDetected = firstStepDelayMs > 2000

        // 步態連續性
        const maxGap = stepDurations.length > 1
            ? Math.max(...stepDurations) : 0
        const gaitContinuity = maxGap < 2000 // 無 > 2 秒的停頓

        return {
            gaitSpeedRelative: Math.round(gaitSpeedRelative * 100) / 100,
            gaitSpeedPxPerSec: Math.round(gaitSpeedPxPerSec),
            cadence: Math.round(cadence),
            avgStepLengthPx: Math.round(avgStepLengthPx),
            avgStepLengthNorm: Math.round(avgStepLengthNorm * 100) / 100,
            avgStrideLengthNorm: Math.round(avgStrideLengthNorm * 100) / 100,
            stepLengthCV: Math.round(stepLengthCV * 10) / 10,
            avgStepDurationMs: Math.round(avgStepDurationMs),
            avgStanceDurationMs: Math.round(avgStanceDurationMs),
            avgSwingDurationMs: Math.round(avgSwingDurationMs),
            stanceSwingRatio: Math.round(stanceSwingRatio * 100) / 100,
            validSteps,
            totalDurationSec: Math.round(totalDurationSec * 10) / 10,
            hesitationDetected,
            firstStepDelayMs: Math.round(firstStepDelayMs),
            stepTimeCV: Math.round(stepTimeCV * 10) / 10,
            gaitContinuity,
        }
    }

    private avg(arr: number[]): number {
        return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    }

    private calcCV(arr: number[]): number {
        if (arr.length < 2) return 0
        const mean = this.avg(arr)
        if (mean === 0) return 0
        const variance = arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length
        return (Math.sqrt(variance) / mean) * 100
    }

    reset() {
        this.hipHistory = []
        this.totalHipDisplacement = 0
        this.sessionStartTime = 0
        this.firstFrameTime = 0
    }
}
