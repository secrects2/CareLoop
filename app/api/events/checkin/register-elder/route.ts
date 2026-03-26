import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/events/checkin/register-elder
// 簽到後將 LINE 用戶資料建入長輩管理
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            lineUserId,
            displayName,
            name,
            idNumber,
            birthDate,
            gender,
            educationLevel,
            phone,
            bloodPressure,
            pulse,
        } = body

        if (!lineUserId || !name) {
            return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
        }

        // 檢查是否已有對應的長輩（用 line_user_id 查詢）
        const { data: existing } = await supabaseAdmin
            .from('elders')
            .select('id')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

        if (existing) {
            // 已存在 → 更新資料
            const { data: updated, error } = await supabaseAdmin
                .from('elders')
                .update({
                    name: name.trim(),
                    id_number: idNumber?.trim() || null,
                    birth_date: birthDate || null,
                    gender: gender || null,
                    education_level: educationLevel || null,
                    phone: phone?.trim() || null,
                    blood_pressure: bloodPressure?.trim() || null,
                    pulse: pulse ? parseInt(pulse) : null,
                })
                .eq('id', existing.id)
                .select('id')
                .single()

            if (error) {
                return NextResponse.json({ error: '更新失敗: ' + error.message }, { status: 500 })
            }

            // 同時更新 event_checkins 的 line_user_id 為 elder_ 格式，使匯出能帶出完整資料
            await supabaseAdmin
                .from('event_checkins')
                .update({ display_name: name.trim() })
                .eq('line_user_id', lineUserId)

            return NextResponse.json({ success: true, elderId: updated.id, isNew: false })
        }

        // 不存在 → 取得一個管理員 instructor_id（使用第一個有 elders 記錄的管理員）
        let instructorId: string | null = null
        const { data: anyElder } = await supabaseAdmin
            .from('elders')
            .select('instructor_id')
            .limit(1)
            .single()

        if (anyElder) {
            instructorId = anyElder.instructor_id
        } else {
            // 如果沒有任何長輩，嘗試從 profiles 取第一個管理員
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .limit(1)
                .single()
            instructorId = profile?.id || null
        }

        if (!instructorId) {
            return NextResponse.json({ error: '系統尚未設定管理員' }, { status: 500 })
        }

        // 新建長輩
        const { data: newElder, error: insertError } = await supabaseAdmin
            .from('elders')
            .insert({
                instructor_id: instructorId,
                name: name.trim(),
                id_number: idNumber?.trim() || null,
                birth_date: birthDate || null,
                gender: gender || null,
                education_level: educationLevel || null,
                phone: phone?.trim() || null,
                blood_pressure: bloodPressure?.trim() || null,
                pulse: pulse ? parseInt(pulse) : null,
                line_user_id: lineUserId,
            })
            .select('id')
            .single()

        if (insertError) {
            return NextResponse.json({ error: '建檔失敗: ' + insertError.message }, { status: 500 })
        }

        // 更新 event_checkins 的顯示名稱
        await supabaseAdmin
            .from('event_checkins')
            .update({ display_name: name.trim() })
            .eq('line_user_id', lineUserId)

        return NextResponse.json({ success: true, elderId: newElder.id, isNew: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '伺服器錯誤' }, { status: 500 })
    }
}
