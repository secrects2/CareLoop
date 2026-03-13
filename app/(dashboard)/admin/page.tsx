'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'

interface Instructor {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    organization: string | null
    role: string
    is_active: boolean
    created_at: string
}

interface ActivityLog {
    id: string
    user_id: string
    action: string
    details: string | null
    target_type: string | null
    created_at: string
    profiles: { full_name: string; email: string } | null
}

export default function AdminPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [logsLoading, setLogsLoading] = useState(true)
    const [toggling, setToggling] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'instructors' | 'logs'>('instructors')

    const fetchInstructors = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('載入失敗: ' + error.message)
        } else {
            setInstructors(data || [])
        }
        setLoading(false)
    }

    const fetchLogs = async () => {
        setLogsLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*, profiles(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            toast.error('載入紀錄失敗: ' + error.message)
        } else {
            setLogs(data || [])
        }
        setLogsLoading(false)
    }

    useEffect(() => {
        fetchInstructors()
        fetchLogs()
    }, [])

    const toggleActive = async (id: string, name: string, currentStatus: boolean) => {
        setToggling(id)
        const supabase = createClient()
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (error) {
            toast.error('更新失敗: ' + error.message)
        } else {
            const action = currentStatus ? '停用帳號' : '啟用帳號'
            toast.success(currentStatus ? '已停用該帳號' : '已啟用該帳號')
            logActivity(action, `指導員: ${name}`, 'profile', id)
            fetchInstructors()
            fetchLogs()
        }
        setToggling(null)
    }

    const activeCount = instructors.filter(i => i.is_active).length
    const disabledCount = instructors.filter(i => !i.is_active).length

    const getActionIcon = (action: string) => {
        if (action.includes('新增')) return '➕'
        if (action.includes('刪除')) return '🗑'
        if (action.includes('匯出')) return '📥'
        if (action.includes('分析') || action.includes('AI')) return '🤖'
        if (action.includes('儲存')) return '💾'
        if (action.includes('停用')) return '🚫'
        if (action.includes('啟用')) return '✅'
        if (action.includes('登入')) return '🔑'
        return '📋'
    }

    const getActionColor = (action: string) => {
        if (action.includes('刪除') || action.includes('停用')) return 'text-red-400'
        if (action.includes('新增') || action.includes('啟用')) return 'text-emerald-400'
        if (action.includes('分析') || action.includes('AI')) return 'text-blue-400'
        if (action.includes('匯出')) return 'text-purple-400'
        return 'text-slate-300'
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMin = Math.floor(diffMs / 60000)
        const diffHr = Math.floor(diffMs / 3600000)
        const diffDay = Math.floor(diffMs / 86400000)

        if (diffMin < 1) return '剛剛'
        if (diffMin < 60) return `${diffMin} 分鐘前`
        if (diffHr < 24) return `${diffHr} 小時前`
        if (diffDay < 7) return `${diffDay} 天前`
        return date.toLocaleDateString('zh-TW')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">🔑 管理員控制台</h1>
                <p className="text-slate-400 text-sm mt-1">管理指導員帳號權限與查看操作紀錄</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-white">{instructors.length}</p>
                    <p className="text-xs text-slate-400">總帳號數</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
                    <p className="text-xs text-slate-400">啟用中</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{disabledCount}</p>
                    <p className="text-xs text-slate-400">已停用</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('instructors')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'instructors'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                >
                    👥 指導員管理
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'logs'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                >
                    📋 操作紀錄
                </button>
            </div>

            {/* Tab: Instructors */}
            {activeTab === 'instructors' && (
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">指導員列表</h2>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : instructors.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <p className="text-4xl mb-3">👥</p>
                            <p>尚無指導員帳號</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {instructors.map((instructor) => (
                                <div
                                    key={instructor.id}
                                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${instructor.is_active ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500/5 border border-red-500/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {instructor.avatar_url ? (
                                            <img src={instructor.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                                                {instructor.full_name?.[0] || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium">{instructor.full_name}</p>
                                                {instructor.role === 'admin' && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                        管理員
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${instructor.is_active
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {instructor.is_active ? '啟用中' : '已停用'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">{instructor.email}</p>
                                        </div>
                                    </div>

                                    {instructor.role !== 'admin' && (
                                        <button
                                            onClick={() => toggleActive(instructor.id, instructor.full_name, instructor.is_active)}
                                            disabled={toggling === instructor.id}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${instructor.is_active
                                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                                }`}
                                        >
                                            {toggling === instructor.id
                                                ? '處理中...'
                                                : instructor.is_active ? '🚫 停用' : '✅ 啟用'
                                            }
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Activity Logs */}
            {activeTab === 'logs' && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">操作紀錄</h2>
                        <button
                            onClick={fetchLogs}
                            className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                        >
                            🔄 重新整理
                        </button>
                    </div>

                    {logsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <p className="text-4xl mb-3">📭</p>
                            <p>尚無操作紀錄</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <span className="text-lg mt-0.5">{getActionIcon(log.action)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-xs text-slate-600">·</span>
                                            <span className="text-xs text-slate-500">
                                                {(log.profiles as any)?.full_name || '未知使用者'}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <p className="text-xs text-slate-500 mt-0.5 truncate">{log.details}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-600 whitespace-nowrap mt-1">
                                        {formatTime(log.created_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
