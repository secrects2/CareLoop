/**
 * LINE LIFF SDK 初始化工具
 * 提供 LIFF 環境偵測、初始化、取得 Profile 等功能
 */
import liff from '@line/liff'

// ============================================================================
// 型別
// ============================================================================

export interface LiffProfile {
    userId: string
    displayName: string
    pictureUrl?: string
    statusMessage?: string
}

// ============================================================================
// 常數
// ============================================================================

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || ''

// ============================================================================
// 函式
// ============================================================================

/** 是否在 LIFF 環境中（LINE App 內） */
export function isInLiff(): boolean {
    if (typeof window === 'undefined') return false
    try {
        return liff.isInClient()
    } catch {
        return false
    }
}

/** LIFF 是否已初始化 */
let _initialized = false

/**
 * 初始化 LIFF
 * @returns 是否成功初始化
 */
export async function initLiff(): Promise<boolean> {
    if (_initialized) return true
    if (!LIFF_ID) {
        console.warn('LIFF ID 未設定 (NEXT_PUBLIC_LIFF_ID)')
        return false
    }

    try {
        await liff.init({ liffId: LIFF_ID })
        _initialized = true
        return true
    } catch (err) {
        console.error('LIFF 初始化失敗:', err)
        return false
    }
}

/**
 * LIFF 登入
 * 若未登入，會跳轉到 LINE Login 頁面
 */
export function liffLogin(): void {
    if (!liff.isLoggedIn()) {
        liff.login()
    }
}

/**
 * 取得 LINE Profile
 */
export async function getLiffProfile(): Promise<LiffProfile | null> {
    try {
        if (!liff.isLoggedIn()) return null
        const profile = await liff.getProfile()
        return {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            statusMessage: profile.statusMessage,
        }
    } catch (err) {
        console.error('取得 LINE Profile 失敗:', err)
        return null
    }
}

/**
 * 取得 LIFF Access Token（用於後端驗證）
 */
export function getLiffAccessToken(): string | null {
    try {
        return liff.getAccessToken()
    } catch {
        return null
    }
}

/**
 * LIFF 登出
 */
export function liffLogout(): void {
    if (liff.isLoggedIn()) {
        liff.logout()
    }
}

/**
 * 關閉 LIFF 視窗（回到 LINE 聊天室）
 */
export function closeLiff(): void {
    try {
        liff.closeWindow()
    } catch {
        // 非 LIFF 環境忽略
    }
}

/** 取得 liff 物件（進階用途） */
export { liff }
