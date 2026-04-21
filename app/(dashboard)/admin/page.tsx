'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'
import { Search, Download, RefreshCw, Filter, ShieldCheck, ShieldOff, Crown } from 'lucide-react'
import { ROLE_LABELS, ROLE_BADGE_STYLES, isSuperAdmin, type UserRole } from '@/lib/rbac'

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

// 借印部門選項 (共用)
const DEPARTMENTS = [
    '西螺店',
    '虎尾店',
    '北斗店',
    '財會課',
    '文元店',
    '延平店',
]

export default function AdminPage() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [logsLoading, setLogsLoading] = useState(true)
    const [toggling, setToggling] = useState<string | null>(null)
    const [changingRole, setChangingRole] = useState<string | null>(null)
    const [changingDept, setChangingDept] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'instructors' | 'logs' | 'roles'>('instructors')

    // === 篩選狀態 ===
    const [filterUser, setFilterUser] = useState('')
    const [filterKeyword, setFilterKeyword] = useState('')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')

    // === 角色管理篩選 ===
    const [roleSearchKeyword, setRoleSearchKeyword] = useState('')
    const [roleFilterRole, setRoleFilterRole] = useState('')

    const fetchInstructors = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setCurrentUserId(user.id)
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            if (profile) {
                const role = profile.role as UserRole
                setCurrentUserRole(role)
                if (role !== 'super_admin') setActiveTab('roles')
            }
        }

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
            .limit(500)

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

    // === 啟用/停用帳號 ===
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

    // === 變更角色 ===
    const changeRole = async (id: string, name: string, currentRole: string, newRole: UserRole) => {
        if (id === currentUserId) {
            toast.error('無法修改自己的角色')
            return
        }
        // 允許指派任何角色（包含 super_admin）
        if (currentRole === newRole) return

        setChangingRole(id)
        const supabase = createClient()
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', id)

        if (error) {
            toast.error('角色變更失敗: ' + error.message)
        } else {
            const oldLabel = ROLE_LABELS[currentRole as UserRole] || currentRole
            const newLabel = ROLE_LABELS[newRole]
            toast.success(`已將 ${name} 角色從「${oldLabel}」變更為「${newLabel}」`)
            logActivity('變更角色', `${name}: ${oldLabel} → ${newLabel}`, 'profile', id)
            fetchInstructors()
            fetchLogs()
        }
        setChangingRole(null)
    }

    // === 變更部門 ===
    const changeDept = async (id: string, name: string, newDept: string) => {
        setChangingDept(id)
        const supabase = createClient()
        const { error } = await supabase
            .from('profiles')
            .update({ organization: newDept })
            .eq('id', id)

        if (error) {
            toast.error('更換部門失敗: ' + error.message)
        } else {
            toast.success(`已將 ${name} 指派至 ${newDept || '無部門'}`)
            logActivity('變更部門', `將 ${name} 歸屬至 ${newDept || '無部門'}`, 'profile', id)
            fetchInstructors()
        }
        setChangingDept(null)
    }

    const activeCount = instructors.filter(i => i.is_active).length
    const disabledCount = instructors.filter(i => !i.is_active).length
    const subAdminCount = instructors.filter(i => i.role === 'sub_admin').length

    // === 角色管理篩選後列表 ===
    const filteredRoleList = useMemo(() => {
        return instructors.filter(i => {
            if (roleFilterRole && i.role !== roleFilterRole) return false
            if (roleSearchKeyword) {
                const kw = roleSearchKeyword.toLowerCase()
                if (!i.full_name?.toLowerCase().includes(kw) && !i.email?.toLowerCase().includes(kw)) return false
            }
            return true
        })
    }, [instructors, roleSearchKeyword, roleFilterRole])

    // === 篩選後的紀錄 ===
    const uniqueUsers = useMemo(() => {
        const map = new Map<string, string>()
        logs.forEach(l => {
            const name = (l.profiles as any)?.full_name
            if (name && l.user_id) map.set(l.user_id, name)
        })
        return Array.from(map.entries()) // [user_id, name]
    }, [logs])

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // 人員篩選
            if (filterUser && log.user_id !== filterUser) return false
            // 關鍵字篩選
            if (filterKeyword) {
                const kw = filterKeyword.toLowerCase()
                const matchAction = log.action.toLowerCase().includes(kw)
                const matchDetails = log.details?.toLowerCase().includes(kw)
                const matchName = (log.profiles as any)?.full_name?.toLowerCase().includes(kw)
                if (!matchAction && !matchDetails && !matchName) return false
            }
            // 日期篩選
            if (filterDateFrom) {
                const logDate = new Date(log.created_at).toISOString().slice(0, 10)
                if (logDate < filterDateFrom) return false
            }
            if (filterDateTo) {
                const logDate = new Date(log.created_at).toISOString().slice(0, 10)
                if (logDate > filterDateTo) return false
            }
            return true
        })
    }, [logs, filterUser, filterKeyword, filterDateFrom, filterDateTo])

    const hasActiveFilters = filterUser || filterKeyword || filterDateFrom || filterDateTo

    // === CSV 匯出 ===
    const exportCSV = () => {
        if (filteredLogs.length === 0) {
            toast.error('無資料可匯出')
            return
        }
        const BOM = '\uFEFF'
        const header = ['時間', '操作人員', 'Email', '操作', '詳細資訊', '類型']
        const rows = filteredLogs.map(log => [
            new Date(log.created_at).toLocaleString('zh-TW'),
            (log.profiles as any)?.full_name || '未知',
            (log.profiles as any)?.email || '',
            log.action,
            (log.details || '').replace(/,/g, '，'),
            log.target_type || '',
        ])
        const csv = BOM + [header, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `操作紀錄_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`已匯出 ${filteredLogs.length} 筆紀錄`)
    }

    const getActionIcon = (action: string) => {
        if (action.includes('新增')) return '➕'
        if (action.includes('刪除')) return '🗑'
        if (action.includes('匯出')) return '📥'
        if (action.includes('分析') || action.includes('AI')) return '🤖'
        if (action.includes('儲存')) return '💾'
        if (action.includes('停用')) return '🚫'
        if (action.includes('啟用')) return '✅'
        if (action.includes('登入')) return '🔑'
        if (action.includes('角色')) return '🛡️'
        return '📋'
    }

    const getActionColor = (action: string) => {
        if (action.includes('刪除') || action.includes('停用')) return 'text-red-500'
        if (action.includes('新增') || action.includes('啟用')) return 'text-emerald-600'
        if (action.includes('分析') || action.includes('AI')) return 'text-blue-600'
        if (action.includes('匯出')) return 'text-purple-600'
        if (action.includes('角色')) return 'text-amber-600'
        return 'text-[#555]'
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

    /** 角色 Badge */
    const RoleBadge = ({ role }: { role: string }) => {
        const r = role as UserRole
        const style = ROLE_BADGE_STYLES[r] || 'bg-slate-100 text-slate-600 border-slate-200'
        const label = ROLE_LABELS[r] || role
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>
                {r === 'super_admin' && '👑 '}{label}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#333]">🔑 管理員控制台</h1>
                <p className="text-[#888] text-sm mt-1">管理指導員帳號、角色權限與操作紀錄</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-[#333]">{instructors.length}</p>
                    <p className="text-xs text-[#888]">總帳號數</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
                    <p className="text-xs text-[#888]">啟用中</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-red-500">{disabledCount}</p>
                    <p className="text-xs text-[#888]">已停用</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{subAdminCount}</p>
                    <p className="text-xs text-[#888]">子管理員</p>
                </div>
            </div>

            {/* Tabs */}
            {currentUserRole === 'super_admin' ? (
                <div className="flex gap-2 flex-wrap mb-6 p-1 bg-[#f5f5f5] rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('instructors')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'instructors'
                            ? 'bg-teal-500 text-white shadow-sm'
                            : 'bg-transparent text-[#888] hover:text-[#333]'
                            }`}
                    >
                        👥 帳號管理
                    </button>
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'roles'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-transparent text-[#888] hover:text-[#333]'
                            }`}
                    >
                        🛡️ 角色與部門管理
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'logs'
                            ? 'bg-teal-500 text-white shadow-sm'
                            : 'bg-transparent text-[#888] hover:text-[#333]'
                            }`}
                    >
                        📋 操作紀錄
                    </button>
                </div>
            ) : (
                <div className="flex gap-2 mb-6">
                    <h2 className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium shadow-sm">🏢 組織與成員管理</h2>
                </div>
            )}

            {/* ================================================================ */}
            {/* Tab: 帳號管理 (啟用/停用) */}
            {/* ================================================================ */}
            {activeTab === 'instructors' && (
                <div className="glass-card p-6">
                    <h2 className="section-title mb-4">帳號列表</h2>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : instructors.length === 0 ? (
                        <div className="text-center py-10 text-[#888]">
                            <p className="text-4xl mb-3">👥</p>
                            <p>尚無帳號</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {instructors.map((instructor) => (
                                <div
                                    key={instructor.id}
                                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${instructor.is_active ? 'bg-[#f5f5f5] hover:bg-[#f0f0f0]' : 'bg-red-50 border border-red-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {instructor.avatar_url ? (
                                            <img src={instructor.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
                                                {instructor.full_name?.[0] || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-[#333] font-medium">{instructor.full_name}</p>
                                                <RoleBadge role={instructor.role} />
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${instructor.is_active
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-red-100 text-red-600 border border-red-200'
                                                    }`}>
                                                    {instructor.is_active ? '啟用中' : '已停用'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#888]">{instructor.email}</p>
                                        </div>
                                    </div>

                                    {/* 不能停用 super_admin 和自己 */}
                                    {instructor.role !== 'super_admin' && instructor.id !== currentUserId && (
                                        <button
                                            onClick={() => toggleActive(instructor.id, instructor.full_name, instructor.is_active)}
                                            disabled={toggling === instructor.id}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${instructor.is_active
                                                ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'
                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
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

            {/* ================================================================ */}
            {/* Tab: 角色管理 */}
            {/* ================================================================ */}
            {activeTab === 'roles' && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title">角色管理</h2>
                        <div className="flex items-center gap-2 text-xs text-[#888]">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            共 {instructors.length} 位成員
                        </div>
                    </div>

                    {/* 角色統計卡 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {[
                            { role: 'super_admin', emoji: '👑', label: '最高管理員', border: 'border-rose-200', bg: 'bg-rose-50/50', text: 'text-rose-700' },
                            { role: 'sub_admin', emoji: '🛡️', label: '子管理員', border: 'border-amber-200', bg: 'bg-amber-50/50', text: 'text-amber-700' },
                            { role: 'instructor', emoji: '👤', label: '指導員', border: 'border-slate-200', bg: 'bg-slate-50/50', text: 'text-slate-600' },
                            { role: 'employee', emoji: '🏢', label: '惠生員工', border: 'border-sky-200', bg: 'bg-sky-50/50', text: 'text-sky-600' },
                        ].map(card => (
                            <button
                                key={card.role}
                                onClick={() => setRoleFilterRole(prev => prev === card.role ? '' : card.role)}
                                className={`rounded-xl border-2 ${card.border} ${card.bg} p-3 text-left transition-all ${roleFilterRole === card.role ? 'ring-2 ring-offset-1 ring-blue-400' : 'hover:opacity-80'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-base">{card.emoji}</span>
                                        <span className={`font-bold ${card.text} text-xs`}>{card.label}</span>
                                    </div>
                                    <span className={`text-lg font-bold ${card.text}`}>{instructors.filter(i => i.role === card.role).length}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* 搜尋 + 篩選 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
                            <input
                                type="text"
                                value={roleSearchKeyword}
                                onChange={e => setRoleSearchKeyword(e.target.value)}
                                placeholder="搜尋姓名或 Email..."
                                title="搜尋成員"
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#eee] text-[#333] text-sm focus:border-blue-500 focus:outline-none placeholder-[#aaa]"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={roleFilterRole}
                                onChange={e => setRoleFilterRole(e.target.value)}
                                title="篩選角色"
                                className="w-full px-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#eee] text-[#333] text-sm focus:border-blue-500 focus:outline-none appearance-none"
                            >
                                <option value="">全部角色</option>
                                <option value="super_admin">👑 最高管理員</option>
                                <option value="sub_admin">🛡️ 子管理員</option>
                                <option value="instructor">👤 指導員</option>
                                <option value="employee">🏢 惠生員工</option>
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa] pointer-events-none" />
                        </div>
                    </div>

                    <p className="text-xs text-[#aaa] mb-3">顯示 <strong className="text-[#333]">{filteredRoleList.length}</strong> / {instructors.length} 位成員</p>

                    {/* 成員列表 */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredRoleList.length === 0 ? (
                        <div className="text-center py-8 text-[#888]">
                            <p className="text-3xl mb-2">🔍</p>
                            <p className="text-sm">沒有符合條件的成員</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredRoleList.map((instructor) => {
                                const isCurrentUser = instructor.id === currentUserId
                                return (
                                    <div
                                        key={instructor.id}
                                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                                            instructor.role === 'super_admin'
                                                ? 'bg-rose-50/50 border border-rose-200'
                                                : instructor.role === 'sub_admin'
                                                    ? 'bg-amber-50/50 border border-amber-200'
                                                    : instructor.role === 'employee'
                                                        ? 'bg-sky-50/50 border border-sky-200'
                                                        : 'bg-[#f5f5f5] hover:bg-[#f0f0f0]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {instructor.avatar_url ? (
                                                <img src={instructor.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                                    instructor.role === 'super_admin' ? 'bg-rose-500' :
                                                    instructor.role === 'sub_admin' ? 'bg-amber-500' :
                                                    instructor.role === 'employee' ? 'bg-sky-500' : 'bg-teal-500'
                                                }`}>
                                                    {instructor.full_name?.[0] || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-[#333] font-medium">{instructor.full_name}</p>
                                                    <RoleBadge role={instructor.role} />
                                                    {isCurrentUser && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-600 border border-blue-200">本人</span>
                                                    )}
                                                    {!instructor.is_active && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">已停用</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#888]">{instructor.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 flex-wrap items-center">
                                            {/* 部門選擇下拉 */}
                                            <select
                                                value={instructor.organization || ''}
                                                onChange={e => changeDept(instructor.id, instructor.full_name, e.target.value)}
                                                disabled={changingDept === instructor.id}
                                                title={`設定 ${instructor.full_name} 的部門`}
                                                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50 cursor-pointer min-w-[120px] ${
                                                    changingDept === instructor.id ? 'animate-pulse' :
                                                    instructor.organization ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-[#f5f5f5] border-[#ddd] text-[#555]'
                                                }`}
                                            >
                                                <option value="">( 無部門 )</option>
                                                {DEPARTMENTS.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>

                                            {/* 角色選擇下拉 - 僅最高管理員 */}
                                            {currentUserRole === 'super_admin' && (
                                                !isCurrentUser ? (
                                                    <select
                                                        value={instructor.role}
                                                        onChange={e => changeRole(instructor.id, instructor.full_name, instructor.role, e.target.value as UserRole)}
                                                        disabled={changingRole === instructor.id}
                                                        title={`指派 ${instructor.full_name} 的角色`}
                                                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50 cursor-pointer min-w-[140px] ${
                                                            changingRole === instructor.id ? 'animate-pulse' :
                                                            instructor.role === 'super_admin' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                                            instructor.role === 'sub_admin' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                            instructor.role === 'employee' ? 'bg-sky-50 border-sky-200 text-sky-600' :
                                                            'bg-[#f5f5f5] border-[#ddd] text-[#555]'
                                                        }`}
                                                    >
                                                        <option value="super_admin">👑 最高管理員</option>
                                                        <option value="sub_admin">🛡️ 子管理員</option>
                                                        <option value="instructor">👤 指導員</option>
                                                        <option value="employee">🏢 惠生員工</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-xs text-[#aaa] italic whitespace-nowrap px-2">本人</span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ================================================================ */}
            {/* Tab: 操作紀錄 */}
            {/* ================================================================ */}
            {activeTab === 'logs' && (
                <div className="glass-card p-6 space-y-4">
                    {/* 篩選工具列 */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h2 className="section-title">操作紀錄</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchLogs}
                                    className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#333] transition-colors px-3 py-1.5 rounded-lg bg-[#f5f5f5] hover:bg-[#eee]"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    重新整理
                                </button>
                                <button
                                    onClick={exportCSV}
                                    className="flex items-center gap-1.5 text-xs text-white bg-teal-500 hover:bg-teal-600 transition-colors px-3 py-1.5 rounded-lg"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    匯出 CSV
                                </button>
                            </div>
                        </div>

                        {/* 篩選列 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {/* 人員篩選 */}
                            <div className="relative">
                                <select
                                    value={filterUser}
                                    onChange={e => setFilterUser(e.target.value)}
                                    title="篩選人員"
                                    className="w-full px-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#eee] text-[#333] text-sm focus:border-teal-500 focus:outline-none appearance-none"
                                >
                                    <option value="">全部人員</option>
                                    {uniqueUsers.map(([uid, name]) => (
                                        <option key={uid} value={uid}>{name}</option>
                                    ))}
                                </select>
                                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa] pointer-events-none" />
                            </div>

                            {/* 起始日期 */}
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={e => setFilterDateFrom(e.target.value)}
                                title="起始日期"
                                className="w-full px-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#eee] text-[#333] text-sm focus:border-teal-500 focus:outline-none"
                                placeholder="起始日期"
                            />

                            {/* 結束日期 */}
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={e => setFilterDateTo(e.target.value)}
                                title="結束日期"
                                className="w-full px-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#eee] text-[#333] text-sm focus:border-teal-500 focus:outline-none"
                                placeholder="結束日期"
                            />

                            {/* 關鍵字搜尋 */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
                                <input
                                    type="text"
                                    value={filterKeyword}
                                    onChange={e => setFilterKeyword(e.target.value)}
                                    placeholder="搜尋關鍵字..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#eee] text-[#333] text-sm focus:border-teal-500 focus:outline-none placeholder-[#aaa]"
                                />
                            </div>
                        </div>

                        {/* 篩選結果提示 */}
                        {hasActiveFilters && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[#888]">
                                    篩選結果：<strong className="text-[#333]">{filteredLogs.length}</strong> 筆（共 {logs.length} 筆）
                                </span>
                                <button
                                    onClick={() => { setFilterUser(''); setFilterKeyword(''); setFilterDateFrom(''); setFilterDateTo('') }}
                                    className="text-teal-600 hover:underline"
                                >
                                    清除篩選
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 紀錄列表 */}
                    {logsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-10 text-[#888]">
                            <p className="text-4xl mb-3">📭</p>
                            <p>{hasActiveFilters ? '無符合條件的紀錄' : '尚無操作紀錄'}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f5f5f5] transition-colors"
                                >
                                    <span className="text-lg mt-0.5">{getActionIcon(log.action)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-xs text-[#ccc]">·</span>
                                            <span className="text-xs text-[#888]">
                                                {(log.profiles as any)?.full_name || '未知使用者'}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <p className="text-xs text-[#999] mt-0.5 truncate">{log.details}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-[#aaa] whitespace-nowrap mt-1">
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
