/**
 * Gait Analysis - The Brain Rules Engine (步態版)
 * 
 * 沿用既有 The Brain 的優先級思維
 * P0~P6 步態版規則
 */

import { type GaitFeatures } from './gait-feature-engine'
import { type BalanceMetrics } from './balance-engine'
import { type FallRiskResult } from './fall-risk-engine'
import { type PoseQualityResult } from './pose-quality-guard'

export type BrainPriority = 'P0' | 'P0.3' | 'P0.5' | 'P0.8' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6'
export type AlertLevel = 'normal' | 'attention' | 'warning' | 'critical'

export interface BrainResult {
    priority: BrainPriority
    message: string
    reportMessage: string
    alertLevel: AlertLevel
    color: string
    borderColor: string
    icon: string
    canGenerateReport: boolean
    aiSuggestions: string[]
}

export function evaluateBrainRules(
    quality: PoseQualityResult,
    features: GaitFeatures | null,
    balance: BalanceMetrics | null,
    fallRisk: FallRiskResult | null,
    symmetryIndex: number,
    cameraStable: boolean,
): BrainResult {
    // P0: 資料品質極差
    if (quality.quality_score < 30) {
        return {
            priority: 'P0',
            message: '🚫 資料品質不足，無法分析',
            reportMessage: '本次分析因資料品質不足而無效，建議重新測試。',
            alertLevel: 'critical',
            color: 'text-red-500',
            borderColor: 'ring-red-500/80',
            icon: '🚫',
            canGenerateReport: false,
            aiSuggestions: [],
        }
    }

    // P0.3: 手機晃動過大
    if (!cameraStable) {
        return {
            priority: 'P0.3',
            message: '📱 手機晃動過大，請穩定裝置',
            reportMessage: '分析期間手機晃動超出可接受範圍，數據可信度受影響。',
            alertLevel: 'warning',
            color: 'text-orange-400',
            borderColor: 'ring-orange-400/70',
            icon: '📱',
            canGenerateReport: false,
            aiSuggestions: [],
        }
    }

    // P0.5: 人體未完整入鏡 / 多人干擾
    if (!quality.full_body || !quality.no_multi_person || !quality.visibility_ok) {
        return {
            priority: 'P0.5',
            message: '⚠️ 請確保受測者完整入鏡',
            reportMessage: '因拍攝條件不符，部分分析數據可能不完整。',
            alertLevel: 'warning',
            color: 'text-amber-400',
            borderColor: 'ring-amber-400/60',
            icon: '⚠️',
            canGenerateReport: false,
            aiSuggestions: [],
        }
    }

    // P0.8: 步數不足
    if (!features || features.validSteps < 6) {
        const stepCount = features?.validSteps ?? 0
        return {
            priority: 'P0.8',
            message: `ℹ️ 有效步數 ${stepCount}/6，請繼續行走`,
            reportMessage: '有效步數不足 6 步，無法產生完整步態報告。',
            alertLevel: 'attention',
            color: 'text-blue-400',
            borderColor: 'ring-blue-500/60',
            icon: 'ℹ️',
            canGenerateReport: false,
            aiSuggestions: [],
        }
    }

    // P1: 高跌倒風險
    if (fallRisk && fallRisk.score >= 75) {
        return {
            priority: 'P1',
            message: '🔴 跌倒風險高，建議進一步評估',
            reportMessage: '綜合評估顯示跌倒風險偏高，建議轉介專業復健評估。',
            alertLevel: 'critical',
            color: 'text-red-500',
            borderColor: 'ring-red-500/80',
            icon: '🔴',
            canGenerateReport: true,
            aiSuggestions: [
                '建議立即轉介復健科或老年醫學科進行完整評估',
                '考慮使用助行器或拐杖等輔具',
                '居家環境需進行跌倒風險評估與改善',
                '建議每週進行至少 3 次平衡訓練',
            ],
        }
    }

    // P2: 平衡顯著不足
    if (balance && balance.balanceScore < 40) {
        return {
            priority: 'P2',
            message: '🟠 平衡穩定度異常',
            reportMessage: '行走中軀幹晃動及骨盆穩定度低於正常範圍，建議平衡訓練。',
            alertLevel: 'warning',
            color: 'text-orange-500',
            borderColor: 'ring-orange-500/70',
            icon: '🟠',
            canGenerateReport: true,
            aiSuggestions: [
                '建議進行單腳站立練習（扶椅背，每次 10 秒 ×10 回）',
                '建議融入太極拳或瑜珈等平衡訓練活動',
                '建議 4 週後再次評估追蹤改善',
            ],
        }
    }

    // P3: 左右不對稱
    if (symmetryIndex < 0.75) {
        return {
            priority: 'P3',
            message: '🟡 步態左右不對稱',
            reportMessage: '左右步態差異明顯，可能與肌力不均或關節問題相關。',
            alertLevel: 'attention',
            color: 'text-yellow-500',
            borderColor: 'ring-yellow-500/60',
            icon: '🟡',
            canGenerateReport: true,
            aiSuggestions: [
                '建議針對較弱側進行肌力強化訓練',
                '留意是否有髖關節或膝關節疼痛影響步態',
                '建議 4 週後再次評估以追蹤改善趨勢',
            ],
        }
    }

    // P4: 步速偏慢 / 疑似衰弱
    if (features.gaitSpeedRelative < 0.35) {
        return {
            priority: 'P4',
            message: '🟡 步速偏慢，留意衰弱風險',
            reportMessage: '步速低於一般標準，建議持續追蹤並加強下肢肌力訓練。',
            alertLevel: 'attention',
            color: 'text-yellow-500',
            borderColor: 'ring-yellow-400/60',
            icon: '🟡',
            canGenerateReport: true,
            aiSuggestions: [
                '建議每日進行 10~15 分鐘步行訓練，逐步增加速度',
                '建議加入下肢肌力訓練（如坐姿抬腿、扶牆深蹲）',
                '建議 4 週後再次評估以追蹤改善趨勢',
            ],
        }
    }

    // P5 vs P6
    if (features.gaitSpeedRelative > 0.5 && symmetryIndex > 0.9 && balance && balance.balanceScore > 80) {
        return {
            priority: 'P6',
            message: '🔵 步態表現優良！',
            reportMessage: '步態品質優良，各指標均顯示良好的行走功能與平衡能力。',
            alertLevel: 'normal',
            color: 'text-blue-400',
            borderColor: 'ring-blue-500/60',
            icon: '🔵',
            canGenerateReport: true,
            aiSuggestions: [
                '目前步態表現良好，請持續維持規律運動習慣',
                '建議每 3~6 個月定期追蹤步態變化',
            ],
        }
    }

    // P5: 步態正常
    return {
        priority: 'P5',
        message: '🟢 步態正常',
        reportMessage: '各項步態指標均在正常範圍內，請持續維持活動量。',
        alertLevel: 'normal',
        color: 'text-green-400',
        borderColor: 'ring-green-400/70',
        icon: '🟢',
        canGenerateReport: true,
        aiSuggestions: [
            '步態表現正常，請繼續維持每日活動量',
            '建議持續觀察，每 1~3 個月追蹤一次',
        ],
    }
}
