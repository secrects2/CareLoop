/**
 * Gait Analysis - Balance Engine
 * 
 * 軀幹傾斜、中軸穩定度、左右晃動、頭部穩定度、骨盆穩定度
 */

import { type RealLandmark, GAIT_LANDMARKS, midpoint, calculateTrunkTilt } from './coordinate-transformer'

export interface BalanceMetrics {
    trunkTiltAvg: number        // degrees
    trunkTiltMax: number        // degrees
    trunkTiltCurrent: number    // degrees
    lateralSwayAmplitude: number // px (peak-to-peak hip center X)
    lateralSwayNorm: number     // normalized by body height
    headStabilityScore: number  // 0~100
    pelvicStabilityScore: number // 0~100
    midlineStability: number    // std of midline X offset
    balanceScore: number        // 0~100 composite
}

export class BalanceEngine {
    private trunkTilts: number[] = []
    private hipCenterXs: number[] = []
    private noseDisplacements: number[] = []
    private pelvicDiffs: number[] = []
    private midlineOffsets: number[] = []
    private prevNose: { x: number; y: number } | null = null
    private bodyHeightPx = 0

    processFrame(landmarks: RealLandmark[], use2D: boolean, bodyHeight: number) {
        this.bodyHeightPx = bodyHeight

        const lShoulder = landmarks[GAIT_LANDMARKS.LEFT_SHOULDER]
        const rShoulder = landmarks[GAIT_LANDMARKS.RIGHT_SHOULDER]
        const lHip = landmarks[GAIT_LANDMARKS.LEFT_HIP]
        const rHip = landmarks[GAIT_LANDMARKS.RIGHT_HIP]
        const nose = landmarks[GAIT_LANDMARKS.NOSE]

        if (!lShoulder || !rShoulder || !lHip || !rHip) return
        if (lShoulder.visibility < 0.4 || rShoulder.visibility < 0.4) return
        if (lHip.visibility < 0.4 || rHip.visibility < 0.4) return

        const shoulderMid = midpoint(lShoulder, rShoulder)
        const hipMid = midpoint(lHip, rHip)

        // 軀幹傾斜
        const tilt = calculateTrunkTilt(shoulderMid, hipMid, use2D)
        this.trunkTilts.push(tilt)

        // 臀中點 X（左右晃動）
        this.hipCenterXs.push(hipMid.x)

        // 中軸偏移：鼻子 X 與臀中點 X 的差
        if (nose && nose.visibility > 0.4) {
            this.midlineOffsets.push(nose.x - hipMid.x)
        }

        // 頭部穩定度：鼻子幀間位移
        if (nose && nose.visibility > 0.4) {
            if (this.prevNose) {
                const disp = Math.sqrt(
                    (nose.x - this.prevNose.x) ** 2 +
                    (nose.y - this.prevNose.y) ** 2
                )
                this.noseDisplacements.push(disp)
            }
            this.prevNose = { x: nose.x, y: nose.y }
        }

        // 骨盆穩定度：左右臀高度差
        const pelvicDiff = Math.abs(lHip.y - rHip.y)
        this.pelvicDiffs.push(pelvicDiff)
    }

    computeMetrics(): BalanceMetrics {
        const bh = this.bodyHeightPx || 1

        // 軀幹傾斜
        const trunkTiltAvg = this.avg(this.trunkTilts)
        const trunkTiltMax = this.trunkTilts.length > 0 ? Math.max(...this.trunkTilts) : 0
        const trunkTiltCurrent = this.trunkTilts.length > 0
            ? this.trunkTilts[this.trunkTilts.length - 1] : 0

        // 左右晃動
        let lateralSwayAmplitude = 0
        if (this.hipCenterXs.length > 10) {
            // 去趨勢（行走時 X 會有整體位移）
            const detrended = this.detrend(this.hipCenterXs)
            lateralSwayAmplitude = Math.max(...detrended) - Math.min(...detrended)
        }
        const lateralSwayNorm = lateralSwayAmplitude / bh

        // 頭部穩定度
        const noseJitter = this.std(this.noseDisplacements)
        const noseJitterNorm = noseJitter / bh
        const headStabilityScore = Math.max(0, Math.min(100,
            100 - noseJitterNorm * 2000
        ))

        // 骨盆穩定度
        const pelvicStd = this.std(this.pelvicDiffs)
        const pelvicNorm = pelvicStd / bh
        const pelvicStabilityScore = Math.max(0, Math.min(100,
            100 - pelvicNorm * 1500
        ))

        // 中軸穩定度
        const midlineStability = this.std(this.midlineOffsets)

        // 綜合 balance_score
        let balanceScore = 100
        if (trunkTiltAvg > 10) balanceScore -= (trunkTiltAvg - 10) * 3
        if (lateralSwayNorm > 0.05) balanceScore -= lateralSwayNorm * 200
        if (noseJitterNorm > 0.03) balanceScore -= noseJitterNorm * 150
        if (pelvicNorm > 0.04) balanceScore -= pelvicNorm * 100
        balanceScore = Math.max(0, Math.min(100, balanceScore))

        return {
            trunkTiltAvg: Math.round(trunkTiltAvg * 10) / 10,
            trunkTiltMax: Math.round(trunkTiltMax * 10) / 10,
            trunkTiltCurrent: Math.round(trunkTiltCurrent * 10) / 10,
            lateralSwayAmplitude: Math.round(lateralSwayAmplitude),
            lateralSwayNorm: Math.round(lateralSwayNorm * 1000) / 1000,
            headStabilityScore: Math.round(headStabilityScore),
            pelvicStabilityScore: Math.round(pelvicStabilityScore),
            midlineStability: Math.round(midlineStability * 10) / 10,
            balanceScore: Math.round(balanceScore),
        }
    }

    private avg(arr: number[]): number {
        return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    }

    private std(arr: number[]): number {
        if (arr.length < 2) return 0
        const mean = this.avg(arr)
        const variance = arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length
        return Math.sqrt(variance)
    }

    /**
     * 簡易去趨勢（減去線性迴歸趨勢）
     */
    private detrend(arr: number[]): number[] {
        const n = arr.length
        if (n < 3) return arr
        const first = arr[0]
        const last = arr[n - 1]
        const slope = (last - first) / (n - 1)
        return arr.map((v, i) => v - (first + slope * i))
    }

    reset() {
        this.trunkTilts = []
        this.hipCenterXs = []
        this.noseDisplacements = []
        this.pelvicDiffs = []
        this.midlineOffsets = []
        this.prevNose = null
        this.bodyHeightPx = 0
    }
}
