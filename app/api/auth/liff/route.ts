/**
 * LIFF 登入 API Route
 * 
 * 流程：
 * 1. 前端傳入 LIFF Access Token
 * 2. Server 用 LINE API 驗證 Token 並取得 Profile
 * 3. 用 Supabase Admin 查找或建立帳號
 * 4. 回傳帳密讓前端 signIn
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

// 用一般 client 做 signIn 測試
const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: { autoRefreshToken: false, persistSession: false }
})

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

        const lineEmail = `line_${lineUserId}@liff.local`
        const linePassword = `liff_${lineUserId}_secure_2026`

        let userId: string | null = null

        // Step 2：先查 profiles 表
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

        if (existingProfile) {
            userId = existingProfile.id
        }

        // Step 3：如果 profiles 沒找到，嘗試用 email 在 profiles 表查
        if (!userId) {
            const { data: profileByEmail } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', lineEmail)
                .maybeSingle()

            if (profileByEmail) {
                userId = profileByEmail.id
            }
        }

        // Step 4：如果 profiles 都沒有，嘗試建立新帳號
        if (!userId) {
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

            if (!createErr && newUser?.user) {
                userId = newUser.user.id
            } else {
                // 帳號已存在但 profiles 沒記錄 → 嘗試 signIn 來取得 userId
                const { data: signInData, error: signInErr } = await supabaseAuth.auth.signInWithPassword({
                    email: lineEmail,
                    password: linePassword,
                })

                if (signInData?.user) {
                    userId = signInData.user.id
                    // 登出 server-side client
                    await supabaseAuth.auth.signOut()
                } else {
                    // 密碼可能不對 → 用 admin 強制重設密碼然後重試
                    // 先用 listUsers 找 (帶分頁)
                    let page = 1
                    while (!userId && page <= 10) {
                        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
                            page,
                            perPage: 100,
                        })
                        if (!users || users.length === 0) break
                        const found = users.find(u => u.email === lineEmail)
                        if (found) {
                            userId = found.id
                            break
                        }
                        page++
                    }

                    if (userId) {
                        // 找到了 → 更新密碼
                        await supabaseAdmin.auth.admin.updateUserById(userId, { password: linePassword })
                    } else {
                        return NextResponse.json({
                            error: `帳號查找失敗，請聯絡管理員 (${createErr?.message})`,
                        }, { status: 500 })
                    }
                }
            }
        }

        // Step 5：確保密碼正確
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: linePassword })

        // Step 6：確保 profiles 記錄存在
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
