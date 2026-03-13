/**
 * SPPB 平衡測試 — 空間幾何演算法層
 * 足部姿態檢測 + 穩定性/代償監測
 */

// ============================================================================
// 型別
// ============================================================================

/** MediaPipe Pose Normalized Landmark */
export interface NormalizedLandmark {
    x: number // 0~1，畫面水平
    y: number // 0~1，畫面垂直
    z: number // 深度，通常 -1~1
    visibility?: number
}

// ============================================================================
// MediaPipe Landmark Index
// ============================================================================

export const L_SHOULDER = 11
export const R_SHOULDER = 12
export const L_WRIST = 15
export const R_WRIST = 16
export const L_HIP = 23
export const R_HIP = 24
export const L_HEEL = 29
export const R_HEEL = 30
export const L_FOOT_INDEX = 31 // 左腳尖
export const R_FOOT_INDEX = 32 // 右腳尖

// ============================================================================
// 可調閾值常數（臨床微調用）
// ============================================================================

/** 並排站立：左右腳跟 X 軸最大容許距離 */
export const SIDE_BY_SIDE_X_THRESHOLD = 0.12
/** 並排站立：左右腳跟 Z 軸最大容許距離 */
export const SIDE_BY_SIDE_Z_THRESHOLD = 0.08

/** 半並排站立：腳尖對齊中點的 Z 軸容許誤差 */
export const SEMI_TANDEM_Z_THRESHOLD = 0.10
/** 半並排站立：X 軸容許偏移 */
export const SEMI_TANDEM_X_THRESHOLD = 0.10

/** 直線站立：腳跟與腳尖的 X 軸容許距離 */
export const TANDEM_X_THRESHOLD = 0.08
/** 直線站立：腳跟與腳尖的 Z 軸容許距離 */
export const TANDEM_Z_THRESHOLD = 0.06

/** 穩定性：肩膀傾斜最大角度（度） */
export const MAX_SHOULDER_TILT_DEG = 15
/** 穩定性：手腕與髖關節 X 軸最大水平距離（代償：張開雙臂） */
export const MAX_ARM_SPREAD_X = 0.20

/** Landmark 最低可見度 */
const MIN_VISIBILITY = 0.4

// ============================================================================
// 工具函式
// ============================================================================

/** 安全取得 landmark，可見度不足回傳 null */
function getLandmark(landmarks: NormalizedLandmark[], idx: number): NormalizedLandmark | null {
    if (!landmarks || idx >= landmarks.length) return null
    const lm = landmarks[idx]
    if (lm.visibility !== undefined && lm.visibility < MIN_VISIBILITY) return null
    return lm
}

// ============================================================================
// 足部姿態檢測
// ============================================================================

/**
 * 並排站立 (Side-by-side)
 * 檢查左右腳跟 x 與 z 軸距離是否在容許範圍
 * 雙腳應平行並排
 */
export function checkSideBySide(landmarks: NormalizedLandmark[]): boolean {
    const lHeel = getLandmark(landmarks, L_HEEL)
    const rHeel = getLandmark(landmarks, R_HEEL)
    if (!lHeel || !rHeel) return false

    // Z 軸差異要小（前後對齊）
    const zDiff = Math.abs(lHeel.z - rHeel.z)
    if (zDiff > SIDE_BY_SIDE_Z_THRESHOLD) return false

    // X 軸差異要適中（左右並排但不能太遠）
    const xDiff = Math.abs(lHeel.x - rHeel.x)
    if (xDiff > SIDE_BY_SIDE_X_THRESHOLD) return false

    // 至少要有一些 x 距離（雙腳確實分開）
    if (xDiff < 0.02) return false

    return true
}

/**
 * 半並排站立 (Semi-tandem)
 * 一腳腳跟靠另一腳中段
 * 計算一腳的 (腳跟+腳尖)/2 中點 z，另一腳尖對齊該中點
 */
