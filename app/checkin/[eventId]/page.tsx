'use client'

import { useEffect, useState, useCallback, use } from 'react'
import liff from '@line/liff'
import { CheckCircle, MapPin, Clock, CalendarCheck, Loader2, AlertCircle, PartyPopper, LogIn, Smartphone } from 'lucide-react'

const CHECKIN_LIFF_ID = process.env.NEXT_PUBLIC_CHECKIN_LIFF_ID || ''

interface CheckinResult {
    success: boolean
    alreadyCheckedIn: boolean
    checkin: { checked_in_at: string }
    event: { title: string; event_date: string; event_time: string; location: string }
}

type Status = 'loading' | 'need-login' | 'checking-in' | 'success' | 'already' | 'error'

export default function CheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId: pathEventId } = use(params)
    const [status, setStatus] = useState<Status>('loading')
    const [result, setResult] = useState<CheckinResult | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [liffReady, setLiffReady] = useState(false)
    const [isInLineApp, setIsInLineApp] = useState(false)

    // Save eventId immediately
    useEffect(() => {
        if (pathEventId) localStorage.setItem('checkin_event_id', pathEventId)
    }, [pathEventId])

    const getEventId = () => pathEventId || localStorage.getItem('checkin_event_id') || ''

    // LIFF URL for "open in LINE" button
    // 注意：LIFF path 會 append 到 endpoint URL，如果 endpoint 已是 /checkin，只需要帶 eventId
    const liffUrl = CHECKIN_LIFF_ID ? `https://liff.line.me/${CHECKIN_LIFF_ID}/${getEventId()}` : ''

    // Step 1: Init LIFF (don't auto-login)
    useEffect(() => {
        const initLiff = async () => {
            if (!CHECKIN_LIFF_ID) {
                setErrorMsg('系統設定錯誤 (LIFF ID)')
                setStatus('error')
                return
            }

            try {
                // 若 URL 有 OAuth callback 參數，延遲讓 LIFF 處理
                const hasOAuthParams = window.location.search.includes('code=') ||
                    window.location.hash.includes('access_token')
                if (hasOAuthParams) await new Promise(r => setTimeout(r, 300))

                await liff.init({ liffId: CHECKIN_LIFF_ID })
                setLiffReady(true)
                setIsInLineApp(liff.isInClient())

                // 已登入 → 直接簽到
                if (liff.isLoggedIn()) {
                    doCheckin()
                } else {
                    // ✅ 關鍵改動：不自動 liff.login()，而是顯示引導畫面
                    setStatus('need-login')
                }
            } catch (initError: any) {
                console.warn('LIFF init error:', initError)
                // OAuth callback 失敗 → 清除參數重試
                if (window.location.search.includes('code=') || window.location.search.includes('liffClientId')) {
                    window.location.replace(window.location.origin + window.location.pathname)
                    return
                }
                // 仍然可以顯示引導頁，讓用戶選擇用 LINE 開啟
                setStatus('need-login')
            }
        }
        initLiff()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Step 2: 使用者點擊登入後才觸發
    const handleLineLogin = () => {
        if (liffReady) {
            // 使用當前頁面 URL 作為 redirectUri（最安全，不會構造錯誤的路徑）
            const redirectUri = window.location.origin + window.location.pathname
            liff.login({ redirectUri })
        }
    }

    // Step 3: 開啟 LINE App
    const handleOpenInLine = () => {
        if (liffUrl) {
            window.location.href = liffUrl
        }
    }

    // Step 4: 執行簽到
    const doCheckin = useCallback(async () => {
        try {
            setStatus('checking-in')
            const eventId = getEventId()
            if (!eventId) throw new Error('缺少活動 ID')

            const profile = await liff.getProfile()

            const res = await fetch('/api/events/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    lineUserId: profile.userId,
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl || null,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || '簽到失敗')

            localStorage.removeItem('checkin_event_id')
            setResult(data)
            setStatus(data.alreadyCheckedIn ? 'already' : 'success')
        } catch (err: any) {
            console.error('簽到錯誤:', err)
            // Token 失效 → 回到 need-login 讓用戶重新登入
            if (err.message?.includes('401') || err.message?.includes('token') || err.message?.includes('expired')) {
                setStatus('need-login')
                return
            }
            setErrorMsg(err.message || '簽到過程發生錯誤')
            setStatus('error')
        }
    }, [pathEventId]) // eslint-disable-line react-hooks/exhaustive-deps

    const formatDate = (dateStr: string) =>
        new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    const formatTime = (timeStr: string) => { const [h, m] = timeStr.split(':'); return `${h}:${m}` }
    const formatCheckinTime = (isoStr: string) =>
        new Date(isoStr).toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
            <div className="w-full max-w-sm">

                {/* Loading */}
                {status === 'loading' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">正在連線...</h2>
                        <p className="text-sm text-slate-500">正在初始化簽到系統</p>
                    </div>
                )}

                {/* ✅ 關鍵：需要登入的引導頁面 */}
                {status === 'need-login' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-center text-white">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                                <CalendarCheck className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold mb-1">活動簽到</h2>
                            <p className="text-green-100 text-sm">請使用 LINE 帳號進行報到</p>
                        </div>

                        <div className="p-6 space-y-3">
                            {/* Option 1: Open in LINE App (recommended) */}
                            <button
                                onClick={handleOpenInLine}
                                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                style={{ background: '#06C755' }}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                                </svg>
                                用 LINE 開啟（推薦）
                            </button>

                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="flex-1 border-t border-slate-200" />
                                <span className="text-xs">或</span>
                                <div className="flex-1 border-t border-slate-200" />
                            </div>

                            {/* Option 2: LINE Login in browser */}
                            <button
                                onClick={handleLineLogin}
                                disabled={!liffReady}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-medium text-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
                            >
                                <LogIn className="w-5 h-5" />
                                在此瀏覽器中 LINE 登入
                            </button>

                            {/* Help text */}
                            <div className="bg-blue-50 rounded-xl p-3 mt-3">
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    <strong>💡 建議：</strong>點擊「用 LINE 開啟」可直接在 LINE App 中完成簽到，體驗最佳。若手機未安裝 LINE，請選擇「在此瀏覽器中 LINE 登入」。
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Checking in */}
                {status === 'checking-in' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">正在簽到中...</h2>
                        <p className="text-sm text-slate-500">正在記錄您的報到資訊</p>
                    </div>
                )}

                {/* Success */}
                {status === 'success' && result && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 text-center text-white">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">報到成功！</h2>
                            <p className="text-emerald-100 text-sm">您已成功完成簽到</p>
                        </div>
                        <div className="p-6 space-y-3">
                            <h3 className="text-lg font-bold text-slate-800 text-center">{result.event.title}</h3>
                            <InfoRow icon={<CalendarCheck className="w-5 h-5 text-primary-600" />} label="活動日期" value={formatDate(result.event.event_date)} />
                            <InfoRow icon={<Clock className="w-5 h-5 text-primary-600" />} label="活動時間" value={formatTime(result.event.event_time)} />
                            <InfoRow icon={<MapPin className="w-5 h-5 text-primary-600" />} label="活動地點" value={result.event.location} />
                            <InfoRow icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} label="報到時間" value={formatCheckinTime(result.checkin.checked_in_at)} highlight />
                        </div>
                    </div>
                )}

                {/* Already */}
                {status === 'already' && result && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 text-center text-white">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                                <PartyPopper className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">您已經報到過了</h2>
                            <p className="text-amber-100 text-sm">無需重複簽到</p>
                        </div>
                        <div className="p-6 space-y-3">
                            <h3 className="text-lg font-bold text-slate-800 text-center">{result.event.title}</h3>
                            <InfoRow icon={<CalendarCheck className="w-5 h-5 text-primary-600" />} label="活動日期" value={formatDate(result.event.event_date)} />
                            <InfoRow icon={<CheckCircle className="w-5 h-5 text-amber-600" />} label="原始報到時間" value={formatCheckinTime(result.checkin.checked_in_at)} />
                        </div>
                    </div>
                )}

                {/* Error */}
                {status === 'error' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">簽到失敗</h2>
                        <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => { setStatus('loading'); window.location.reload() }}
                                className="w-full px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-all"
                            >
                                重試
                            </button>
                            {liffUrl && (
                                <button
                                    onClick={handleOpenInLine}
                                    className="w-full px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                                    style={{ background: '#06C755' }}
                                >
                                    改用 LINE 開啟
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-slate-400 mt-6">
                    惠生健康檢測平台 · 活動簽到系統
                </p>
            </div>
        </div>
    )
}

function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl ${highlight ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
            <div className="shrink-0">{icon}</div>
            <div>
                <p className={`text-xs ${highlight ? 'text-emerald-500' : 'text-slate-400'}`}>{label}</p>
                <p className={`text-sm font-medium ${highlight ? 'text-emerald-700' : 'text-slate-700'}`}>{value}</p>
            </div>
        </div>
    )
}
