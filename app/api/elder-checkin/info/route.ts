import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/elder-checkin/info?elderId=xxx
// Returns elder info + active events for the elder check-in page
export async function GET(request: NextRequest) {
    try {
        const elderId = request.nextUrl.searchParams.get('elderId')
        if (!elderId) {
            return NextResponse.json({ error: '缺少長輩 ID' }, { status: 400 })
        }

        // Get elder info
        const { data: elder, error: elderError } = await supabaseAdmin
            .from('elders')
            .select('id, name, gender')
            .eq('id', elderId)
            .single()

        if (elderError || !elder) {
            return NextResponse.json({ error: '找不到此長輩' }, { status: 404 })
        }

        // Get active events
        const { data: events } = await supabaseAdmin
            .from('events')
            .select('id, title, event_date, event_time, location')
            .eq('is_active', true)
            .order('event_date', { ascending: false })

        return NextResponse.json({
            elder,
            events: events || [],
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '伺服器錯誤' }, { status: 500 })
    }
}
