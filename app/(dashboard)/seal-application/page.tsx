'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'
import { Upload, X, FileText, Send, Save, Clock, CheckCircle2, AlertCircle, Trash2, Download, RefreshCw, Search, Filter } from 'lucide-react'
import { type UserRole } from '@/lib/rbac'

// 印章類型選項
const SEAL_TYPES = [
    '公司大章(登記設立)',
    '負責人小章(登記設立)',
    '公司大章(一般便章)',
    '負責人小章(一般便章)',
    '發票章',
    '銀行印鑑章',
    '其他',
]

// 借印部門選項
const DEPARTMENTS = [
    '西螺店',
    '虎尾店',
    '北斗店',
    '財會課',
    '文元店',
    '延平店',
]

interface SealApplication {
    id: string
    applicant_id: string
    department: string
    applicant_name: string
    borrow_date: string
    seal_type: string
    purpose: string
    file_urls: string[]
    return_date: string
    status: string
    reviewer_comment: string | null
    created_at: string
    updated_at: string
}

export default function SealApplicationPage() {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [applications, setApplications] = useState<SealApplication[]>([])
    const [allApplications, setAllApplications] = useState<SealApplication[]>([])
    const [activeView, setActiveView] = useState<'form' | 'list' | 'manage'>('form')
    const [userRole, setUserRole] = useState<UserRole>('employee')
    const [userName, setUserName] = useState('')
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 管理頁篩選
    const [searchKeyword, setSearchKeyword] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    // 表單狀態
    const [form, setForm] = useState({
        department: '',
        applicant_name: '',
        borrow_date: new Date().toISOString().slice(0, 10),
        seal_type: '',
        purpose: '',
        return_date: '',
    })

    const isManager = userRole === 'sub_admin' || userRole === 'super_admin'

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, organization, role')
                .eq('id', user.id)
                .single()

            if (profile) {
                setUserName(profile.full_name || '')
                setUserRole((profile.role || 'employee') as UserRole)
                setForm(f => ({
                    ...f,
                    applicant_name: profile.full_name || '',
                    department: profile.organization || '',
                }))
                // sub_admin 預設顯示管理頁
                if (profile.role === 'sub_admin' || profile.role === 'super_admin') {
                    setActiveView('manage')
                }
            }

            await fetchApplications()
            setLoading(false)
        }
        init()
    }, [])

    const fetchApplications = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 取得自己的申請
        const { data: myApps } = await supabase
            .from('seal_applications')
            .select('*')
            .eq('applicant_id', user.id)
            .order('created_at', { ascending: false })
        setApplications(myApps || [])

        // sub_admin 取得所有申請
        const { data: allApps } = await supabase
            .from('seal_applications')
            .select('*')
            .order('created_at', { ascending: false })
        setAllApplications(allApps || [])
    }

    // === 管理頁篩選 ===
    const filteredManageApps = useMemo(() => {
        return allApplications.filter(app => {
            if (filterStatus && app.status !== filterStatus) return false
            if (searchKeyword) {
                const kw = searchKeyword.toLowerCase()
                const match = app.applicant_name.toLowerCase().includes(kw)
                    || app.department.toLowerCase().includes(kw)
                    || app.purpose.toLowerCase().includes(kw)
                    || app.seal_type.toLowerCase().includes(kw)
                if (!match) return false
            }
            return true
        })
    }, [allApplications, filterStatus, searchKeyword])

    // === Excel 匯出 ===
    const exportExcel = () => {
        if (filteredManageApps.length === 0) {
            toast.error('無資料可匯出')
            return
        }
        const BOM = '\uFEFF'
        const header = ['實例標題', '借印部門', '借印人', '借印日期', '用印事宜', '歸還日期', '用印文件', '印章類型', '狀態', '建立時間']
        const rows = filteredManageApps.map(app => [
            `${app.applicant_name}發起的用印申請`,
            app.department,
            app.applicant_name,
            app.borrow_date,
            app.purpose.replace(/,/g, '，').replace(/\n/g, ' '),
            app.return_date,
            (app.file_urls || []).length > 0 ? app.file_urls.join(' | ') : '--',
            app.seal_type,
            getStatusLabel(app.status),
            new Date(app.created_at).toLocaleString('zh-TW'),
        ])
        const csv = BOM + [header, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `用印申請數據_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`已匯出 ${filteredManageApps.length} 筆紀錄`)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return
        setUploadedFiles(prev => [...prev, ...Array.from(files)])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items
        const files: File[] = []
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile()
                if (file) files.push(file)
            }
        }
        if (files.length > 0) {
            setUploadedFiles(prev => [...prev, ...files])
            toast.success(`已貼上 ${files.length} 個檔案`)
        }
    }

    const uploadFiles = async (): Promise<string[]> => {
        if (uploadedFiles.length === 0) return []
        const supabase = createClient()
        const urls: string[] = []
        for (const file of uploadedFiles) {
            const ext = file.name.split('.').pop() || 'file'
            const path = `seal-files/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
            const { error } = await supabase.storage.from('seal-files').upload(path, file)
            if (error) {
                console.error('Upload error:', error)
                toast.error('檔案上傳失敗（請確認 storage bucket 已建立）')
                continue
            }
            const { data: urlData } = supabase.storage.from('seal-files').getPublicUrl(path)
            if (urlData) urls.push(urlData.publicUrl)
        }
        return urls
    }

    const handleSubmit = async (status: 'submitted' | 'draft') => {
        if (status === 'submitted') {
            if (!form.department || !form.applicant_name || !form.borrow_date || !form.seal_type || !form.purpose || !form.return_date) {
                toast.error('請填寫所有必填欄位')
                return
            }
            if (new Date(form.return_date) < new Date(form.borrow_date)) {
                toast.error('歸還日期不能早於借印日期')
                return
            }
        }

        setSubmitting(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { toast.error('未登入'); return }

            const fileUrls = await uploadFiles()
            const { error } = await supabase.from('seal_applications').insert({
                applicant_id: user.id,
                department: form.department,
                applicant_name: form.applicant_name,
                borrow_date: form.borrow_date,
                seal_type: form.seal_type,
                purpose: form.purpose,
                file_urls: fileUrls,
                return_date: form.return_date || form.borrow_date,
                status,
            })

            if (error) {
                toast.error('提交失敗: ' + error.message)
            } else {
                toast.success(status === 'submitted' ? '申請已提交' : '已暫存')
                logActivity(status === 'submitted' ? '提交用印申請' : '暫存用印申請', `印章類型: ${form.seal_type}，事宜: ${form.purpose}`, 'seal_application')
                setForm(f => ({ ...f, seal_type: '', purpose: '', return_date: '', borrow_date: new Date().toISOString().slice(0, 10) }))
                setUploadedFiles([])
                fetchApplications()
                if (status === 'submitted') setActiveView('list')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const deleteApplication = async (id: string) => {
        if (!confirm('確定要刪除此草稿？')) return
        const supabase = createClient()
        const { error } = await supabase.from('seal_applications').delete().eq('id', id)
        if (error) { toast.error('刪除失敗: ' + error.message) }
        else { toast.success('已刪除'); fetchApplications() }
    }

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = { draft: '草稿', submitted: '待審核', approved: '已核准', rejected: '已駁回', returned: '已歸還' }
        return map[status] || status
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: any }> = {
            draft: { bg: 'bg-slate-100', text: 'text-slate-600', icon: FileText },
            submitted: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
            approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
            rejected: { bg: 'bg-red-100', text: 'text-red-600', icon: AlertCircle },
            returned: { bg: 'bg-blue-100', text: 'text-blue-600', icon: CheckCircle2 },
        }
        const s = styles[status] || styles.draft
        const Icon = s.icon
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text} border`}>
                <Icon className="w-3 h-3" />
                {getStatusLabel(status)}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
                <div className="glass-card p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#333]">📋 用印申請{isManager ? '・數據管理' : ''}</h1>
                <p className="text-[#888] text-sm mt-1">
                    {isManager ? '管理所有用印申請紀錄，支援匯出 Excel' : '請填寫申請表，提交後由印鑑保管人審核'}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {/* sub_admin 專屬：數據管理 */}
                {isManager && (
                    <button
                        onClick={() => setActiveView('manage')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeView === 'manage'
                            ? 'bg-blue-500 text-white'
                            : 'bg-[#f5f5f5] text-[#888] hover:bg-[#eee]'
                        }`}
                    >
                        📊 數據管理
                    </button>
                )}
                <button
                    onClick={() => setActiveView('form')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeView === 'form'
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#f5f5f5] text-[#888] hover:bg-[#eee]'
                    }`}
                >
                    ✏️ 新增申請
                </button>
                <button
                    onClick={() => setActiveView('list')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeView === 'list'
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#f5f5f5] text-[#888] hover:bg-[#eee]'
                    }`}
                >
                    📃 我的申請 {applications.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/30">{applications.length}</span>
                    )}
                </button>
            </div>

            {/* ================================================================ */}
            {/* 數據管理（sub_admin 專屬） */}
            {/* ================================================================ */}
            {activeView === 'manage' && isManager && (
                <div className="glass-card p-6 space-y-4">
                    {/* 工具列 */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h2 className="section-title">用印申請・數據管理</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchApplications}
                                    className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#333] transition-colors px-3 py-1.5 rounded-lg bg-[#f5f5f5] hover:bg-[#eee]"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    刷新
                                </button>
                                <button
                                    onClick={exportExcel}
                                    className="flex items-center gap-1.5 text-xs text-white bg-emerald-500 hover:bg-emerald-600 transition-colors px-3 py-1.5 rounded-lg"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    匯出 Excel
                                </button>
                            </div>
                        </div>

                        {/* 篩選列 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
                                <input
                                    type="text"
                                    value={searchKeyword}
                                    onChange={e => setSearchKeyword(e.target.value)}
                                    placeholder="搜尋借印人、部門、事宜..."
                                    title="搜尋關鍵字"
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#eee] text-[#333] text-sm focus:border-blue-500 focus:outline-none placeholder-[#aaa]"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    title="篩選狀態"
                                    className="w-full px-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#eee] text-[#333] text-sm focus:border-blue-500 focus:outline-none appearance-none"
                                >
                                    <option value="">全部狀態</option>
                                    <option value="draft">草稿</option>
                                    <option value="submitted">待審核</option>
                                    <option value="approved">已核准</option>
                                    <option value="rejected">已駁回</option>
                                    <option value="returned">已歸還</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa] pointer-events-none" />
                            </div>
                        </div>

                        <p className="text-xs text-[#aaa]">共 <strong className="text-[#333]">{filteredManageApps.length}</strong> 筆（全部 {allApplications.length} 筆）</p>
                    </div>

                    {/* 表格 */}
                    {filteredManageApps.length === 0 ? (
                        <div className="text-center py-10 text-[#888]">
                            <p className="text-4xl mb-3">📭</p>
                            <p>無符合條件的申請紀錄</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-6">
                            <table className="w-full text-sm min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-[#eee]">
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">實例標題</th>
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">借印部門</th>
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">借印人</th>
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">借印日期</th>
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">用印事宜</th>
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">歸還日期</th>
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">用印文件</th>
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">印章類型</th>
                                        <th className="text-left px-4 py-3 text-[#888] font-medium text-xs">狀態</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredManageApps.map(app => (
                                        <tr key={app.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                                            <td className="px-4 py-3 text-blue-600 text-xs max-w-[180px] truncate">
                                                {app.applicant_name}發起的用印申請
                                            </td>
                                            <td className="px-4 py-3 text-[#333] text-xs">{app.department}</td>
                                            <td className="px-4 py-3 text-[#333] text-xs">{app.applicant_name}</td>
                                            <td className="px-4 py-3 text-[#333] text-xs whitespace-nowrap">{app.borrow_date}</td>
                                            <td className="px-4 py-3 text-[#555] text-xs max-w-[200px]">
                                                <p className="line-clamp-2">{app.purpose}</p>
                                            </td>
                                            <td className="px-4 py-3 text-[#333] text-xs whitespace-nowrap">{app.return_date}</td>
                                            <td className="px-4 py-3 text-xs">
                                                {(app.file_urls || []).length > 0 ? (
                                                    <div className="flex gap-1">
                                                        {app.file_urls.map((url, i) => {
                                                            const isPdf = url.toLowerCase().endsWith('.pdf')
                                                            return isPdf ? (
                                                                <a
                                                                    key={i}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-2 py-1 rounded bg-red-100 text-red-600 text-[10px] font-bold hover:bg-red-200 transition-colors"
                                                                >
                                                                    PDF
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    key={i}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="w-8 h-8 rounded bg-slate-100 overflow-hidden inline-block hover:opacity-80 transition-opacity"
                                                                >
                                                                    <img src={url} alt={`文件${i + 1}`} className="w-full h-full object-cover" />
                                                                </a>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-[#ccc]">--</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className="whitespace-nowrap">{app.seal_type}</span>
                                            </td>
                                            <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ================================================================ */}
            {/* 新增申請表單 */}
            {/* ================================================================ */}
            {activeView === 'form' && (
                <div className="glass-card p-6" onPaste={handlePaste}>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-orange-800">
                            <span className="text-orange-600 font-bold">▶</span>{' '}
                            請各位同仁要使用印鑑前先填寫此張申請表，填寫完畢送出後請選擇【簽核主管】進行審核。
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* 借印部門 */}
                        <div>
                            <label htmlFor="seal-department" className="block text-sm font-bold text-orange-600 mb-1.5">
                                借印部門 <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="seal-department"
                                title="選擇借印部門"
                                value={form.department}
                                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border border-[#eee] text-[#333] text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all appearance-none"
                            >
                                <option value="">請選擇</option>
                                {DEPARTMENTS.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        {/* 借印人 */}
                        <div>
                            <label htmlFor="seal-applicant" className="block text-sm font-bold text-orange-600 mb-1.5">
                                借印人 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="seal-applicant"
                                type="text"
                                value={form.applicant_name}
                                onChange={e => setForm(f => ({ ...f, applicant_name: e.target.value }))}
                                placeholder="請輸入姓名"
                                className="w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border border-[#eee] text-[#333] text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                            />
                        </div>

                        {/* 借印日期 */}
                        <div>
                            <label htmlFor="seal-borrow-date" className="block text-sm font-bold text-orange-600 mb-1.5">
                                借印日期 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="seal-borrow-date"
                                type="date"
                                title="借印日期"
                                value={form.borrow_date}
                                onChange={e => setForm(f => ({ ...f, borrow_date: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border border-[#eee] text-[#333] text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                            />
                        </div>

                        {/* 印章類型 */}
                        <div>
                            <label htmlFor="seal-type" className="block text-sm font-bold text-orange-600 mb-1.5">
                                印章類型 <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="seal-type"
                                title="選擇印章類型"
                                value={form.seal_type}
                                onChange={e => setForm(f => ({ ...f, seal_type: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border border-[#eee] text-[#333] text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all appearance-none"
                            >
                                <option value="">請選擇</option>
                                {SEAL_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* 用印事宜 */}
                        <div>
                            <label htmlFor="seal-purpose" className="block text-sm font-bold text-orange-600 mb-1.5">
                                用印事宜 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="seal-purpose"
                                value={form.purpose}
                                onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                                placeholder="請輸入用印事由"
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border border-[#eee] text-[#333] text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                            />
                        </div>

                        {/* 用印文件上傳 */}
                        <div>
                            <label className="block text-sm font-bold text-[#555] mb-1.5">
                                用印文件（拍照或電子檔）
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={handleFileSelect}
                                className="hidden"
                                aria-label="選擇要上傳的文件"
                            />
                            <div
                                className="border-2 border-dashed border-[#ccc] rounded-xl p-4 bg-[#fafafa] hover:border-orange-300 hover:bg-orange-50/30 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                aria-label="上傳用印文件"
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                            >
                                <div className="flex items-center gap-3 text-sm text-[#888]">
                                    <Upload className="w-5 h-5 text-[#aaa]" />
                                    <span>上傳文件</span>
                                    <span className="text-xs text-[#bbb]">拖拽或Ctrl+V貼上圖片</span>
                                </div>
                            </div>

                            {uploadedFiles.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {uploadedFiles.map((file, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#f5f5f5]">
                                            {file.type.startsWith('image/') ? (
                                                <img src={URL.createObjectURL(file)} alt={`已選擇的檔案 ${file.name}`} className="w-10 h-10 rounded-lg object-cover" />
                                            ) : (
                                                <FileText className="w-5 h-5 text-[#aaa]" />
                                            )}
                                            <span className="flex-1 text-sm text-[#555] truncate">{file.name}</span>
                                            <span className="text-[10px] text-[#bbb]">{(file.size / 1024).toFixed(0)} KB</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                                                className="p-1 rounded-full hover:bg-red-100 text-[#aaa] hover:text-red-500 transition-colors"
                                                title={`移除 ${file.name}`}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 歸還日期 */}
                        <div>
                            <label htmlFor="seal-return-date" className="block text-sm font-bold text-orange-600 mb-1.5">
                                歸還日期 <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="seal-return-date"
                                type="date"
                                title="歸還日期"
                                value={form.return_date}
                                onChange={e => setForm(f => ({ ...f, return_date: e.target.value }))}
                                min={form.borrow_date}
                                className="w-full px-4 py-3 rounded-xl bg-[#f9f9f9] border border-[#eee] text-[#333] text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
                            />
                        </div>

                        {/* 提交 / 暫存 */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => handleSubmit('submitted')}
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                <Send className="w-4 h-4" />
                                {submitting ? '提交中...' : '提交'}
                            </button>
                            <button
                                onClick={() => handleSubmit('draft')}
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f0f0f0] text-[#555] font-medium text-sm hover:bg-[#e5e5e5] transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                暫存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* 我的申請紀錄 */}
            {/* ================================================================ */}
            {activeView === 'list' && (
                <div className="glass-card p-6">
                    <h2 className="section-title mb-4">我的申請紀錄</h2>

                    {applications.length === 0 ? (
                        <div className="text-center py-10 text-[#888]">
                            <p className="text-4xl mb-3">📭</p>
                            <p>尚無申請紀錄</p>
                            <button onClick={() => setActiveView('form')} className="mt-3 text-sm text-orange-500 hover:underline">
                                立即新增申請 →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {applications.map((app) => (
                                <div key={app.id} className="p-4 rounded-xl bg-[#f5f5f5] hover:bg-[#f0f0f0] transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                {getStatusBadge(app.status)}
                                                <span className="text-sm font-medium text-[#333]">{app.seal_type}</span>
                                            </div>
                                            <p className="text-xs text-[#888] truncate">{app.purpose}</p>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] text-[#aaa]">
                                                <span>借印：{app.borrow_date}</span>
                                                <span>歸還：{app.return_date}</span>
                                                <span>部門：{app.department}</span>
                                            </div>
                                            {app.reviewer_comment && (
                                                <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5">
                                                    審核意見：{app.reviewer_comment}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] text-[#bbb]">
                                                {new Date(app.created_at).toLocaleDateString('zh-TW')}
                                            </span>
                                            {app.status === 'draft' && (
                                                <button
                                                    onClick={() => deleteApplication(app.id)}
                                                    className="p-1.5 rounded-lg text-[#aaa] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    title="刪除草稿"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
