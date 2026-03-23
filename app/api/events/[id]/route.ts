import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 Service Role Key 避開 RLS 限制
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // 先刪除相關的簽到紀錄（因為有 ON DELETE CASCADE，理論上會自動刪除，但保險起見）
        const { error: deleteError } = await supabaseAdmin
            .from('events')
            .delete()
            .eq('id', id)

        if (deleteError) {
            return NextResponse.json(
                { error: '刪除失敗：' + deleteError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || '伺服器錯誤' },
            { status: 500 }
        )
    }
}
