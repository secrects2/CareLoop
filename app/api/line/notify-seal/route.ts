import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSealApplicationCard, sendSealStatusCard } from '@/lib/line-notify'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
    try {
        const payload = await req.json()
        const { action } = payload

        const LIFF_URL = process.env.NEXT_PUBLIC_LIFF_ID
            ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?redirect=/seal-application`
            : undefined

        // ======== 員工申請，通知所有子管理員 ========
        if (action === 'submitted') {
            const { applicantName, department, sealType, borrowDate, purpose, applicantId } = payload

            // 找出所有 sub_admin
            const { data: subAdmins, error } = await supabaseAdmin
                .from('profiles')
                .select('line_user_id, id')
                .eq('role', 'sub_admin')
                // 排除沒綁定LINE的，且排除申請人自己
                .not('line_user_id', 'is', null)

            if (error) {
                return NextResponse.json({ error: '無法讀取子管理員資料', details: error.message }, { status: 500 })
            }

            if (!subAdmins || subAdmins.length === 0) {
                return NextResponse.json({ success: true, message: '沒有符合推播條件的主管' })
            }

            const pushPromises = subAdmins
                .filter(admin => admin.id !== applicantId && admin.line_user_id)
                .map(admin =>
                    sendSealApplicationCard(admin.line_user_id!, {
                        applicantName,
                        department,
                        sealType,
                        borrowDate,
                        purpose,
                        liffUrl: LIFF_URL
                    })
                )

            await Promise.allSettled(pushPromises)

            return NextResponse.json({ success: true, count: pushPromises.length })
        }

        // ======== 主管審核完畢，通知申請人 ========
        if (action === 'reviewed') {
            const { applicantId, sealType, borrowDate, status, comment } = payload

            // 找出該申請人的 LINE ID
            const { data: applicant, error } = await supabaseAdmin
                .from('profiles')
                .select('line_user_id')
                .eq('id', applicantId)
                .single()

            if (error || !applicant || !applicant.line_user_id) {
                return NextResponse.json({ success: true, message: '申請人未綁定LINE或找不到該筆資料' })
            }

            const result = await sendSealStatusCard(applicant.line_user_id, {
                sealType,
                borrowDate,
                status,
                comment,
                liffUrl: LIFF_URL
            })

            if (!result.success) {
                console.error('LINE推播失敗:', result.error)
            }

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: '未知的 action' }, { status: 400 })

    } catch (err: unknown) {
        console.error('notify-seal error:', err)
        return NextResponse.json(
            { error: '系統發生錯誤', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        )
    }
}
