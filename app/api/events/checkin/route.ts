import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 Service Role Key 避開 RLS 限制
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventId, lineUserId, displayName, pictureUrl, checkinMethod, deviceInfo } = body

        // 驗證必要欄位
        if (!eventId || !lineUserId || !displayName) {
            return NextResponse.json(
                { error: '缺少必要欄位 (eventId, lineUserId, displayName)' },
                { status: 400 }
            )
        }

        // 檢查活動是否存在且啟用中
        const { data: event, error: eventError } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .eq('is_active', true)
            .single()

        if (eventError || !event) {
            return NextResponse.json(
                { error: '找不到此活動或活動已停用' },
                { status: 404 }
            )
        }

        // 首先檢查是否已經簽到過
        const { data: existing, error: existingError } = await supabaseAdmin
            .from('event_checkins')
            .select('*')
            .eq('event_id', eventId)
            .eq('line_user_id', lineUserId)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({
                success: true,
                alreadyCheckedIn: true,
                checkin: existing,
                event: {
                    title: event.title,
                    event_date: event.event_date,
                    event_time: event.event_time,
                    location: event.location,
                },
            })
        }

        // 寫入簽到紀錄
        const { data: checkin, error: checkinError } = await supabaseAdmin
            .from('event_checkins')
            .insert({
                event_id: eventId,
                line_user_id: lineUserId,
                display_name: displayName,
                picture_url: pictureUrl || null,
                checkin_method: checkinMethod || 'line',
                device_info: deviceInfo || null,
            })
            .select()
            .single()

        if (checkinError) {
            return NextResponse.json(
                { error: '簽到失敗：' + checkinError.message },
                { status: 500 }
            )
        }

        // ✅ 自動同步：LINE 本人簽到時，自動建檔到長輩管理
        if (!lineUserId.startsWith('elder_')) {
            const { data: elderExists } = await supabaseAdmin
                .from('elders')
                .select('id')
                .eq('line_user_id', lineUserId)
                .maybeSingle()

            if (!elderExists) {
                await supabaseAdmin.from('elders').insert({
                    instructor_id: event.created_by,
                    name: displayName,
                    line_user_id: lineUserId,
                    gender: null,
                    birth_date: null,
                    notes: '由 LINE 簽到自動建檔',
                }).select().maybeSingle() // 忽略錯誤，不影響簽到
            }
        }

        return NextResponse.json({
            success: true,
            alreadyCheckedIn: false,
            checkin,
            event: {
                title: event.title,
                event_date: event.event_date,
                event_time: event.event_time,
                location: event.location,
            },
        })
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || '伺服器錯誤' },
            { status: 500 }
        )
    }
}
