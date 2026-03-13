/**
 * ICOPE 前後測系統 — 完整 TypeScript 型別定義
 * 對應 Supabase PostgreSQL Schema，嚴格型別規範
 */

// ============================================================================
// Enums
// ============================================================================

/** 評估階段（對應 DB enum: assessment_stage） */
export type AssessmentStage = 'initial' | 'post'

/** 性別（對應 DB enum: gender_type） */
export type Gender = 'male' | 'female'

/** 評估階段中文標籤 */
export const STAGE_LABELS: Record<AssessmentStage, string> = {
    initial: '初評',
    post: '後測',
}

/** 性別中文標籤 */
export const GENDER_LABELS: Record<Gender, string> = {
    male: '男',
    female: '女',
}

// ============================================================================
// 長者基本資料 (patients)
// ============================================================================

/** 長者基本資料 — 對應 patients 表 */
export interface Patient {
    /** UUID 主鍵 */
    id: string
    /** 負責指導員（醫事人員）ID */
    instructor_id: string
    /** 身分證字號（唯一） */
    id_number: string
    /** 姓名 */
    name: string
    /** 性別 */
    gender: Gender
    /** 出生日期 (YYYY-MM-DD) */
    birth_date: string
    /** 手機號碼 */
    phone: string | null
    /** 慢性疾病史 */
    chronic_diseases: string[]
    /** 備註 */
    notes: string | null
    /** 建立時間 (ISO 8601) */
    created_at: string
    /** 更新時間 (ISO 8601) */
    updated_at: string
}

/** 新增長者表單資料 */
export interface PatientInsert {
    instructor_id: string
    id_number: string
    name: string
    gender: Gender
    birth_date: string
    phone?: string
    chronic_diseases?: string[]
    notes?: string
}

// ============================================================================
// 評估紀錄主表 (assessments)
// ============================================================================

/** 評估紀錄 — 對應 assessments 表 */
export interface Assessment {
    /** UUID 主鍵 */
    id: string
    /** 關聯長者 ID */
    patient_id: string
    /** 負責醫事人員 ID */
    instructor_id: string
    /** 評估階段 */
    stage: AssessmentStage
    /** 評估日期 (ISO 8601) */
    assessed_at: string
    /** 備註 */
    notes: string | null
    /** 建立時間 */
    created_at: string
    /** 更新時間 */
    updated_at: string
}

/** 評估紀錄（含所有關聯資料） */
export interface AssessmentWithDetails extends Assessment {
    /** 關聯長者資料 */
    patients?: Pick<Patient, 'name' | 'id_number' | 'gender' | 'birth_date'> | null
    /** 初評詳情 */
    primary_assessments?: PrimaryAssessment | null
    /** 複評詳情 */
    secondary_assessments?: SecondaryAssessment | null
}

/** 新增評估表單資料 */
export interface AssessmentInsert {
    patient_id: string
    instructor_id: string
    stage: AssessmentStage
    assessed_at?: string
    notes?: string
}

// ============================================================================
// 初評 (primary_assessments) — 6 大面向
// ============================================================================

/** 初評 — 6 大面向異常判定，對應 primary_assessments 表 */
export interface PrimaryAssessment {
    /** UUID 主鍵 */
    id: string
    /** 關聯評估 ID */
    assessment_id: string
    /** 認知功能是否異常 */
    cognition: boolean
    /** 行動能力是否異常 */
    mobility: boolean
    /** 營養狀態是否異常 */
    nutrition: boolean
    /** 視力是否異常 */
    vision: boolean
    /** 聽力是否異常 */
    hearing: boolean
    /** 是否有憂鬱傾向 */
    depression: boolean
    /** 建立時間 */
    created_at: string
}

/** 初評新增資料 */
export interface PrimaryAssessmentInsert {
    assessment_id: string
    cognition: boolean
    mobility: boolean
    nutrition: boolean
    vision: boolean
    hearing: boolean
    depression: boolean
}

/** 初評 6 大面向鍵名 */
export type PrimaryDomain = 'cognition' | 'mobility' | 'nutrition' | 'vision' | 'hearing' | 'depression'

