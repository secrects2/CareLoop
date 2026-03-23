'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
    Plus, Search, Eye, Pencil, Trash2, Download, CalendarCheck,
    MapPin, Clock, Users, ChevronLeft, ChevronRight
} from 'lucide-react'

interface Event {
    id: string
    title: string
    event_date: string
    event_time: string
    location: string
    is_active: boolean
    created_at: string
    checkin_count: number
}

interface CheckinRecord {
    id: string
    display_name: string
    picture_url: string | null
    checked_in_at: string
    line_user_id: string
}

export default function EventsListPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const router = useRouter()

    const fetchEvents = useCallback(async () => {
        const supabase = createClient()
        const { data: eventsData, error } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: false })

        if (error) {
            toast.error('載入活動失敗')
            setLoading(false)
            return
        }

        // Get checkin counts for each event
        const eventsWithCounts = await Promise.all(
            (eventsData || []).map(async (event) => {
                const { count } = await supabase
                    .from('event_checkins')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id)
                return { ...event, checkin_count: count || 0 }
            })
        )

        setEvents(eventsWithCounts)
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    const handleDelete = async (id: string) => {
        const supabase = createClient()
        const { error } = await supabase.from('events').delete().eq('id', id)
        if (error) {
            toast.error('刪除失敗：' + error.message)
            return
        }
        toast.success('活動已刪除')
        setDeleteConfirm(null)
        fetchEvents()
    }

    const handleExportExcel = async (event: Event) => {
        const supabase = createClient()
        const { data: checkins, error } = await supabase
            .from('event_checkins')
            .select('*')
            .eq('event_id', event.id)
            .order('checked_in_at', { ascending: true })

        if (error) {
            toast.error('匯出失敗')
            return
        }

        const rows = (checkins || []).map((c: CheckinRecord, idx: number) => ({
            '序號': idx + 1,
            'LINE 名稱': c.display_name,
            'LINE User ID': c.line_user_id,
            '報到時間': new Date(c.checked_in_at).toLocaleString('zh-TW'),
        }))

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '簽到名單')

        // Column widths
        ws['!cols'] = [
            { wch: 6 },
            { wch: 20 },
            { wch: 36 },
            { wch: 22 },
        ]

        XLSX.writeFile(wb, `${event.title}_簽到名單_${event.event_date}.xlsx`)
        toast.success('Excel 匯出成功')
    }

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase())
    )

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-TW', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        })
    }

    const formatTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':')
        return `${h}:${m}`
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--gradient-primary)' }}>
                            <CalendarCheck className="w-5 h-5" />
                        </div>
                        活動簽到管理
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">管理活動、查看報到紀錄與匯出資料</p>
                </div>
                <Link
                    href="/events/create"
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary-500/20"
                    style={{ background: 'var(--gradient-primary)' }}
                >
                    <Plus className="w-4 h-4" />
                    建立活動
                </Link>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="搜尋活動名稱或地點..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20">
                    <CalendarCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">
                        {search ? '找不到符合的活動' : '尚未建立任何活動'}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">
                        {search ? '請嘗試其他關鍵字' : '點擊「建立活動」開始使用簽到功能'}
                    </p>
                    {!search && (
                        <Link
                            href="/events/create"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            <Plus className="w-4 h-4" />
                            建立第一個活動
                        </Link>
                    )}
                </div>
            ) : (
                /* Events grid */
                <div className="grid gap-4">
                    {filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all group"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                {/* Event info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-base font-semibold text-slate-800 truncate">
                                            {event.title}
                                        </h3>
                                        {!event.is_active && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">
                                                已停用
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarCheck className="w-3.5 h-3.5" />
                                            {formatDate(event.event_date)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatTime(event.event_time)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {event.location}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-primary-600 font-medium">
                                            <Users className="w-3.5 h-3.5" />
                                            {event.checkin_count} 人報到
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleExportExcel(event)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                        title="匯出 Excel"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <Link
                                        href={`/events/${event.id}`}
                                        className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                        title="查看活動"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href={`/events/${event.id}/edit`}
                                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                        title="編輯活動"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => setDeleteConfirm(event.id)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="刪除活動"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Delete confirmation */}
                            {deleteConfirm === event.id && (
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <p className="text-sm text-red-600">
                                        確定要刪除「{event.title}」？此操作無法復原，相關報到紀錄也會一併刪除。
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="px-3 py-1.5 rounded-lg text-xs text-white bg-red-500 hover:bg-red-600 transition-colors"
                                        >
                                            確定刪除
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
