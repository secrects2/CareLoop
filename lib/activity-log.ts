import { createClient } from '@/lib/supabase/client'

/**
 * 記錄使用者操作到 activity_logs 表
 */
export async function logActivity(
    action: string,
    details?: string,
    targetType?: string,
    targetId?: string
) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('activity_logs').insert({
            user_id: user.id,
            action,
            details: details || null,
            target_type: targetType || null,
            target_id: targetId || null,
        })
    } catch (err) {
        console.error('記錄操作失敗:', err)
    }
}
