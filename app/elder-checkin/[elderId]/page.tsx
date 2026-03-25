'use client'

import { useEffect, useState, use } from 'react'
import { CheckCircle, Users, CalendarCheck, Loader2, AlertCircle, ChevronDown } from 'lucide-react'

interface ElderInfo {
    id: string
    name: string
    gender: string | null
}

interface EventOption {
    id: string
    title: string
    event_date: string
    event_time: string
    location: string
}

type Status = 'loading' | 'select-event' | 'checking-in' | 'success' | 'already' | 'error'

export default function ElderCheckinPage({ params }: { params: Promise<{ elderId: string }> }) {
    const { elderId } = use(params)
    const [status, setStatus] = useState<Status>('loading')
    const [elder, setElder] = useState<ElderInfo | null>(null)
    const [events, setEvents] = useState<EventOption[]>([])
    const [selectedEvent, setSelectedEvent] = useState<string>('')
    const [errorMsg, setErrorMsg] = useState('')
    const [checkinResult, setCheckinResult] = useState<{ event: EventOption; time: string } | null>(null)

    // Fetch elder info and active events
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/elder-checkin/info?elderId=${elderId}`)
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || '找不到長輩資料')
                setElder(data.elder)
                setEvents(data.events)
                setStatus('select-event')
            } catch (err: any) {
                setErrorMsg(err.message)
                setStatus('error')
            }
        }
        fetchData()
    }, [elderId])

    const handleCheckin = async () => {
        if (!selectedEvent) return
        try {
            setStatus('checking-in')
            const res = await fetch('/api/elder-checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ elderId, eventId: selectedEvent }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || '簽到失敗')

            const evt = events.find(e => e.id === selectedEvent)!
            setCheckinResult({
                event: evt,
                time: data.checkin.checked_in_at,
            })
            setStatus(data.alreadyCheckedIn ? 'already' : 'success')
        } catch (err: any) {
            setErrorMsg(err.message)
            setStatus('error')
        }
    }

    const formatDate = (d: string) =>
        new Date(d + 'T00:00:00').toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })
    const formatCheckinTime = (iso: string) =>
        new Date(iso).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)' }}>
            <div className="w-full max-w-sm">

                {/* Loading */}
                {status === 'loading' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-slate-800">載入中...</h2>
                    </div>
                )}

                {/* Select Event */}
                {status === 'select-event' && elder && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Elder Info Header */}
                        <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-center text-white">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 ${elder.gender === 'female' ? 'bg-pink-300/30' : 'bg-blue-300/30'}`}>
                                {elder.name[0]}
                            </div>
                            <h2 className="text-xl font-bold">{elder.name}</h2>
                            <p className="text-violet-200 text-sm mt-1">長輩簽到</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {events.length === 0 ? (
                                <div className="text-center py-4">
                                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">目前沒有進行中的活動</p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">選擇活動</label>
                                        <div className="relative">
                                            <select
                                                value={selectedEvent}
                                                onChange={(e) => setSelectedEvent(e.target.value)}
                                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                            >
                                                <option value="">— 請選擇活動 —</option>
                                                {events.map(evt => (
                                                    <option key={evt.id} value={evt.id}>
                                                        {evt.title} ({formatDate(evt.event_date)})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCheckin}
                                        disabled={!selectedEvent}
                                        className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 active:scale-[0.98]"
                                    >
                                        <CalendarCheck className="w-5 h-5 inline mr-2" />
                                        確認簽到
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Checking in */}
                {status === 'checking-in' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-slate-800">簽到中...</h2>
                    </div>
                )}

                {/* Success */}
                {status === 'success' && checkinResult && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 text-center text-white">
                            <CheckCircle className="w-14 h-14 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold">{elder?.name} 報到成功！</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="p-3 bg-slate-50 rounded-xl text-center">
                                <p className="text-sm font-medium text-slate-700">{checkinResult.event.title}</p>
                                <p className="text-xs text-slate-400 mt-1">{formatDate(checkinResult.event.event_date)} · {checkinResult.event.location}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                                <p className="text-xs text-emerald-500">報到時間</p>
                                <p className="text-sm font-bold text-emerald-700">{formatCheckinTime(checkinResult.time)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Already checked in */}
                {status === 'already' && checkinResult && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 text-center text-white">
                            <Users className="w-14 h-14 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold">{elder?.name} 已報到過</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                                <p className="text-xs text-amber-500">原始報到時間</p>
                                <p className="text-sm font-bold text-amber-700">{formatCheckinTime(checkinResult.time)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {status === 'error' && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-slate-800 mb-2">錯誤</h2>
                        <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600">重試</button>
                    </div>
                )}

                <p className="text-center text-xs text-slate-400 mt-6">惠生健康檢測平台 · 長輩簽到</p>
            </div>
        </div>
    )
}
