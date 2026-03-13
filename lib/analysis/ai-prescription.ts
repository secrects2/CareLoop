/**
 * AI 處方引擎 — 地板滾球分析報告
 * 根據分析數據產生個人化的運動建議處方
 */

// ============================================================================
// 型別
// ============================================================================

export interface AnalysisMetrics {
    elbow_rom: number
    trunk_stability: number
    avg_velocity: number
    max_rom: number | null
    min_rom: number | null
    avg_rom: number
    avg_trunk_tilt: number
    throw_count: number
    stable_ratio: number
    core_stability_angle: number | null
    avg_shoulder_angular_vel: number | null
    avg_elbow_angular_vel: number | null
    avg_wrist_angular_vel: number | null
    tremor_detected_ratio: number
    tremor_avg_frequency: number | null
    compensation_detected_ratio: number
    compensation_types: string[]
    posture_correction_avg: number
    manual_throw_count: number
}

export interface PrescriptionItem {
    category: string
    icon: string
    title: string
    description: string
    exercises: string[]
    frequency: string
    priority: 'high' | 'medium' | 'low'
}

export interface OverallAssessment {
    level: '優秀' | '良好' | '待改善' | '需加強'
    score: number
    color: string
    summary: string
}

export interface AiReport {
    overall: OverallAssessment
    strengths: string[]
    concerns: string[]
    prescriptions: PrescriptionItem[]
    safetyNotes: string[]
}

// ============================================================================
// 評估邏輯
// ============================================================================

function assessOverall(m: AnalysisMetrics): OverallAssessment {
    let score = 0

    // ROM 評分 (0-30)
    if (m.avg_rom >= 160) score += 30
    else if (m.avg_rom >= 140) score += 22
    else if (m.avg_rom >= 120) score += 15
    else score += 8

    // 軀幹穩定度 (0-25)
    if (m.avg_trunk_tilt <= 8) score += 25
    else if (m.avg_trunk_tilt <= 15) score += 18
    else if (m.avg_trunk_tilt <= 25) score += 10
    else score += 3

    // 穩定比例 (0-20)
    score += Math.round(m.stable_ratio * 0.2)

    // 震顫 & 代償扣分 (0-25)
    const penaltyBase = 25
    const tremorPenalty = Math.min(m.tremor_detected_ratio * 0.2, 10)
    const compPenalty = Math.min(m.compensation_detected_ratio * 0.15, 10)
    score += Math.max(penaltyBase - tremorPenalty - compPenalty, 0)

    if (score >= 85) return { level: '優秀', score, color: '#10B981', summary: '整體表現優異，關節活動度與軀幹穩定度均達理想水準。' }
    if (score >= 65) return { level: '良好', score, color: '#3B82F6', summary: '表現良好，部分指標可再強化，建議針對性訓練。' }
    if (score >= 45) return { level: '待改善', score, color: '#F59E0B', summary: '有多項指標需要改善，建議增加訓練頻率並注意動作品質。' }
    return { level: '需加強', score, color: '#EF4444', summary: '各項指標偏低，建議從基礎動作開始訓練，並在指導員協助下進行。' }
}

function findStrengths(m: AnalysisMetrics): string[] {
    const s: string[] = []
    if (m.avg_rom >= 150) s.push('手肘伸展度良好（ROM ≥ 150°），上肢活動範圍充足')
    if (m.avg_trunk_tilt <= 10) s.push('軀幹穩定度佳（傾斜 ≤ 10°），核心控制能力好')
    if (m.stable_ratio >= 70) s.push(`穩定投擲比例高（${m.stable_ratio}%），動作一致性良好`)
    if (m.tremor_detected_ratio <= 5) s.push('未偵測到明顯震顫，手部控制穩定')
    if (m.compensation_detected_ratio <= 10) s.push('代償動作少，動作模式正確')
    if (m.throw_count >= 5) s.push(`完成 ${m.throw_count} 次投擲，訓練量充足`)
    if (s.length === 0) s.push('持續進行訓練，表現將逐步提升')
    return s
}

function findConcerns(m: AnalysisMetrics): string[] {
    const c: string[] = []
    if (m.avg_rom < 120) c.push(`手肘伸展度不足（ROM ${m.avg_rom}° < 120°），上肢關節活動受限`)
    else if (m.avg_rom < 140) c.push(`手肘伸展度偏低（ROM ${m.avg_rom}°），建議加強上肢伸展`)
    if (m.avg_trunk_tilt > 20) c.push(`軀幹傾斜過大（${m.avg_trunk_tilt}° > 20°），核心穩定性不足`)
    else if (m.avg_trunk_tilt > 12) c.push(`軀幹略有傾斜（${m.avg_trunk_tilt}°），可強化核心訓練`)
    if (m.tremor_detected_ratio > 15) c.push(`震顫偵測率偏高（${m.tremor_detected_ratio}%），手部穩定性需注意`)
    if (m.compensation_detected_ratio > 25) c.push(`代償動作頻率高（${m.compensation_detected_ratio}%），建議矯正動作模式`)
    if (m.stable_ratio < 40) c.push(`穩定投擲比例偏低（${m.stable_ratio}%），動作一致性需提升`)
    return c
}

