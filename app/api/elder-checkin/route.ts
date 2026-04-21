import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/elder-checkin
// Body: { elderId, eventId }
// Checks in an elder to an event (staff-assisted, no LINE required)
export async function POST(request: NextRequest) {
    try {
        const { elderId, eventId, checkinMethod, deviceInfo } = await request.json()

        if (!elderId || !eventId) {
            return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
        }

        // Verify elder exists
        const { data: elder, error: elderError } = await supabaseAdmin
            .from('elders')
            .select('id, name')
            .eq('id', elderId)
            .single()

        if (elderError || !elder) {
            return NextResponse.json({ error: '找不到此長輩' }, { status: 404 })
        }

        // Verify event exists and is active
        const { data: event, error: eventError } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('id', eventId)
            .eq('is_active', true)
            .single()

        if (eventError || !event) {
            return NextResponse.json({ error: '找不到此活動或活動已停用' }, { status: 404 })
        }

        // Check in using elder ID as line_user_id (prefixed to avoid collision)
        const elderLineId = `elder_${elderId}`

        // 首先檢查是否已經簽到過
        const { data: existing, error: existingError } = await supabaseAdmin
            .from('event_checkins')
            .select('*')
            .eq('event_id', eventId)
            .eq('line_user_id', elderLineId)
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

        const { data: checkin, error: checkinError } = await supabaseAdmin
            .from('event_checkins')
            .insert({
                event_id: eventId,
                line_user_id: elderLineId,
                display_name: `${elder.name}（代簽）`,
                picture_url: null,
                checkin_method: checkinMethod || 'qr_proxy',
                device_info: deviceInfo || null,
            })
            .select()
            .single()

        if (checkinError) {
            return NextResponse.json({ error: '簽到失敗：' + checkinError.message }, { status: 500 })
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
        return NextResponse.json({ error: err.message || '伺服器錯誤' }, { status: 500 })
    }
}
