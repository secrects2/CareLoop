/**
 * 確保 Profile 存在 API
 * 使用 Service Role Key 繞過 RLS，為當前登入使用者建立 profiles 記錄
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST() {
    try {
        // 取得當前登入使用者
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: '未登入' }, { status: 401 })
        }

        // 用 Admin 權限 upsert profiles（繞過 RLS）
        const { error } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '指導員',
                avatar_url: user.user_metadata?.avatar_url || '',
                role: 'instructor',
                is_active: true,
            }, { onConflict: 'id' })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, userId: user.id })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '未知錯誤'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
