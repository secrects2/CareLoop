'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import * as XLSX from 'xlsx'
import {
    ArrowLeft, MapPin, Clock, CalendarCheck, Users, Download,
    Pencil, QrCode, Loader2
} from 'lucide-react'

interface EventData {
    id: string
    title: string
    event_date: string
    event_time: string
    location: string
    is_active: boolean
}

interface CheckinRecord {
    id: string
    line_user_id: string
    display_name: string
    picture_url: string | null
    checked_in_at: string
}

const CHECKIN_LIFF_ID = process.env.NEXT_PUBLIC_CHECKIN_LIFF_ID || ''

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [event, setEvent] = useState<EventData | null>(null)
    const [checkins, setCheckins] = useState<CheckinRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Real-time clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch event and checkins
    const fetchData = useCallback(async () => {
        const supabase = createClient()

        const { data: eventData, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !eventData) {
            toast.error('找不到此活動')
            router.push('/events')
            return
        }

        setEvent(eventData)

        const { data: checkinsData } = await supabase
            .from('event_checkins')
            .select('*')
            .eq('event_id', id)
            .order('checked_in_at', { ascending: false })

        setCheckins(checkinsData || [])
        setLoading(false)
    }, [id, router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Supabase Realtime subscription
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`event-checkins-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'event_checkins',
                    filter: `event_id=eq.${id}`,
                },
                (payload) => {
                    const newCheckin = payload.new as CheckinRecord
                    setCheckins(prev => [newCheckin, ...prev])
                    toast.success(`${newCheckin.display_name} 已報到！`, { icon: '🎉' })
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status)
            })

        // ✅ Polling fallback: Realtime 可能未啟用，每 10 秒自動刷新
        const pollInterval = setInterval(() => {
            const poll = async () => {
                const { data } = await supabase
                    .from('event_checkins')
                    .select('*')
                    .eq('event_id', id)
                    .order('checked_in_at', { ascending: false })
                if (data) {
                    setCheckins(prev => {
                        // 如果人數變多了，顯示 toast
                        if (data.length > prev.length) {
                            const newOnes = data.filter(d => !prev.find(p => p.id === d.id))
                            newOnes.forEach(n => toast.success(`${n.display_name} 已報到！`, { icon: '🎉' }))
                        }
                        return data
                    })
                }
            }
            poll()
        }, 10000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(pollInterval)
        }
    }, [id])

    const handleExportExcel = () => {
        if (!event) return
        const rows = checkins.map((c, idx) => ({
            '序號': idx + 1,
            'LINE 名稱': c.display_name,
            'LINE User ID': c.line_user_id,
            '報到時間': new Date(c.checked_in_at).toLocaleString('zh-TW'),
        }))

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '簽到名單')
        ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 36 }, { wch: 22 }]
        XLSX.writeFile(wb, `${event.title}_簽到名單_${event.event_date}.xlsx`)
        toast.success('Excel 匯出成功')
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        })
    }

    const formatTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':')
        return `${h}:${m}`
    }

    // QR Code URL: point directly to our app so the page loads first
    // (liff.line.me redirects through LINE's servers and loses the eventId)
    const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://epa-tool.vercel.app'
    const qrUrl = `${appOrigin}/checkin/${id}`

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    if (!event) return null

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <button
                        onClick={() => router.push('/events')}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回活動列表
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">{event.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                        <span className="flex items-center gap-1.5">
                            <CalendarCheck className="w-4 h-4" />
                            {formatDate(event.event_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatTime(event.event_time)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        匯出 Excel
                    </button>
                    <button
                        onClick={() => router.push(`/events/${id}/edit`)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <Pencil className="w-4 h-4" />
                        編輯
                    </button>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: QR Code & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Real-time clock */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">目前時間</p>
                        <p className="text-3xl font-mono font-bold text-slate-800">
                            {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            {currentTime.toLocaleDateString('zh-TW', {
                                year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                            })}
                        </p>
                    </div>

                    {/* Total checkins */}
                    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 shadow-lg text-center text-white">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />
                        <p className="text-5xl font-bold">{checkins.length}</p>
                        <p className="text-sm opacity-80 mt-1">已報到人數</p>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <QrCode className="w-5 h-5 text-primary-600" />
                            <h3 className="font-semibold text-slate-800">簽到 QR Code</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-center">
                            <QRCodeSVG
                                value={qrUrl}
                                size={200}
                                level="H"
                                includeMargin
                                bgColor="#ffffff"
                                fgColor="#1e293b"
                            />
                        </div>
                        <p className="text-xs text-slate-400 text-center mt-3">
                            掃描此 QR Code 以完成 LINE 簽到
                        </p>
                    </div>
                </div>

                {/* Right: Checkin list */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-600" />
                                報到名單
                                <span className="text-xs font-normal text-slate-400 ml-1">
                                    （即時更新）
                                </span>
                            </h3>
                        </div>

                        {checkins.length === 0 ? (
                            <div className="text-center py-16">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">尚無人報到</p>
                                <p className="text-slate-400 text-xs mt-1">等待人員掃描 QR Code 簽到中...</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {checkins.map((checkin, idx) => (
                                    <div
                                        key={checkin.id}
                                        className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        {/* Number */}
                                        <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                                            {checkins.length - idx}
                                        </div>

                                        {/* Avatar */}
                                        {checkin.picture_url ? (
                                            <img
                                                src={checkin.picture_url}
                                                alt={checkin.display_name}
                                                className="w-10 h-10 rounded-full object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold shrink-0">
                                                {checkin.display_name[0]}
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                {checkin.display_name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(checkin.checked_in_at).toLocaleTimeString('zh-TW', { hour12: false })}
                                                {' '}報到
                                            </p>
                                        </div>

                                        {/* Check icon */}
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
