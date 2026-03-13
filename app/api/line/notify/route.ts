/**
 * LINE 推播通知 API Route
 * 查詢到期的追蹤/後測，對指導員推播 LINE 提醒
 * 可由 Vercel Cron 每天定時呼叫
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReminderCard } from '@/lib/line-notify'

// 使用 Service Role Key（繞過 RLS，只在 server 端）
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const LIFF_URL = process.env.NEXT_PUBLIC_LIFF_ID
    ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`
    : undefined

export async function GET(request: Request) {
    // 安全驗證：Vercel Cron 或管理員 API Key
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: '未授權' }, { status: 401 })
    }

    const now = new Date()
    const results: { type: string; patient: string; instructor: string; success: boolean; error?: string }[] = []

    try {
        // 查詢所有完成初評的 assessments（含 patient 與 instructor 資訊）
        const { data: assessments, error: queryErr } = await supabase
            .from('assessments')
            .select(`
        id,
        stage,
        created_at,
        patient_id,
        instructor_id,
        patients:patient_id (name),
        profiles:instructor_id (line_user_id, full_name)
      `)
            .eq('stage', 'initial')

        if (queryErr) {
            return NextResponse.json({ error: queryErr.message }, { status: 500 })
        }

        if (!assessments || assessments.length === 0) {
            return NextResponse.json({ message: '無評估資料', sent: 0 })
        }

        for (const assessment of assessments) {
            const createdAt = new Date(assessment.created_at)
            const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

            // 取得指導員的 LINE User ID
            const profile = assessment.profiles as unknown as { line_user_id: string | null; full_name: string } | null
            const patient = assessment.patients as unknown as { name: string } | null

            if (!profile?.line_user_id || !patient?.name) continue

            const lineUserId = profile.line_user_id
            const patientName = patient.name

            // 追蹤提醒：初評 28-32 天時提醒（約 1 個月）
            if (daysSince >= 28 && daysSince <= 32) {
                const dueDate = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString().slice(0, 10)

                const result = await sendReminderCard(lineUserId, {
                    patientName,
                    reminderType: '追蹤',
                    dueDate,
                    assessmentId: assessment.id,
                    liffUrl: LIFF_URL ? `${LIFF_URL}/icope` : undefined,
                })

                results.push({
                    type: '追蹤',
                    patient: patientName,
                    instructor: profile.full_name,
                    success: result.success,
                    error: result.error,
                })
            }

            // 後測提醒：初評 88-92 天時提醒（約 3 個月）
            if (daysSince >= 88 && daysSince <= 92) {
                const dueDate = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000)
                    .toISOString().slice(0, 10)

                const result = await sendReminderCard(lineUserId, {
                    patientName,
                    reminderType: '後測',
                    dueDate,
                    assessmentId: assessment.id,
                    liffUrl: LIFF_URL ? `${LIFF_URL}/icope` : undefined,
                })

                results.push({
                    type: '後測',
                    patient: patientName,
                    instructor: profile.full_name,
                    success: result.success,
                    error: result.error,
                })
            }

            // 後測緊急提醒：初評 170-180 天時提醒（即將超過 6 個月）
            if (daysSince >= 170 && daysSince <= 180) {
                const result = await sendReminderCard(lineUserId, {
                    patientName,
                    reminderType: '後測',
                    dueDate: '⚠️ 即將逾期',
                    assessmentId: assessment.id,
                    liffUrl: LIFF_URL ? `${LIFF_URL}/icope` : undefined,
                })

                results.push({
                    type: '後測(緊急)',
                    patient: patientName,
                    instructor: profile.full_name,
                    success: result.success,
                    error: result.error,
                })
            }
        }

        return NextResponse.json({
            message: `推播完成`,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            details: results,
        })

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '未知錯誤'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
