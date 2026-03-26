/**
 * LIFF 登入 API Route
 * 
 * 流程：
 * 1. 前端傳入 LIFF Access Token
 * 2. Server 用 LINE API 驗證 Token 並取得 Profile
 * 3. 用 Supabase Admin (Service Role) 建立/查找帳號（跳過郵件驗證）
 * 4. 產生 session 回傳給前端
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
    try {
        const { accessToken } = await request.json()

        if (!accessToken) {
            return NextResponse.json({ error: '缺少 accessToken' }, { status: 400 })
        }

        // Step 1：用 LINE API 驗證 Access Token 並取得 Profile
        const profileRes = await fetch('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        })

        if (!profileRes.ok) {
            return NextResponse.json({ error: 'LINE Token 驗證失敗' }, { status: 401 })
        }

        const lineProfile = await profileRes.json()
        const { userId: lineUserId, displayName, pictureUrl } = lineProfile

        // Step 2：查詢是否已有綁定的帳號
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .eq('line_user_id', lineUserId)
            .single()

        let userId: string
        const lineEmail = `line_${lineUserId}@liff.local`
        const linePassword = `liff_${lineUserId}_secure_2026`

        if (existingProfile) {
            // 已有帳號 → 直接用
            userId = existingProfile.id
        } else {
            // Step 3：建立新帳號（用 Admin API，自動跳過郵件驗證）
            const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email: lineEmail,
                password: linePassword,
                email_confirm: true,
                user_metadata: {
                    full_name: displayName,
                    avatar_url: pictureUrl || '',
                    line_user_id: lineUserId,
                },
            })

            if (createErr) {
                // 帳號已存在 → 用 email 查找
                const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
                    page: 1,
                    perPage: 1000,
                })

                const found = users?.find(u => u.email === lineEmail)

                if (found) {
                    userId = found.id
                    // 確保密碼正確
                    await supabaseAdmin.auth.admin.updateUserById(userId, { password: linePassword })
                } else {
                    return NextResponse.json({ error: '帳號建立失敗：' + createErr.message }, { status: 500 })
                }
            } else {
                userId = newUser.user.id
            }

            // 綁定 line_user_id 到 profiles 表
            await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userId,
                    line_user_id: lineUserId,
                    full_name: displayName,
                    avatar_url: pictureUrl || '',
                    email: lineEmail,
                    role: 'instructor',
                    is_active: true,
                }, { onConflict: 'id' })
        }

        // 確保 profiles 記錄存在（已有帳號也要確保）
        await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                line_user_id: lineUserId,
                full_name: displayName,
                avatar_url: pictureUrl || '',
                email: lineEmail,
                role: 'instructor',
                is_active: true,
            }, { onConflict: 'id' })

        // Step 4：確保密碼正確（用 Admin API 更新密碼）
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: linePassword })

        return NextResponse.json({
            success: true,
            email: lineEmail,
            password: linePassword,
            userId,
            displayName,
            lineUserId,
        })

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '未知錯誤'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
