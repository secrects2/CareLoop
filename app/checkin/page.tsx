'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import liff from '@line/liff'
import { CheckCircle, MapPin, Clock, CalendarCheck, Loader2, AlertCircle, PartyPopper, LogIn } from 'lucide-react'

const CHECKIN_LIFF_ID = process.env.NEXT_PUBLIC_CHECKIN_LIFF_ID || ''

interface CheckinResult {
    success: boolean
    alreadyCheckedIn: boolean
    checkin: { checked_in_at: string }
    event: { title: string; event_date: string; event_time: string; location: string }
}

type Status = 'loading' | 'need-login' | 'checking-in' | 'success' | 'already' | 'error'

function CheckinContent() {
    const searchParams = useSearchParams()
    const queryEventId = searchParams.get('eventId') || ''
    const [status, setStatus] = useState<Status>('loading')
    const [result, setResult] = useState<CheckinResult | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [liffReady, setLiffReady] = useState(false)

    useEffect(() => {
        if (queryEventId) localStorage.setItem('checkin_event_id', queryEventId)
    }, [queryEventId])

    const getEventId = () => queryEventId || localStorage.getItem('checkin_event_id') || ''
    const liffUrl = CHECKIN_LIFF_ID ? `https://liff.line.me/${CHECKIN_LIFF_ID}/checkin/${getEventId()}` : ''

    useEffect(() => {
        const initLiff = async () => {
            if (!CHECKIN_LIFF_ID) { setErrorMsg('系統設定錯誤'); setStatus('error'); return }
            try {
                if (window.location.search.includes('code=')) await new Promise(r => setTimeout(r, 300))
                await liff.init({ liffId: CHECKIN_LIFF_ID })
                setLiffReady(true)
                if (liff.isLoggedIn()) { doCheckin() } else { setStatus('need-login') }
            } catch {
                if (window.location.search.includes('code=')) {
                    const eventId = getEventId()
                    window.location.replace(eventId ? `${window.location.origin}/checkin/${eventId}` : window.location.origin + window.location.pathname)
                    return
                }
                setStatus('need-login')
            }
        }
        initLiff()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleLineLogin = () => {
        if (!liffReady) return
        const eventId = getEventId()
        liff.login({ redirectUri: `${window.location.origin}/checkin/${eventId}` })
    }

    const handleOpenInLine = () => { if (liffUrl) window.location.href = liffUrl }

    const doCheckin = useCallback(async () => {
        try {
            setStatus('checking-in')
            const eventId = getEventId()
            if (!eventId) throw new Error('缺少活動 ID')
            const profile = await liff.getProfile()
            const res = await fetch('/api/events/checkin', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, lineUserId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl || null }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || '簽到失敗')
            localStorage.removeItem('checkin_event_id')
            setResult(data)
            setStatus(data.alreadyCheckedIn ? 'already' : 'success')
        } catch (err: any) {
            if (err.message?.includes('token') || err.message?.includes('expired')) { setStatus('need-login'); return }
            setErrorMsg(err.message || '簽到過程發生錯誤')
            setStatus('error')
        }
    }, [queryEventId]) // eslint-disable-line react-hooks/exhaustive-deps

    const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    const formatTime = (t: string) => { const [h, m] = t.split(':'); return `${h}:${m}` }
    const formatCheckinTime = (iso: string) => new Date(iso).toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
            <div className="w-full max-w-sm">
                {status === 'loading' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-slate-800">正在連線...</h2>
                    </div>
                )}

                {status === 'need-login' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-center text-white">
                            <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-90" />
                            <h2 className="text-xl font-bold mb-1">活動簽到</h2>
                            <p className="text-green-100 text-sm">請使用 LINE 帳號進行報到</p>
                        </div>
                        <div className="p-6 space-y-3">
                            <button onClick={handleOpenInLine} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-white font-bold text-sm" style={{ background: '#06C755' }}>
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                                用 LINE 開啟（推薦）
                            </button>
                            <div className="flex items-center gap-3 text-slate-300"><div className="flex-1 border-t" /><span className="text-xs">或</span><div className="flex-1 border-t" /></div>
                            <button onClick={handleLineLogin} disabled={!liffReady} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-medium text-sm disabled:opacity-50">
                                <LogIn className="w-5 h-5" /> 在此瀏覽器中 LINE 登入
                            </button>
                            <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs text-blue-700">💡 點擊「用 LINE 開啟」可直接在 LINE App 中完成簽到。</p></div>
                        </div>
                    </div>
                )}

                {status === 'checking-in' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-slate-800">正在簽到中...</h2>
                    </div>
                )}

                {status === 'success' && result && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 text-center text-white">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3" /><h2 className="text-2xl font-bold">報到成功！</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <h3 className="text-lg font-bold text-slate-800 text-center">{result.event.title}</h3>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><CalendarCheck className="w-5 h-5 text-primary-600 shrink-0" /><div><p className="text-xs text-slate-400">活動日期</p><p className="text-sm font-medium text-slate-700">{formatDate(result.event.event_date)}</p></div></div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><Clock className="w-5 h-5 text-primary-600 shrink-0" /><div><p className="text-xs text-slate-400">時間</p><p className="text-sm font-medium text-slate-700">{formatTime(result.event.event_time)}</p></div></div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><MapPin className="w-5 h-5 text-primary-600 shrink-0" /><div><p className="text-xs text-slate-400">地點</p><p className="text-sm font-medium text-slate-700">{result.event.location}</p></div></div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100"><CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /><div><p className="text-xs text-emerald-500">報到時間</p><p className="text-sm font-medium text-emerald-700">{formatCheckinTime(result.checkin.checked_in_at)}</p></div></div>
                        </div>
                    </div>
                )}

                {status === 'already' && result && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 text-center text-white">
                            <PartyPopper className="w-12 h-12 mx-auto mb-3" /><h2 className="text-2xl font-bold">已報到過了</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <h3 className="text-lg font-bold text-slate-800 text-center">{result.event.title}</h3>
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100"><CheckCircle className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="text-xs text-amber-500">原始報到時間</p><p className="text-sm font-medium text-amber-700">{formatCheckinTime(result.checkin.checked_in_at)}</p></div></div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-slate-800 mb-2">簽到失敗</h2>
                        <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
                        <button onClick={() => window.location.reload()} className="w-full px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-primary-600 mb-2">重試</button>
                        {liffUrl && <button onClick={handleOpenInLine} className="w-full px-6 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: '#06C755' }}>改用 LINE 開啟</button>}
                    </div>
                )}

                <p className="text-center text-xs text-slate-400 mt-6">惠生健康檢測平台 · 活動簽到系統</p>
            </div>
        </div>
    )
}

export default function CheckinPage() {
    return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}><CheckinContent /></Suspense>
}
