import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { OfflineRecord } from '@/lib/offline-sync'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const records: OfflineRecord[] = body.records
        if (!records || !Array.isArray(records)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value },
                },
            }
        )

        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const results = {
            success: [] as string[],
            failed: [] as { id: string; error: string }[]
        }

        for (const record of records) {
            try {
                if (record.type === 'icope') {
                    // ICOPE 初評資料同步
                    const payload = record.payload
                    
                    const { data: assessment, error: assessmentErr } = await supabase
                        .from('assessments')
                        .insert({
                            patient_id: payload.patientId,
                            instructor_id: user.id,
                            stage: payload.stage,
                        })
                        .select('id')
                        .single()

                    if (assessmentErr || !assessment) throw new Error(assessmentErr?.message || '建立評估失敗')

                    const { error: primaryErr } = await supabase
                        .from('primary_assessments')
                        .insert({
                            assessment_id: assessment.id,
                            cognition: payload.results.cognition,
                            mobility: payload.results.mobility,
                            nutrition: payload.results.nutrition,
                            vision: payload.results.vision,
                            hearing: payload.results.hearing,
                            depression: payload.results.depression,
                            cognition_details: payload.cognition_details,
                            mobility_details: payload.mobility_details,
                            nutrition_details: payload.nutrition_details,
                            vision_details: payload.vision_details,
                            hearing_details: payload.hearing_details,
                            depression_details: payload.depression_details,
                        })

                    if (primaryErr) throw new Error(primaryErr.message || '儲存初評失敗')
                    
                    results.success.push(record.id)
                } 
                else if (record.type === 'checkin') {
                    // 活動報到
                    const p = record.payload
                    const { data: elderInfo } = await supabase.from('elders').select('name').eq('id', p.elderId).single()

                    const { error } = await supabase
                        .from('event_checkins')
                        .insert({
                            event_id: p.eventId,
                            line_user_id: 'elder_' + p.elderId,
                            display_name: (elderInfo?.name || '未知長輩') + '（離線補登）',
                            checkin_method: 'offline',
                            device_info: p.deviceInfo,
                        })
                    
                    // Ignore duplicate key errors (already checked in)
                    if (error && !error.message.includes('duplicate key value')) {
                        throw new Error(error.message)
                    }
                    results.success.push(record.id)
                }
                else {
                    // 未知的紀錄類型，先略過不報錯，或者回報錯誤
                    throw new Error('未知的離線資料類型')
                }
            } catch (err: any) {
                results.failed.push({ id: record.id, error: err.message })
            }
        }

        return NextResponse.json({ results })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
