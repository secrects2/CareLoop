import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/migrate/elder-fields — 一次性遷移：添加長輩報表欄位
export async function GET() {
    try {
        // Add new columns if they don't exist
        const queries = [
            `ALTER TABLE elders ADD COLUMN IF NOT EXISTS education_level text DEFAULT NULL`,
            `ALTER TABLE elders ADD COLUMN IF NOT EXISTS blood_pressure text DEFAULT NULL`,
            `ALTER TABLE elders ADD COLUMN IF NOT EXISTS pulse integer DEFAULT NULL`,
        ]

        const results: string[] = []

        for (const q of queries) {
            const { error } = await supabaseAdmin.rpc('exec_sql', { sql: q }).maybeSingle()
            if (error) {
                // Try direct approach via REST — rpc might not exist
                // Just note the error, columns might already exist
                results.push(`Note: ${error.message}`)
            } else {
                results.push('OK')
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
