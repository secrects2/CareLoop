'use client'

import { useEffect, useState, useCallback, use } from 'react'
import liff from '@line/liff'
import { CheckCircle, MapPin, Clock, CalendarCheck, Loader2, AlertCircle, PartyPopper } from 'lucide-react'

const CHECKIN_LIFF_ID = process.env.NEXT_PUBLIC_CHECKIN_LIFF_ID || ''

interface CheckinResult {
    success: boolean
    alreadyCheckedIn: boolean
    checkin: {
        checked_in_at: string
    }
    event: {
        title: string
        event_date: string
        event_time: string
        location: string
    }
}

type Status = 'loading' | 'checking-in' | 'success' | 'already' | 'error'

export default function CheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId: pathEventId } = use(params)
    const [status, setStatus] = useState<Status>('loading')
    const [result, setResult] = useState<CheckinResult | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [retryCount, setRetryCount] = useState(0)

    // Save eventId to localStorage IMMEDIATELY on mount (before any LIFF operations)
    useEffect(() => {
        if (pathEventId) {
            localStorage.setItem('checkin_event_id', pathEventId)
        }
    }, [pathEventId])

    const doCheckin = useCallback(async () => {
        try {
            setStatus('loading')

            // Resolve eventId: path param > localStorage
            const eventId = pathEventId || localStorage.getItem('checkin_event_id') || ''
            if (!eventId) {
                throw new Error('缺少活動 ID')
            }

            // Save to localStorage as backup
            localStorage.setItem('checkin_event_id', eventId)

            // 1. Initialize LIFF (with error recovery)
            if (!CHECKIN_LIFF_ID) {
                throw new Error('LIFF ID 未設定')
            }

            try {
                await liff.init({ liffId: CHECKIN_LIFF_ID })
            } catch (initError: any) {
                console.warn('LIFF init error (will retry):', initError)
                
                // LIFF init 失敗常見於首次 OAuth callback
                // 清除 URL 中的 OAuth 參數，讓使用者重新走一次乾淨的流程
                if (window.location.search.includes('code=') || window.location.search.includes('liffClientId')) {
                    // 清除 OAuth callback 參數，重導回乾淨的 URL
                    const cleanUrl = window.location.origin + window.location.pathname
                    window.location.replace(cleanUrl)
                    return
                }
                throw new Error('LINE 登入初始化失敗，請重新掃描 QR Code')
            }

            // 2. If not logged in, trigger LINE Login
            if (!liff.isLoggedIn()) {
                // 建構乾淨的 redirectUri（不帶任何 query params）
                const redirectUri = `${window.location.origin}/checkin/${eventId}`
                liff.login({ redirectUri })
                return
            }

            // 3. Get LINE Profile (with retry)
            setStatus('checking-in')
            let profile
            try {
                profile = await liff.getProfile()
            } catch (profileErr: any) {
                console.warn('getProfile failed, retrying after token refresh:', profileErr)
                // Token 可能過期，嘗試重新登入
                const redirectUri = `${window.location.origin}/checkin/${eventId}`
                liff.login({ redirectUri })
                return
            }

            // 4. Call check-in API
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

            if (!res.ok) {
                throw new Error(data.error || '簽到失敗')
            }

            // Clear localStorage after successful checkin
            localStorage.removeItem('checkin_event_id')

            setResult(data)
            setStatus(data.alreadyCheckedIn ? 'already' : 'success')
        } catch (err: any) {
            console.error('簽到錯誤:', err)
            setErrorMsg(err.message || '簽到過程發生錯誤')
            setStatus('error')
        }
    }, [pathEventId])

    // 首次載入 + 自動重試（最多 1 次）
    useEffect(() => {
        // 若 URL 有 OAuth 回調參數，給 LIFF SDK 一點時間處理
        const hasOAuthParams = window.location.search.includes('code=') || 
                               window.location.hash.includes('access_token')
        const delay = hasOAuthParams ? 500 : 0
        
        const timer = setTimeout(() => {
            doCheckin()
        }, delay)
        return () => clearTimeout(timer)
    }, [doCheckin])

    // 自動重試：如果首次失敗且是 LIFF 相關錯誤，自動重試一次
    useEffect(() => {
        if (status === 'error' && retryCount === 0 && 
            (errorMsg.includes('初始化') || errorMsg.includes('INIT_FAILED'))) {
            const timer = setTimeout(() => {
                setRetryCount(1)
                doCheckin()
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [status, retryCount, errorMsg, doCheckin])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        })
    }

    const formatTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':')
        return `${h}:${m}`
    }

    const formatCheckinTime = (isoStr: string) => {
        return new Date(isoStr).toLocaleString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Loading State */}
                {(status === 'loading' || status === 'checking-in') && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">
                            {status === 'loading' ? '正在連線...' : '正在簽到中...'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {status === 'loading' ? '正在驗證 LINE 登入狀態' : '正在記錄您的報到資訊'}
                        </p>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && result && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 text-center text-white">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">報到成功！</h2>
                            <p className="text-emerald-100 text-sm">您已成功完成簽到</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-center mb-2">
                                <h3 className="text-lg font-bold text-slate-800">{result.event.title}</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <CalendarCheck className="w-5 h-5 text-primary-600 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400">活動日期</p>
                                        <p className="text-sm font-medium text-slate-700">{formatDate(result.event.event_date)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Clock className="w-5 h-5 text-primary-600 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400">活動時間</p>
                                        <p className="text-sm font-medium text-slate-700">{formatTime(result.event.event_time)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <MapPin className="w-5 h-5 text-primary-600 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400">活動地點</p>
                                        <p className="text-sm font-medium text-slate-700">{result.event.location}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-xs text-emerald-500">報到時間</p>
                                        <p className="text-sm font-medium text-emerald-700">
                                            {formatCheckinTime(result.checkin.checked_in_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Already Checked In */}
                {status === 'already' && result && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 text-center text-white">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                                <PartyPopper className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">您已經報到過了</h2>
                            <p className="text-amber-100 text-sm">無需重複簽到</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="text-center mb-2">
                                <h3 className="text-lg font-bold text-slate-800">{result.event.title}</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <CalendarCheck className="w-5 h-5 text-primary-600 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400">活動日期</p>
                                        <p className="text-sm font-medium text-slate-700">{formatDate(result.event.event_date)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <MapPin className="w-5 h-5 text-primary-600 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400">活動地點</p>
                                        <p className="text-sm font-medium text-slate-700">{result.event.location}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <CheckCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div>
                                        <p className="text-xs text-amber-500">原始報到時間</p>
                                        <p className="text-sm font-medium text-amber-700">
                                            {formatCheckinTime(result.checkin.checked_in_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">簽到失敗</h2>
                        <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
                        <button
                            onClick={() => { setRetryCount(0); doCheckin() }}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-all"
                        >
                            重試
                        </button>
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    惠生健康檢測平台 · 活動簽到系統
                </p>
            </div>
        </div>
    )
}
