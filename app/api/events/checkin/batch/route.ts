import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface OfflineCheckin {
    elderId: string
    timestamp: string // ISO string
    deviceInfo?: string
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventId, checkins, deviceInfo: globalDeviceInfo } = body as { eventId: string, checkins: OfflineCheckin[], deviceInfo?: string }

        if (!eventId || !Array.isArray(checkins) || checkins.length === 0) {
            return NextResponse.json(
                { error: '無效的請求資料' },
                { status: 400 }
            )
        }

        const elderIds = Array.from(new Set(checkins.map(c => c.elderId)))

        // Fetch elders' names
        const { data: elders, error: eldersError } = await supabaseAdmin
            .from('elders')
            .select('id, name')
            .in('id', elderIds)

        if (eldersError) {
            return NextResponse.json({ error: '無法取得長輩資訊: ' + eldersError.message }, { status: 500 })
        }

        const elderMap = new Map(elders?.map(e => [e.id, e.name]))

        // Check which ones are already checked in
        const { data: existingCheckins, error: existingError } = await supabaseAdmin
            .from('event_checkins')
            .select('line_user_id')
            .eq('event_id', eventId)
            .in('line_user_id', elderIds.map(id => `elder_${id}`))
        
        const existingSet = new Set(existingCheckins?.map(c => c.line_user_id) || [])

        const recordsToInsert = []

        for (const checkin of checkins) {
            const lineUserId = `elder_${checkin.elderId}`
            // Prevent duplication
            if (existingSet.has(lineUserId)) continue
            
            // Mark as checked to prevent duplicates within the same batch payload
            existingSet.add(lineUserId)

            const name = elderMap.get(checkin.elderId) || '長輩'
            recordsToInsert.push({
                event_id: eventId,
                line_user_id: lineUserId,
                display_name: `${name}（離線補登）`,
                checked_in_at: checkin.timestamp,
                picture_url: null,
                checkin_method: 'offline',
                device_info: checkin.deviceInfo || globalDeviceInfo || null,
            })
        }

        let insertedCount = 0
        if (recordsToInsert.length > 0) {
            // Upsert or insert (using insert is fine since we already filtered out duplicates)
            const { error: insertError } = await supabaseAdmin
                .from('event_checkins')
                .insert(recordsToInsert)
            
            if (insertError) {
                return NextResponse.json({ error: '寫入失敗: ' + insertError.message }, { status: 500 })
            }
            insertedCount = recordsToInsert.length
        }

        return NextResponse.json({
            success: true,
            synced: insertedCount,
            skipped: checkins.length - insertedCount
        })

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || '伺服器錯誤' },
            { status: 500 }
        )
    }
}
