/**
 * Gait Analysis - Pose Quality Guard
 * 
 * Landmark 可見度檢查、Z 軸可靠度檢查、全身入鏡守衛
 * 支援自動降級 2D 計算
 */

import { type RealLandmark, GAIT_LANDMARKS } from './coordinate-transformer'

export interface PoseQualityResult {
    visibility_ok: boolean
    z_reliable: boolean
    full_body: boolean
    no_multi_person: boolean
    auto_2d_mode: boolean
    lower_body_visible: boolean
    quality_score: number  // 0~100
}

// 存放 Z 軸歷史用於標準差計算
const Z_HISTORY_SIZE = 10
let zHistory: number[][] = []

/**
 * 檢查步態所需的核心 landmarks 可見度
 */
function checkVisibility(landmarks: RealLandmark[]): { visible: boolean; lowerBody: boolean } {
    const required = [
        GAIT_LANDMARKS.LEFT_SHOULDER,
        GAIT_LANDMARKS.RIGHT_SHOULDER,
        GAIT_LANDMARKS.LEFT_HIP,
        GAIT_LANDMARKS.RIGHT_HIP,
    ]
    const lowerBody = [
        GAIT_LANDMARKS.LEFT_KNEE,
        GAIT_LANDMARKS.RIGHT_KNEE,
        GAIT_LANDMARKS.LEFT_ANKLE,
        GAIT_LANDMARKS.RIGHT_ANKLE,
    ]

    const upperOk = required.every(idx => (landmarks[idx]?.visibility ?? 0) > 0.5)
    const lowerOk = lowerBody.filter(idx => (landmarks[idx]?.visibility ?? 0) > 0.5).length >= 3

    return { visible: upperOk, lowerBody: lowerOk }
}

/**
 * 檢查全身入鏡
 */
function checkFullBody(landmarks: RealLandmark[], imgH: number): boolean {
    const nose = landmarks[GAIT_LANDMARKS.NOSE]
    const lAnkle = landmarks[GAIT_LANDMARKS.LEFT_ANKLE]
    const rAnkle = landmarks[GAIT_LANDMARKS.RIGHT_ANKLE]

    if (!nose || !lAnkle || !rAnkle) return false
    if ((nose.visibility ?? 0) < 0.3) return false
    if (Math.max(lAnkle.visibility ?? 0, rAnkle.visibility ?? 0) < 0.3) return false

    // 頭在畫面上方 5% 內、腳在畫面下方 5% 內
    const noseNorm = nose.y / imgH
    const ankleNorm = Math.max(lAnkle.y, rAnkle.y) / imgH

    return noseNorm > 0.02 && ankleNorm < 0.98
}

/**
 * Z 軸可靠度：連續幀的標準差
 */
function checkZReliability(landmarks: RealLandmark[], imgW: number): boolean {
    const zValues = [
        GAIT_LANDMARKS.LEFT_HIP,
        GAIT_LANDMARKS.RIGHT_HIP,
        GAIT_LANDMARKS.LEFT_KNEE,
        GAIT_LANDMARKS.RIGHT_KNEE,
        GAIT_LANDMARKS.LEFT_ANKLE,
        GAIT_LANDMARKS.RIGHT_ANKLE,
    ].map(idx => landmarks[idx]?.z ?? 0)

    zHistory.push(zValues)
    if (zHistory.length > Z_HISTORY_SIZE) zHistory.shift()
    if (zHistory.length < 5) return true // 資料不足，暫時信任

    // 計算每個 landmark 的 z 時序標準差
    const stds = zValues.map((_, i) => {
        const series = zHistory.map(h => h[i])
        const mean = series.reduce((a, b) => a + b, 0) / series.length
        const variance = series.reduce((a, v) => a + (v - mean) ** 2, 0) / series.length
        return Math.sqrt(variance)
    })

    const avgStd = stds.reduce((a, b) => a + b, 0) / stds.length
    const threshold = 0.05 * imgW

    return avgStd < threshold
}

/**
 * 多人偵測：骨架跳動判斷
 */
let prevHipCenter: { x: number; y: number } | null = null

function checkMultiPerson(landmarks: RealLandmark[], bodyHeight: number): boolean {
    const lHip = landmarks[GAIT_LANDMARKS.LEFT_HIP]
    const rHip = landmarks[GAIT_LANDMARKS.RIGHT_HIP]
    if (!lHip || !rHip) return true

    const hipCenter = {
        x: (lHip.x + rHip.x) / 2,
        y: (lHip.y + rHip.y) / 2,
    }

    if (prevHipCenter && bodyHeight > 0) {
        const jump = Math.sqrt(
            (hipCenter.x - prevHipCenter.x) ** 2 +
            (hipCenter.y - prevHipCenter.y) ** 2
        )
        // 若骨架跳動 > 身高 30%，懷疑換人或多人干擾
        if (jump > bodyHeight * 0.3) {
            prevHipCenter = hipCenter
            return false
        }
    }

    prevHipCenter = hipCenter
    return true
}

/**
 * 主要品質守衛函式
 */
export function checkPoseQuality(
    landmarks: RealLandmark[],
    imageWidth: number,
    imageHeight: number,
    bodyHeightPx: number
): PoseQualityResult {
    const { visible, lowerBody } = checkVisibility(landmarks)
    const fullBody = checkFullBody(landmarks, imageHeight)
    const zReliable = checkZReliability(landmarks, imageWidth)
    const noMulti = checkMultiPerson(landmarks, bodyHeightPx)

    let score = 100
    if (!visible) score -= 40
    if (!lowerBody) score -= 30
    if (!fullBody) score -= 15
    if (!zReliable) score -= 10
    if (!noMulti) score -= 20
    score = Math.max(0, score)

    return {
        visibility_ok: visible && lowerBody,
        z_reliable: zReliable,
        full_body: fullBody,
        no_multi_person: noMulti,
        auto_2d_mode: !zReliable,
        lower_body_visible: lowerBody,
        quality_score: score,
    }
}

/**
 * 重置狀態（新 session 時呼叫）
 */
export function resetPoseQualityGuard() {
    zHistory = []
    prevHipCenter = null
}