export function checkSemiTandem(landmarks: NormalizedLandmark[]): boolean {
    const lHeel = getLandmark(landmarks, L_HEEL)
    const rHeel = getLandmark(landmarks, R_HEEL)
    const lToe = getLandmark(landmarks, L_FOOT_INDEX)
    const rToe = getLandmark(landmarks, R_FOOT_INDEX)
    if (!lHeel || !rHeel || !lToe || !rToe) return false

    // 計算右腳中點 z
    const rMidZ = (rHeel.z + rToe.z) / 2
    // 左腳腳跟的 z 應對齊右腳中點
    const zDiff1 = Math.abs(lHeel.z - rMidZ)

    // 也檢查反方向
    const lMidZ = (lHeel.z + lToe.z) / 2
    const zDiff2 = Math.abs(rHeel.z - lMidZ)

    // 取兩個方向中較符合的
    const bestZDiff = Math.min(zDiff1, zDiff2)
    if (bestZDiff > SEMI_TANDEM_Z_THRESHOLD) return false

    // X 軸不能偏太多
    const xDiff = Math.abs(lHeel.x - rHeel.x)
    if (xDiff > SEMI_TANDEM_X_THRESHOLD) return false

    return true
}

/**
 * 直線站立 (Tandem)
 * 一腳腳跟緊貼另一腳腳尖（前後一直線）
 */
export function checkTandem(landmarks: NormalizedLandmark[]): boolean {
    const lHeel = getLandmark(landmarks, L_HEEL)
    const rHeel = getLandmark(landmarks, R_HEEL)
    const lToe = getLandmark(landmarks, L_FOOT_INDEX)
    const rToe = getLandmark(landmarks, R_FOOT_INDEX)
    if (!lHeel || !rHeel || !lToe || !rToe) return false

    // 配置1：左腳跟 對齊 右腳尖
    const config1X = Math.abs(lHeel.x - rToe.x)
    const config1Z = Math.abs(lHeel.z - rToe.z)

    // 配置2：右腳跟 對齊 左腳尖
    const config2X = Math.abs(rHeel.x - lToe.x)
    const config2Z = Math.abs(rHeel.z - lToe.z)

    // 任一配置符合
    const config1Ok = config1X < TANDEM_X_THRESHOLD && config1Z < TANDEM_Z_THRESHOLD
    const config2Ok = config2X < TANDEM_X_THRESHOLD && config2Z < TANDEM_Z_THRESHOLD

    return config1Ok || config2Ok
}

// ============================================================================
// 穩定性 / 防跌倒 / 代償檢測
// ============================================================================

export interface StabilityResult {
    stable: boolean
    reason: string | null
    shoulderTilt: number
}

/**
 * 綜合穩定性檢查
 * a. 肩膀水平面傾斜角 > 15° → 不穩
 * b. 手腕遠離髖關節 → 代償（張開雙臂）
 */
export function checkStability(landmarks: NormalizedLandmark[]): StabilityResult {
    const lShoulder = getLandmark(landmarks, L_SHOULDER)
    const rShoulder = getLandmark(landmarks, R_SHOULDER)
    const lWrist = getLandmark(landmarks, L_WRIST)
    const rWrist = getLandmark(landmarks, R_WRIST)
    const lHip = getLandmark(landmarks, L_HIP)
    const rHip = getLandmark(landmarks, R_HIP)

    // 預設穩定
    const result: StabilityResult = { stable: true, reason: null, shoulderTilt: 0 }

    // (a) 肩膀傾斜
    if (lShoulder && rShoulder) {
        const dx = rShoulder.x - lShoulder.x
        const dy = rShoulder.y - lShoulder.y
        const tiltRad = Math.atan2(Math.abs(dy), Math.abs(dx))
        const tiltDeg = (tiltRad * 180) / Math.PI
        result.shoulderTilt = Math.round(tiltDeg)

        if (tiltDeg > MAX_SHOULDER_TILT_DEG) {
            result.stable = false
            result.reason = '身體傾斜過大'
            return result
        }
    }

    // (b) 代償：手腕遠離髖關節
    if (lWrist && lHip) {
        const lArmSpread = Math.abs(lWrist.x - lHip.x)
        if (lArmSpread > MAX_ARM_SPREAD_X) {
            result.stable = false
            result.reason = '左手張開（代償動作）'
            return result
        }
    }

    if (rWrist && rHip) {
        const rArmSpread = Math.abs(rWrist.x - rHip.x)
        if (rArmSpread > MAX_ARM_SPREAD_X) {
            result.stable = false
            result.reason = '右手張開（代償動作）'
            return result
        }
    }

    return result
}