function generatePrescriptions(m: AnalysisMetrics): PrescriptionItem[] {
    const rx: PrescriptionItem[] = []

    // ROM 不足 → 上肢伸展處方
    if (m.avg_rom < 150) {
        rx.push({
            category: '關節活動度',
            icon: '💪',
            title: '上肢關節伸展訓練',
            description: `目前平均 ROM ${m.avg_rom}°，目標提升至 150° 以上`,
            exercises: [
                '坐姿手臂前伸：雙手向前伸直，維持 5 秒，重複 10 次',
                '坐姿過頭伸展：雙手高舉過頭，慢慢向後延伸',
                '毛巾拉伸：一手握毛巾兩端，輔助對側手肘伸展',
                '桌面滑動：手放桌上前推至最遠點，維持 10 秒',
            ],
            frequency: '每日 2 組，每組 10 次',
            priority: m.avg_rom < 120 ? 'high' : 'medium',
        })
    }

    // 軀幹不穩 → 核心訓練
    if (m.avg_trunk_tilt > 12) {
        rx.push({
            category: '核心穩定',
            icon: '🧘',
            title: '核心穩定度訓練',
            description: `軀幹傾斜角度 ${m.avg_trunk_tilt}°，目標控制在 10° 以內`,
            exercises: [
                '坐姿骨盆旋轉：坐穩椅子，左右旋轉骨盆各 10 次',
                '坐姿側彎回正：身體向一側傾斜後靠核心回正',
                '坐姿抬腳：交替抬起單腳離地 5 公分，維持 5 秒',
                '靠牆坐姿挺背：背靠牆壁坐，練習挺直脊椎',
            ],
            frequency: '每日 1-2 組，每組 8-10 次',
            priority: m.avg_trunk_tilt > 20 ? 'high' : 'medium',
        })
    }

    // 震顫 → 手部穩定訓練
    if (m.tremor_detected_ratio > 10) {
        rx.push({
            category: '手部控制',
            icon: '✋',
            title: '手部穩定與精細控制訓練',
            description: `震顫偵測率 ${m.tremor_detected_ratio}%，需加強手部穩定性`,
            exercises: [
                '握球訓練：握軟球 5 秒 → 放鬆 3 秒，重複 15 次',
                '指尖觸碰：食指逐一觸碰拇指，正反各做 3 輪',
                '杯子穩持：端一杯水走直線，練習手臂穩定',
                '橡皮筋伸展：手指撐開橡皮筋，重複 20 次',
            ],
            frequency: '每日 2 組',
            priority: m.tremor_detected_ratio > 25 ? 'high' : 'medium',
        })
    }

    // 代償 → 姿勢矯正
    if (m.compensation_detected_ratio > 15) {
        rx.push({
            category: '動作矯正',
            icon: '🎯',
            title: '投擲姿勢矯正訓練',
            description: `代償動作佔比 ${m.compensation_detected_ratio}%，需矯正不正確的動作模式`,
            exercises: [
                '鏡前投擲練習：面對鏡子做投擲動作，自我觀察姿勢',
                '慢動作投擲：將投擲動作放慢 3 倍速度執行',
                '單手穩定推球：坐穩後僅用手臂推球，限制身體前傾',
                '目標投擲：在地上標記目標點，練習準確度',
            ],
            frequency: '每次訓練前做 5 次慢速練習',
            priority: m.compensation_detected_ratio > 30 ? 'high' : 'medium',
        })
    }

    // 通用建議
    rx.push({
        category: '持續訓練',
        icon: '📈',
        title: '投擲技巧提升',
        description: '維持規律訓練，逐步提升動作品質與一致性',
        exercises: [
            '每次訓練前做 5 分鐘上肢暖身操',
            '練習不同距離的投擲（近→中→遠）',
            '與同伴進行模擬比賽，增加實戰經驗',
            '訓練後做 3 分鐘上肢拉伸放鬆',
        ],
        frequency: '每週 2-3 次，每次 20-30 分鐘',
        priority: 'low',
    })

    return rx
}

function generateSafetyNotes(m: AnalysisMetrics): string[] {
    const notes: string[] = [
        '所有運動建議僅供參考，請在專業指導員監護下進行訓練',
    ]
    if (m.tremor_detected_ratio > 20) notes.push('偵測到較高頻率的手部震顫，建議就醫評估是否有潛在神經肌肉問題')
    if (m.avg_trunk_tilt > 25) notes.push('軀幹傾斜角度較大，訓練時請確保座椅穩固，必要時使用安全帶')
    if (m.compensation_detected_ratio > 40) notes.push('代償動作頻繁，可能因肌力不足或疼痛導致，建議先評估身體狀況')
    notes.push('訓練中如有不適請立即停止，並向指導員報告')
    return notes
}

// ============================================================================
// 主函式
// ============================================================================

export function generateAiReport(metrics: AnalysisMetrics): AiReport {
    return {
        overall: assessOverall(metrics),
        strengths: findStrengths(metrics),
        concerns: findConcerns(metrics),
        prescriptions: generatePrescriptions(metrics),
        safetyNotes: generateSafetyNotes(metrics),
    }
}
