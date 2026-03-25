'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

function CheckinContent() {
    const searchParams = useSearchParams()
    const queryEventId = searchParams.get('eventId') || ''
    const [status, setStatus] = useState<Status>('loading')
    const [result, setResult] = useState<CheckinResult | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [retryCount, setRetryCount] = useState(0)

    // Save eventId to localStorage IMMEDIATELY on mount
    useEffect(() => {
        if (queryEventId) {
            localStorage.setItem('checkin_event_id', queryEventId)
        }
    }, [queryEventId])

    const doCheckin = useCallback(async () => {
        try {
            setStatus('loading')

            // Resolve eventId: query param > localStorage
            const eventId = queryEventId || localStorage.getItem('checkin_event_id') || ''
            if (!eventId) {
                throw new Error('缺少活動 ID')
            }

            localStorage.setItem('checkin_event_id', eventId)

            if (!CHECKIN_LIFF_ID) {
                throw new Error('LIFF ID 未設定')
            }

            // Initialize LIFF with error recovery
            try {
                await liff.init({ liffId: CHECKIN_LIFF_ID })
            } catch (initError: any) {
                console.warn('LIFF init error:', initError)
                if (window.location.search.includes('code=') || window.location.search.includes('liffClientId')) {
                    const cleanUrl = `${window.location.origin}/checkin/${eventId}`
                    window.location.replace(cleanUrl)
                    return
                }
                throw new Error('LINE 登入初始化失敗，請重新掃描 QR Code')
            }

            if (!liff.isLoggedIn()) {
                const redirectUri = `${window.location.origin}/checkin/${eventId}`
                liff.login({ redirectUri })
                return
            }

            setStatus('checking-in')
            let profile
            try {
                profile = await liff.getProfile()
            } catch (profileErr: any) {
                console.warn('getProfile failed:', profileErr)
                const redirectUri = `${window.location.origin}/checkin/${eventId}`
                liff.login({ redirectUri })
                return
            }

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
            setErrorMsg(err.message || '簽到過程發生錯誤')
            setStatus('error')
        }
    }, [queryEventId])

    useEffect(() => {
        const hasOAuthParams = window.location.search.includes('code=') ||
                               window.location.hash.includes('access_token')
        const delay = hasOAuthParams ? 500 : 0
        const timer = setTimeout(() => doCheckin(), delay)
        return () => clearTimeout(timer)
    }, [doCheckin])

    // Auto-retry on LIFF init errors
    useEffect(() => {
        if (status === 'error' && retryCount === 0 &&
            (errorMsg.includes('初始化') || errorMsg.includes('INIT_FAILED'))) {
            const timer = setTimeout(() => { setRetryCount(1); doCheckin() }, 1500)
            return () => clearTimeout(timer)
        }
    }, [status, retryCount, errorMsg, doCheckin])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        })
    }
    const formatTime = (timeStr: string) => { const [h, m] = timeStr.split(':'); return `${h}:${m}` }
    const formatCheckinTime = (isoStr: string) => {
        return new Date(isoStr).toLocaleString('zh-TW', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
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
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <CalendarCheck className="w-5 h-5 text-primary-600 shrink-0" />
                                <div><p className="text-xs text-slate-400">活動日期</p><p className="text-sm font-medium text-slate-700">{formatDate(result.event.event_date)}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <Clock className="w-5 h-5 text-primary-600 shrink-0" />
                                <div><p className="text-xs text-slate-400">活動時間</p><p className="text-sm font-medium text-slate-700">{formatTime(result.event.event_time)}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <MapPin className="w-5 h-5 text-primary-600 shrink-0" />
                                <div><p className="text-xs text-slate-400">活動地點</p><p className="text-sm font-medium text-slate-700">{result.event.location}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div><p className="text-xs text-emerald-500">報到時間</p><p className="text-sm font-medium text-emerald-700">{formatCheckinTime(result.checkin.checked_in_at)}</p></div>
                            </div>
                        </div>
                    </div>
                )}

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
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <CalendarCheck className="w-5 h-5 text-primary-600 shrink-0" />
                                <div><p className="text-xs text-slate-400">活動日期</p><p className="text-sm font-medium text-slate-700">{formatDate(result.event.event_date)}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <CheckCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div><p className="text-xs text-amber-500">原始報到時間</p><p className="text-sm font-medium text-amber-700">{formatCheckinTime(result.checkin.checked_in_at)}</p></div>
                            </div>
                        </div>
                    </div>
                )}

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

                <p className="text-center text-xs text-slate-400 mt-6">
                    惠生健康檢測平台 · 活動簽到系統
                </p>
            </div>
        </div>
    )
}

export default function CheckinPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        }>
            <CheckinContent />
        </Suspense>
    )
}
