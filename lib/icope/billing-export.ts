/**
 * ICOPE 報帳計費邏輯 — 獨立 TypeScript 函式
 * 依台灣 ICOPE 標準預估申報金額
 */

// ============================================================================
// 型別
// ============================================================================

export interface BillingRawRow {
    id: string
    patient_id: string
    stage: string
    assessed_at: string
    follow_up_completed: boolean
    post_test_completed: boolean
    patients: {
        name: string
        id_number: string
        gender: string
        birth_date: string
    } | null
    primary_assessments: {
        cognition: boolean
        mobility: boolean
        nutrition: boolean
        vision: boolean
        hearing: boolean
        depression: boolean
    } | null
    secondary_assessments: {
        ad8_score: number | null
        bht_score: number | null
        sppb_score: number | null
        mna_sf_score: number | null
        gds15_score: number | null
        medication_result: string | null
        social_care_result: string | null
    } | null
}

export interface BillingFlatRow {
    身分證字號: string
    姓名: string
    性別: string
    出生日期: string
    初評日期: string
    初評結果: string
    異常項目: string
    複評完成項數: number
    追蹤狀態: string
    後測狀態: string
    初評費用: number
    複評費用: number
    追蹤費用: number
    預估申報總額: number
}

// ============================================================================
// 計費常數
// ============================================================================

/** 初評基本費 */
const BASE_FEE = 100

/** 複評項數級距費用 */
const SECONDARY_FEE_TIERS: Record<number, number> = {
    0: 0,
    1: 100,
    2: 150,
    3: 190,
    4: 220,
}

/** 追蹤完成費用 */
const FOLLOW_UP_FEE = 50

// ============================================================================
// 函式
// ============================================================================

/**
 * 計算複評完成的項數
 */
function countCompletedSecondary(secondary: BillingRawRow['secondary_assessments']): number {
    if (!secondary) return 0
    let count = 0
    if (secondary.ad8_score !== null) count++
    if (secondary.sppb_score !== null) count++
    if (secondary.mna_sf_score !== null) count++
    if (secondary.gds15_score !== null) count++
    return count
}

/**
 * 計算初評異常面向
 */
function getAbnormalDomains(primary: BillingRawRow['primary_assessments']): string[] {
    if (!primary) return []
    const labels: Record<string, string> = {
        cognition: '認知',
        mobility: '行動',
        nutrition: '營養',
        vision: '視力',
        hearing: '聽力',
        depression: '憂鬱',
    }
    return Object.entries(labels)
        .filter(([key]) => (primary as any)[key] === true)
        .map(([, label]) => label)
}

/**
 * 計算複評費用（依項數級距）
 */
function calculateSecondaryFee(completedCount: number): number {
    if (completedCount >= 4) return SECONDARY_FEE_TIERS[4]
    return SECONDARY_FEE_TIERS[completedCount] || 0
}

/**
 * 將巢狀 Supabase 資料扁平化為報帳單行
 */
export function processExportData(rows: BillingRawRow[]): BillingFlatRow[] {
    return rows.map(row => {
        const abnormalDomains = getAbnormalDomains(row.primary_assessments)
        const isAbnormal = abnormalDomains.length > 0
        const completedSecondary = countCompletedSecondary(row.secondary_assessments)
        const secondaryFee = calculateSecondaryFee(completedSecondary)
        const followUpFee = row.follow_up_completed ? FOLLOW_UP_FEE : 0

        return {
            身分證字號: row.patients?.id_number || '',
            姓名: row.patients?.name || '',
            性別: row.patients?.gender === 'male' ? '男' : row.patients?.gender === 'female' ? '女' : '',
            出生日期: row.patients?.birth_date || '',
            初評日期: new Date(row.assessed_at).toLocaleDateString('zh-TW'),
            初評結果: isAbnormal ? '異常' : '正常',
            異常項目: abnormalDomains.join('、') || '無',
            複評完成項數: completedSecondary,
            追蹤狀態: row.follow_up_completed ? '已完成' : '未完成',
            後測狀態: row.post_test_completed ? '已完成' : '未完成',
            初評費用: BASE_FEE,
            複評費用: secondaryFee,
            追蹤費用: followUpFee,
            預估申報總額: BASE_FEE + secondaryFee + followUpFee,
        }
    })
}

/**
 * 陣列轉 CSV 字串（含 BOM 支援中文 Excel）
 */
export function arrayToCsv(data: BillingFlatRow[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const bom = '\uFEFF'
    const headerLine = headers.join(',')
    const bodyLines = data.map(row =>
        headers.map(h => {
            const val = String((row as any)[h] ?? '')
            // 包含逗號或換行的欄位需引號包裹
            return val.includes(',') || val.includes('\n') ? `"${val}"` : val
        }).join(',')
    )

    return bom + [headerLine, ...bodyLines].join('\n')
}

/**
 * 產生帶時間戳的檔名
 */
export function generateFilename(): string {
    const now = new Date()
    const stamp = now.toISOString().slice(0, 10).replace(/-/g, '')
    return `ICOPE_Billing_Export_${stamp}.csv`
}
