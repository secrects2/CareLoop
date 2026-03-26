import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/migrate/elder-fields — 一次性遷移：添加長輩報表欄位
export async function GET() {
    const results: string[] = []

    try {
        // 使用 supabaseAdmin 直接嘗試 insert 一個 dummy 並觀察錯誤
        // 替代方案：直接在 Supabase Dashboard SQL Editor 執行
        // 這裡提供 SQL 給使用者參考
        return NextResponse.json({
            message: '請在 Supabase Dashboard → SQL Editor 執行以下 SQL',
            sql: [
                'ALTER TABLE elders ADD COLUMN IF NOT EXISTS education_level text DEFAULT NULL;',
                'ALTER TABLE elders ADD COLUMN IF NOT EXISTS blood_pressure text DEFAULT NULL;',
                'ALTER TABLE elders ADD COLUMN IF NOT EXISTS pulse integer DEFAULT NULL;',
                'ALTER TABLE elders ADD COLUMN IF NOT EXISTS id_number text DEFAULT NULL;',
                'ALTER TABLE elders ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL;',
                'ALTER TABLE elders ADD COLUMN IF NOT EXISTS line_user_id text DEFAULT NULL;',
                '',
                '-- 為 line_user_id 建立索引（加速查詢）',
                'CREATE INDEX IF NOT EXISTS idx_elders_line_user_id ON elders(line_user_id);',
            ],
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
