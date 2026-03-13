'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'
import {
    processExportData,
    arrayToCsv,
    generateFilename,
    type BillingRawRow,
} from '@/lib/icope/billing-export'

// ============================================================================
// Props
// ============================================================================

interface BillingExportButtonProps {
    /** 按鈕樣式變體 */
    variant?: 'primary' | 'compact'
    /** 額外 CSS class */
    className?: string
}

// ============================================================================
// Component
// ============================================================================

export default function BillingExportButton({
    variant = 'primary',
    className = '',
}: BillingExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    /**
     * Step 1：Supabase 跨表查詢
     */
    const fetchBillingData = async (): Promise<BillingRawRow[]> => {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('assessments')
            .select(`
        id,
        patient_id,
        stage,
        assessed_at,
        follow_up_completed,
        post_test_completed,
        patients(name, id_number, gender, birth_date),
        primary_assessments(cognition, mobility, nutrition, vision, hearing, depression),
        secondary_assessments(ad8_score, bht_score, sppb_score, mna_sf_score, gds15_score, medication_result, social_care_result)
      `)
            .eq('stage', 'initial')
            .order('assessed_at', { ascending: true })

        if (error) throw new Error(error.message)
        return (data as unknown as BillingRawRow[]) || []
    }

    /**
     * Step 2：觸發下載
     */
    const triggerDownload = (csvContent: string, filename: string) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    /**
     * 主流程
     */
    const handleExport = async () => {
        setIsExporting(true)

        try {
            // 1. 查詢資料
            const rawData = await fetchBillingData()

            if (rawData.length === 0) {
                toast.error('無評估紀錄可匯出')
                return
            }

            // 2. 扁平化 + 計費
            const flatData = processExportData(rawData)

            // 3. 轉 CSV
            const csv = arrayToCsv(flatData)
            const filename = generateFilename()

            // 4. 下載
            triggerDownload(csv, filename)

            // 5. 計算匯總資訊
            const totalAmount = flatData.reduce((sum, r) => sum + r.預估申報總額, 0)
            toast.success(`匯出成功！共 ${flatData.length} 筆，預估總額 NT$${totalAmount.toLocaleString()}`)

            logActivity(
                '匯出 ICOPE 報帳資料',
                `筆數: ${flatData.length}，預估總額: NT$${totalAmount.toLocaleString()}`,
                'export'
            )

        } catch (err: any) {
            toast.error('匯出失敗: ' + (err.message || '未知錯誤'))
        } finally {
            setIsExporting(false)
        }
    }

    // ============================================================================
    // Render
    // ============================================================================

    if (variant === 'compact') {
        return (
            <button
                onClick={handleExport}
                disabled={isExporting}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 ${className}`}
            >
                {isExporting ? (
                    <>
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        匯出中...
                    </>
                ) : (
                    <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        匯出報帳
                    </>
                )}
            </button>
        )
    }

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={`inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 ${className}`}
        >
            {isExporting ? (
                <>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>匯出中，請稍候...</span>
                </>
            ) : (
                <>
                    {/* Excel / Download Icon */}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                        <p className="font-bold">匯出報帳資料</p>
                        <p className="text-[10px] opacity-60 -mt-0.5">CSV 格式（Excel 相容）</p>
                    </div>
                </>
            )}
        </button>
    )
}
