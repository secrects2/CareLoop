'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import * as XLSX from 'xlsx'
import {
    ArrowLeft, MapPin, Clock, CalendarCheck, Users, Download,
    Pencil, QrCode, Loader2, Users2, ScanLine
} from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'

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
    checkin_method: string | null
    device_info: string | null
}

const CHECKIN_LIFF_ID = process.env.NEXT_PUBLIC_CHECKIN_LIFF_ID || ''

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [event, setEvent] = useState<EventData | null>(null)
    const [checkins, setCheckins] = useState<CheckinRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [showScanner, setShowScanner] = useState(false)
    const [scanning, setScanning] = useState(false)

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



    // Real-time clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

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

        // Polling fallback
        const pollInterval = setInterval(() => {
            const poll = async () => {
                const { data } = await supabase
                    .from('event_checkins')
                    .select('*')
                    .eq('event_id', id)
                    .order('checked_in_at', { ascending: false })
                if (data) {
                    setCheckins(prev => {
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

    const handleExportExcel = async () => {
        if (!event) return
        const supabase = createClient()

        const elderPrefixIds = checkins
            .filter(c => c.line_user_id.startsWith('elder_'))
            .map(c => c.line_user_id.replace('elder_', ''))

        const lineUserIds = checkins
            .filter(c => !c.line_user_id.startsWith('elder_'))
            .map(c => c.line_user_id)

        let eldersMap: Record<string, any> = {}

        if (elderPrefixIds.length > 0) {
            const { data } = await supabase
                .from('elders')
                .select('id, name, id_number, birth_date, gender, education_level, phone')
                .in('id', elderPrefixIds)
            if (data) data.forEach(e => { eldersMap[`elder_${e.id}`] = e })
        }

        if (lineUserIds.length > 0) {
            const { data } = await supabase
                .from('elders')
                .select('line_user_id, name, id_number, birth_date, gender, education_level, phone')
                .in('line_user_id', lineUserIds)
            if (data) data.forEach(e => { if (e.line_user_id) eldersMap[e.line_user_id] = e })
        }

        const calcAge = (birthDate: string | null) => {
            if (!birthDate) return ''
            const birth = new Date(birthDate)
            const today = new Date()
            let age = today.getFullYear() - birth.getFullYear()
            if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
            return age
        }

        const excelMethodLabel = (m: string | null, lineUserId: string) => {
            if (m === 'line') return 'LINE 本人簽到'
            if (m === 'qr_proxy') return 'QR Code 代簽'
            if (m === 'offline') return '離線補登'
            return lineUserId.startsWith('elder_') ? 'QR Code 代簽' : 'LINE 簽到'
        }

        const parseDevice = (ua: string | null) => {
            if (!ua) return ''
            if (/iPhone/.test(ua)) return 'iPhone'
            if (/iPad/.test(ua)) return 'iPad'
            if (/Android/.test(ua)) return 'Android'
            if (/Windows/.test(ua)) return 'Windows 電腦'
            if (/Mac/.test(ua)) return 'Mac 電腦'
            return '其他裝置'
        }

        const rows = checkins.map((c, idx) => {
            const elderData = eldersMap[c.line_user_id] || null
            return {
                '序號': idx + 1,
                '姓名': elderData?.name || c.display_name.replace('（代簽）', '').replace('（離線補登）', ''),
                '身分證字號': elderData?.id_number || '',
                '出生年月日': elderData?.birth_date || '',
                '年齡': elderData ? calcAge(elderData.birth_date) : '',
                '性別': elderData ? (elderData.gender === 'female' ? '女' : '男') : '',
                '教育程度': elderData?.education_level || '',
                '通訊電話': elderData?.phone || '',
                '報到時間': new Date(c.checked_in_at).toLocaleString('zh-TW'),
                '簽到方式': excelMethodLabel(c.checkin_method, c.line_user_id),
                '簽到裝置': parseDevice(c.device_info),
            }
        })

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '簽到名單')
        ws['!cols'] = [
            { wch: 5 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 5 },
            { wch: 5 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 12 },
        ]
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

    const handleScanQrCode = async (result: any) => {
        if (scanning) return;
        const rawValue = Array.isArray(result) ? result[0].rawValue : result.rawValue || result;
        if (!rawValue) return;

        if (typeof rawValue === 'string' && rawValue.includes('/elder-checkin/')) {
            const elderId = rawValue.split('/elder-checkin/')[1];
            if (elderId) {
                setScanning(true);
                setShowScanner(false);
                
                if (!navigator.onLine) {
                    import('@/lib/offline-sync').then(({ saveOfflineRecord }) => {
                        saveOfflineRecord('checkin', {
                            eventId: id,
                            elderId,
                            deviceInfo: navigator.userAgent
                        })
                        toast.success('📡 無網路連線，已本機暫存簽到紀錄', {
                            duration: 5000,
                            icon: '📦',
                            style: { background: '#059669', color: '#fff' }
                        })
                    })
                    setTimeout(() => setScanning(false), 2000);
                    return;
                }

                const toastId = toast.loading('掃描成功，正在簽到...');

                try {
                    const supabase = createClient();
                    const { data: elderData, error: elderError } = await supabase
                        .from('elders')
                        .select('name')
                        .eq('id', elderId)
                        .single();

                    if (elderError || !elderData) throw new Error('找不到該長輩資料');

                    const res = await fetch('/api/events/checkin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventId: id,
                            lineUserId: 'elder_' + elderId,
                            displayName: elderData.name,
                            pictureUrl: null,
                            checkinMethod: 'qr_proxy',
                            deviceInfo: navigator.userAgent || null,
                        })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || '簽到失敗');

                    if (data.alreadyCheckedIn) {
                        toast.success(`${elderData.name} 已經簽到過了`, { id: toastId });
                    } else {
                        toast.success(`${elderData.name} 簽到成功！`, { id: toastId, icon: '🎉' });
                    }
                } catch (err: any) {
                    if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
                        toast.dismiss(toastId);
                        import('@/lib/offline-sync').then(({ saveOfflineRecord }) => {
                            saveOfflineRecord('checkin', {
                                eventId: id,
                                elderId,
                                deviceInfo: navigator.userAgent
                            })
                            toast.success('📡 網路突然中斷，已轉為本機暫存', {
                                duration: 5000,
                                icon: '📦'
                            })
                        })
                    } else {
                        toast.error(err.message, { id: toastId });
                    }
                } finally {
                    setTimeout(() => setScanning(false), 2000);
                }
            }
        } else {
            toast.error('無法辨識的 QR Code', { icon: '❌' });
            setShowScanner(false);
        }
    }

    const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://careloop-2026.vercel.app'
    const qrUrl = `${appOrigin}/checkin/${id}`

    const methodTag = (m: string | null, lineUserId: string) => {
        if (m === 'line') return { label: 'LINE', color: 'bg-emerald-100 text-emerald-700' }
        if (m === 'qr_proxy') return { label: '代簽', color: 'bg-violet-100 text-violet-700' }
        if (m === 'offline') return { label: '離線', color: 'bg-amber-100 text-amber-700' }
        return lineUserId.startsWith('elder_')
            ? { label: '代簽', color: 'bg-violet-100 text-violet-700' }
            : { label: 'LINE', color: 'bg-emerald-100 text-emerald-700' }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    if (!event) return null

    return (
        <div className="max-w-3xl mx-auto pb-8">
            {/* ── iOS-style Header ── */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/events')}
                    className="flex items-center gap-1.5 text-sm text-primary-600 font-medium mb-4 hover:opacity-80 transition-opacity"
                >
                    <ArrowLeft className="w-4 h-4" />
                    活動列表
                </button>
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        {formatDate(event.event_date)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(event.event_time)}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                    </span>
                </div>
            </div>

            {/* ── Action Chips (iOS-style horizontal scroll) ── */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
                <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0 shadow-sm">
                    <Download className="w-3.5 h-3.5" /> 匯出 Excel
                </button>
                <button
                    onClick={async () => {
                        const t = toast.loading('同步中...')
                        try {
                            const res = await fetch('/api/events/checkin/sync-elders', { method: 'POST' })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error)
                            toast.success(data.message || `已同步 ${data.synced} 位`, { id: t })
                        } catch (err: any) { toast.error('同步失敗: ' + err.message, { id: t }) }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0 shadow-sm"
                >
                    <Users2 className="w-3.5 h-3.5" /> 同步長輩
                </button>
                <button onClick={() => router.push(`/events/${id}/edit`)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0 shadow-sm">
                    <Pencil className="w-3.5 h-3.5" /> 編輯
                </button>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-500/20">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">已報到</span>
                        <Users className="w-4 h-4 opacity-60" />
                    </div>
                    <p className="text-4xl font-extrabold tracking-tight">{checkins.length}</p>
                    <p className="text-[11px] opacity-70 mt-0.5">位參加者</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">目前時間</span>
                        <Clock className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 font-mono tracking-tight">
                        {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        {currentTime.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </p>
                </div>
            </div>

            {/* ── QR Code Card ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">活動 QR Code</h3>
                            <p className="text-[11px] text-slate-400">長輩掃碼即可 LINE 簽到</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowScanner(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 text-white text-[12px] font-bold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20"
                    >
                        <ScanLine className="w-3.5 h-3.5" />
                        掃描長輩
                    </button>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl flex items-center justify-center">
                    <QRCodeSVG
                        value={qrUrl}
                        size={180}
                        level="H"
                        includeMargin
                        bgColor="#f8fafc"
                        fgColor="#0f172a"
                    />
                </div>
            </div>



            {/* ── Checkin List (iOS-style) ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-slate-800">報到名單</h3>
                    <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-500">
                        即時更新 · {checkins.length} 人
                    </span>
                </div>

                {checkins.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-7 h-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">尚無人報到</p>
                        <p className="text-[12px] text-slate-400 mt-1">等待人員掃描 QR Code 簽到中...</p>
                    </div>
                ) : (
                    <div>
                        {checkins.map((checkin, idx) => {
                            const rank = checkins.length - idx
                            const tag = methodTag(checkin.checkin_method, checkin.line_user_id)
                            const isRecent = idx === 0

                            return (
                                <div
                                    key={checkin.id}
                                    className={`flex items-center gap-3.5 px-5 py-3.5 border-b border-slate-50 last:border-b-0 transition-all ${isRecent ? 'bg-teal-50/60' : 'hover:bg-slate-50/60'}`}
                                >
                                    {/* Rank */}
                                    <span className="text-[13px] font-bold text-slate-400 w-7 text-right shrink-0">
                                        #{rank}
                                    </span>

                                    {/* Avatar */}
                                    {checkin.picture_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={checkin.picture_url}
                                            alt={checkin.display_name}
                                            className="w-11 h-11 rounded-[14px] object-cover shrink-0 border-2 border-white shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                                            {checkin.display_name[0]}
                                        </div>
                                    )}

                                    {/* Name + Tag + Time */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-semibold text-slate-800 truncate">
                                                {checkin.display_name.replace('（代簽）', '').replace('（離線補登）', '')}
                                            </p>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tag.color} shrink-0`}>
                                                {tag.label}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {new Date(checkin.checked_in_at).toLocaleTimeString('zh-TW', { hour12: false })} 報到
                                        </p>
                                    </div>

                                    {/* Check badge */}
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isRecent ? 'bg-teal-500 text-white' : 'bg-emerald-100 text-emerald-500'}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Scanner Modal (iOS bottom sheet style) ── */}
            {showScanner && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-4 flex items-center justify-between">
                            <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                                <ScanLine className="w-5 h-5 text-primary-600" />
                                掃描長輩 QR Code
                            </h3>
                            <button
                                onClick={() => setShowScanner(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="aspect-square bg-slate-900 relative">
                            <Scanner
                                onScan={handleScanQrCode}
                                formats={['qr_code']}
                                styles={{ container: { width: '100%', height: '100%' } }}
                            />
                        </div>
                        <div className="p-5 text-center bg-slate-50">
                            <p className="text-[13px] font-medium text-slate-600">將長輩的 QR Code 對準鏡頭</p>
                            <p className="text-[11px] text-slate-400 mt-1">掃描成功後自動完成報到</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