/** 初評面向中文標籤 */
export const PRIMARY_DOMAIN_LABELS: Record<PrimaryDomain, string> = {
    cognition: '認知功能',
    mobility: '行動能力',
    nutrition: '營養狀態',
    vision: '視力',
    hearing: '聽力',
    depression: '憂鬱',
}

/** 初評面向圖示 */
export const PRIMARY_DOMAIN_ICONS: Record<PrimaryDomain, string> = {
    cognition: '🧠',
    mobility: '🦿',
    nutrition: '🍎',
    vision: '👁️',
    hearing: '👂',
    depression: '💭',
}

// ============================================================================
// 複評 (secondary_assessments) — 詳細評分
// ============================================================================

/** 複評 — 各項詳細評分，對應 secondary_assessments 表 */
export interface SecondaryAssessment {
    /** UUID 主鍵 */
    id: string
    /** 關聯評估 ID */
    assessment_id: string
    /** AD8 認知評估分數 (0-8，≥2 為異常) */
    ad8_score: number | null
    /** BHT 認知評估分數 */
    bht_score: number | null
    /** SPPB 行動評估分數 (0-12，≤8 為異常) */
    sppb_score: number | null
    /** MNA-SF 營養評估分數 (0-14，≤11 為異常) */
    mna_sf_score: number | null
    /** GDS-15 憂鬱評估分數 (0-15，≥5 為異常) */
    gds15_score: number | null
    /** 用藥評估結果 */
    medication_result: string | null
    /** 社會照護與支持評估結果 */
    social_care_result: string | null
    /** 建立時間 */
    created_at: string
}

/** 複評新增資料 */
export interface SecondaryAssessmentInsert {
    assessment_id: string
    ad8_score?: number | null
    bht_score?: number | null
    sppb_score?: number | null
    mna_sf_score?: number | null
    gds15_score?: number | null
    medication_result?: string
    social_care_result?: string
}

/** 複評欄位中文標籤 */
export const SECONDARY_FIELD_LABELS: Record<string, string> = {
    ad8_score: 'AD8 認知評估',
    bht_score: 'BHT 認知評估',
    sppb_score: 'SPPB 行動評估',
    mna_sf_score: 'MNA-SF 營養評估',
    gds15_score: 'GDS-15 憂鬱評估',
    medication_result: '用藥評估',
    social_care_result: '社會照護與支持評估',
}

/** 複評分數異常閾值 */
export const SECONDARY_THRESHOLDS: Record<string, { operator: '>=' | '<='; value: number; label: string }> = {
    ad8_score: { operator: '>=', value: 2, label: '≥ 2 分為異常' },
    sppb_score: { operator: '<=', value: 8, label: '≤ 8 分為異常' },
    mna_sf_score: { operator: '<=', value: 11, label: '≤ 11 分為異常' },
    gds15_score: { operator: '>=', value: 5, label: '≥ 5 分為異常' },
}

// ============================================================================
// 複合表單型別
// ============================================================================

/** 完整評估表單資料（供前端步驟表單使用） */
export interface AssessmentFormData {
    /** 選擇的長者 ID */
    patient_id: string
    /** 評估階段 */
    stage: AssessmentStage
    /** 備註 */
    notes: string
    /** 初評 6 大面向 */
    primary: PrimaryAssessmentInsert
    /** 複評詳細分數（僅填寫初評異常的項目） */
    secondary: SecondaryAssessmentInsert
}

// ============================================================================
// 初評 ↔ 複評面向映射（初評異常時觸發對應複評欄位）
// ============================================================================

/** 初評面向 → 對應的複評欄位 */
export const PRIMARY_TO_SECONDARY_MAP: Record<PrimaryDomain, (keyof SecondaryAssessmentInsert)[]> = {
    cognition: ['ad8_score', 'bht_score'],
    mobility: ['sppb_score'],
    nutrition: ['mna_sf_score'],
    vision: [],
    hearing: [],
    depression: ['gds15_score'],
}
