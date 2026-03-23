/**
 * Gait Analysis - Coordinate Transformer
 * Aspect-Ratio Aware 座標轉換 + 正規化工具
 * 
 * 沿用既有 BocciaCam 的 toRealPixels 概念
 * 擴展支援 body-height-normalized 座標系
 */

export interface Point3D {
    x: number
    y: number
    z: number
}

export interface NormalizedLandmark {
    x: number      // 0~1 normalized
    y: number      // 0~1 normalized
    z: number      // depth, same scale as x
    visibility: number
}

export interface RealLandmark extends Point3D {
    visibility: number
    index: number
}

/**
 * MediaPipe 正規化座標 → 真實像素座標 (Aspect-Ratio Aware)
 * 
 * 為何不能直接使用 normalized coordinates：
 * - 直式拍攝時 W=480, H=640，Δx=0.1 → 48px，Δy=0.1 → 64px
 * - 直接用正規化座標算角度會產生 ~33% 壓縮誤差
 * - 髖關節角度可能誤差 10°~15°
 */
export function toRealPixels(
    landmark: NormalizedLandmark,
    imageWidth: number,
    imageHeight: number
): RealLandmark {
    return {
        x: landmark.x * imageWidth,
        y: landmark.y * imageHeight,
        z: (landmark.z || 0) * imageWidth, // MediaPipe: z 與 x 同尺度
        visibility: landmark.visibility,
        index: -1,
    }
}

/**
 * 批量轉換所有 landmarks 為像素座標
 */
export function transformAllLandmarks(
    landmarks: NormalizedLandmark[],
    imageWidth: number,
    imageHeight: number
): RealLandmark[] {
    return landmarks.map((lm, idx) => ({
        ...toRealPixels(lm, imageWidth, imageHeight),
        index: idx,
    }))
}

/**
 * 計算身高（像素）：nose 到 ankle 最低點
 */
export function getBodyHeightPx(real: RealLandmark[]): number {
    const nose = real[0]
    const lAnkle = real[27]
    const rAnkle = real[28]
    if (!nose || !lAnkle || !rAnkle) return 0
    const lowestAnkle = Math.max(lAnkle.y, rAnkle.y)
    return Math.abs(lowestAnkle - nose.y)
}

/**
 * 正規化為身高單位（用於跨場景比較）
 */
export function normalizeByBodyHeight(valuePx: number, bodyHeightPx: number): number {
    if (bodyHeightPx <= 0) return 0
    return valuePx / bodyHeightPx
}

/**
 * 計算兩點距離（2D）
 */
export function distance2D(a: Point3D, b: Point3D): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/**
 * 計算兩點距離（3D）
 */
export function distance3D(a: Point3D, b: Point3D): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

/**
 * 計算中點
 */
export function midpoint(a: Point3D, b: Point3D): Point3D {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        z: (a.z + b.z) / 2,
    }
}

/**
 * 3D 向量角度計算 (A-B-C，B 為頂點)
 */
export function calculateAngle3D(a: Point3D, b: Point3D, c: Point3D): number {
    const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
    const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z }
    const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z
    const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2)
    const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2)
    if (magBA === 0 || magBC === 0) return 0
    const cosTheta = Math.max(-1, Math.min(1, dot / (magBA * magBC)))
    return Math.acos(cosTheta) * (180 / Math.PI)
}

/**
 * 軀幹傾斜角（相對垂直線）
 */
export function calculateTrunkTilt(
    shoulderMid: Point3D,
    hipMid: Point3D,
    use2D: boolean = false
): number {
    const dx = shoulderMid.x - hipMid.x
    const dy = shoulderMid.y - hipMid.y
    const dz = use2D ? 0 : (shoulderMid.z - hipMid.z)
    
    // 垂直長度（Y 軸）
    const verticalLen = Math.abs(dy)
    // 水平偏移（X + Z）
    const horizontalLen = Math.sqrt(dx * dx + dz * dz)
    
    if (verticalLen === 0) return horizontalLen > 0 ? 90 : 0
    return Math.abs(Math.atan2(horizontalLen, verticalLen) * (180 / Math.PI))
}

// MediaPipe Pose Landmark Indices
export const GAIT_LANDMARKS = {
    NOSE: 0,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32,
} as const
