/**
 * LINE LIFF React Hook
 * 初始化 LIFF + 取得 LINE Profile + 自動偵測 LIFF 環境
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    initLiff,
    isInLiff,
    getLiffProfile,
    liffLogin,
    liffLogout,
    type LiffProfile,
} from '@/lib/liff'

// ============================================================================
// 型別
// ============================================================================

interface UseLiffReturn {
    /** LIFF SDK 是否已初始化完成 */
    liffReady: boolean
    /** 是否在 LINE App 內開啟 */
    isInLine: boolean
    /** 是否已透過 LIFF 登入 */
    isLoggedIn: boolean
    /** LINE 使用者 Profile */
    lineProfile: LiffProfile | null
    /** 初始化錯誤 */
    liffError: string | null
    /** 手動觸發 LIFF 登入 */
    login: () => void
    /** 手動觸發 LIFF 登出 */
    logout: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function useLiff(): UseLiffReturn {
    const [liffReady, setLiffReady] = useState(false)
    const [isInLine, setIsInLine] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [lineProfile, setLineProfile] = useState<LiffProfile | null>(null)
    const [liffError, setLiffError] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            const success = await initLiff()
            if (!success) {
                // 非 LIFF 環境或未設定 LIFF ID — 不影響一般使用
                setLiffReady(false)
                return
            }

            setLiffReady(true)
            setIsInLine(isInLiff())

            // 如果已登入，取得 Profile
            try {
                const { default: liff } = await import('@line/liff')
                if (liff.isLoggedIn()) {
                    setIsLoggedIn(true)
                    const profile = await getLiffProfile()
                    setLineProfile(profile)
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : '未知錯誤'
                setLiffError(msg)
            }
        }

        init()
    }, [])

    const login = useCallback(() => {
        liffLogin()
    }, [])

    const logout = useCallback(() => {
        liffLogout()
        setIsLoggedIn(false)
        setLineProfile(null)
    }, [])

    return {
        liffReady,
        isInLine,
        isLoggedIn,
        lineProfile,
        liffError,
        login,
        logout,
    }
}
