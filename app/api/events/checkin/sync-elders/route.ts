import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/events/checkin/sync-elders
// 將現有的 LINE 簽到紀錄同步建入長輩管理
export async function POST(request: Request) {
    try {
        // 取得當前登入用戶作為 instructor_id
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: '請先登入' }, { status: 401 })
        }
        const instructorId = user.id

        // 1. 取得所有非 elder_ 開頭的 LINE 簽到（真實 LINE 用戶）
        const { data: checkins } = await supabaseAdmin
            .from('event_checkins')
            .select('line_user_id, display_name, picture_url')
            .not('line_user_id', 'like', 'elder_%')
            .order('checked_in_at', { ascending: true })

        if (!checkins || checkins.length === 0) {
            return NextResponse.json({ success: true, synced: 0, message: '沒有需要同步的簽到記錄' })
        }

        // 2. 去重（同一個 LINE user 可能簽到多次）
        const uniqueUsers = new Map<string, { displayName: string; pictureUrl: string | null }>()
        for (const c of checkins) {
            if (!uniqueUsers.has(c.line_user_id)) {
                uniqueUsers.set(c.line_user_id, {
                    displayName: c.display_name,
                    pictureUrl: c.picture_url,
                })
            }
        }

        // 3. 檢查哪些已經在 elders 中有對應的 line_user_id
        const lineUserIds = Array.from(uniqueUsers.keys())
        const { data: existingElders } = await supabaseAdmin
            .from('elders')
            .select('line_user_id')
            .in('line_user_id', lineUserIds)

        const existingSet = new Set((existingElders || []).map(e => e.line_user_id))

        // 4. 批次建立新的長輩記錄（使用當前登入用戶的 instructor_id）
        const newElders: any[] = []
        for (const [lineUserId, info] of uniqueUsers) {
            if (!existingSet.has(lineUserId)) {
                newElders.push({
                    instructor_id: instructorId,
                    name: info.displayName.replace('（代簽）', ''),
                    line_user_id: lineUserId,
                    gender: null,
                    birth_date: null,
                    notes: `由 LINE 簽到自動建檔`,
                    line_picture_url: info.pictureUrl,
                })
            }
        }

        // 也修復之前同步時用了錯誤 instructor_id 的記錄
        const { data: wrongOwner } = await supabaseAdmin
            .from('elders')
            .select('id')
            .in('line_user_id', lineUserIds)
            .neq('instructor_id', instructorId)

        let fixed = 0
        if (wrongOwner && wrongOwner.length > 0) {
            const { error: updateErr } = await supabaseAdmin
                .from('elders')
                .update({ instructor_id: instructorId })
                .in('id', wrongOwner.map(e => e.id))
            if (!updateErr) fixed = wrongOwner.length
        }

        if (newElders.length === 0 && fixed === 0) {
            return NextResponse.json({ success: true, synced: 0, message: '所有簽到用戶已同步' })
        }

        if (newElders.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('elders')
                .insert(newElders)

            if (insertError) {
                return NextResponse.json({ error: '同步失敗: ' + insertError.message }, { status: 500 })
            }
        }

        const parts: string[] = []
        if (newElders.length > 0) parts.push(`新增 ${newElders.length} 位`)
        if (fixed > 0) parts.push(`修復 ${fixed} 位`)

        return NextResponse.json({
            success: true,
            synced: newElders.length + fixed,
            total: uniqueUsers.size,
            message: `已${parts.join('、')}長輩到長輩管理`,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '伺服器錯誤' }, { status: 500 })
    }
}
