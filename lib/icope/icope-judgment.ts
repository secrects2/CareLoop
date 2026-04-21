/**
 * ICOPE 初評 — 自動異常判定引擎
 * 依據國健署操作指引，由細項回答自動推算各面向是否異常
 */

import type {
    CognitionDetails,
    MobilityDetails,
    NutritionDetails,
    VisionDetails,
    HearingDetails,
    DepressionDetails,
} from '@/types/icope'

// ============================================================================
// A. 認知功能 — 任一題為「否」(false) → 異常
// ============================================================================
export function judgeCognition(details: CognitionDetails): boolean {
    const { memory_repeat, orientation_date, orientation_place, memory_recall } = details
    // 任一 false → 異常 (true)
    return !(memory_repeat && orientation_date && orientation_place && memory_recall)
}

// ============================================================================
// B. 行動功能 — 超過 12 秒或無法完成 → 異常
// ============================================================================
export function judgeMobility(details: MobilityDetails): boolean {
    if (!details.completed) return true
    if (details.chair_stand_seconds === null || details.chair_stand_seconds === undefined) return false
    return details.chair_stand_seconds > 12
}

// ============================================================================
// C. 營養不良 — 任一「是」 → 異常
// ============================================================================
export function judgeNutrition(details: NutritionDetails): boolean {
    return details.weight_loss || details.appetite_loss
}

// ============================================================================
// D. 視力障礙 — 第①為「是」，或第②任一未通過，或第③為「是」 → 異常
// ============================================================================
export function judgeVision(details: VisionDetails): boolean {
    if (details.difficulty_reported) return true
    if (details.who_far_pass === false || details.who_near_pass === false) return true
    if (details.high_risk_eye) return true
    return false
}

// ============================================================================
// E. 聽力障礙 — 兩組皆未通過 → 異常
// 注意：若第一組通過，第二組不需施測（group2_pass 為 null）
// ============================================================================
export function judgeHearing(details: HearingDetails): boolean {
    // 第一組通過 → 正常
    if (details.group1_pass) return false
    // 第一組未通過，第二組也未通過 → 異常
    if (details.group1_pass === false && details.group2_pass === false) return true
    // 第一組未通過，第二組通過 → 正常
    if (details.group1_pass === false && details.group2_pass === true) return false
    // 預設
    return false
}

// ============================================================================
// F. 憂鬱 — 任一「是」 → 異常
// ============================================================================
export function judgeDepression(details: DepressionDetails): boolean {
    return details.feeling_hopeless || details.reduced_interest
}
