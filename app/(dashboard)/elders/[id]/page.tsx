'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'
import AnalysisReport from '@/components/analysis/AnalysisReport'
import { type AnalysisMetrics } from '@/lib/analysis/ai-prescription'
import { CheckCircle2, Circle, ArrowRight, QrCode, Download, Printer, Pencil } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface Elder {
    id: string
    name: string
    gender: string | null
    birth_date: string | null
    notes: string | null
    id_number: string | null
    phone: string | null
    education_level: string | null
    blood_pressure: string | null
    pulse: number | null
}

interface Session {
    id: string
    test_type: string
    avg_elbow_rom: number | null
    avg_shoulder_rom: number | null
    avg_trunk_tilt: number | null
    avg_core_stability: number | null
    avg_shoulder_velocity: number | null
    avg_elbow_velocity: number | null
    avg_wrist_velocity: number | null
    tremor_detected: boolean
    compensation_detected: boolean
    duration_seconds: number | null
    notes: string | null
    created_at: string
}

export default function ElderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const elderId = params.id as string
    const [elder, setElder] = useState<Elder | null>(null)
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedSession, setExpandedSession] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)
    const [reportSession, setReportSession] = useState<Session | null>(null)
    const [showQR, setShowQR] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '', gender: 'male', birth_date: '', notes: '',
        id_number: '', phone: '', education_level: '',
        blood_pressure: '', pulse: '',
    })
    const [saving, setSaving] = useState(false)

    // 長輩專屬 QR Code URL
    const elderQrUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/elder-checkin/${elderId}`
        : ''

    // 下載 QR Code 為 PNG
    const handleDownloadQR = () => {
        const svg = document.getElementById('elder-qr-svg')
        if (!svg) return
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        canvas.width = 800
        canvas.height = 1000
        const ctx = canvas.getContext('2d')!
        const img = new Image()
        img.onload = () => {
            // 白色背景
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 800, 1000)
            // 標題
            ctx.fillStyle = '#1e293b'
            ctx.font = 'bold 36px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('惠生健康檢測平台', 400, 60)
            // 姓名
            ctx.font = 'bold 48px sans-serif'
            ctx.fillText(elder?.name || '', 400, 120)
            // QR Code
            ctx.drawImage(img, 100, 160, 600, 600)
            // 底部提示
            ctx.fillStyle = '#64748b'
            ctx.font = '24px sans-serif'
            ctx.fillText('掃描此 QR Code 即可簽到', 400, 830)
            ctx.font = '18px sans-serif'
            ctx.fillText(`ID: ${elderId.slice(0, 8)}...`, 400, 870)
            // 下載
            const link = document.createElement('a')
            link.download = `${elder?.name || '長輩'}_QRCode.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    // 列印 QR Code
    const handlePrintQR = () => {
        const svg = document.getElementById('elder-qr-svg')
        if (!svg) return
        const svgData = new XMLSerializer().serializeToString(svg)
        const printWindow = window.open('', '_blank')
        if (!printWindow) return
        printWindow.document.write(`
            <!DOCTYPE html>
            <html><head><title>${elder?.name} QR Code</title>
            <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
                h1 { font-size: 24px; color: #1e293b; margin-bottom: 4px; }
                h2 { font-size: 36px; color: #1e293b; margin-top: 0; }
                .hint { color: #64748b; font-size: 16px; margin-top: 16px; }
                .id { color: #94a3b8; font-size: 12px; }
                @media print { body { padding: 0; } }
            </style></head><body>
                <h1>惠生健康檢測平台</h1>
                <h2>${elder?.name || ''}</h2>
                ${svgData}
                <p class="hint">掃描此 QR Code 即可簽到</p>
                <p class="id">ID: ${elderId.slice(0, 8)}...</p>
            </body></html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    // ICOPE + Boccia 前後測進度
    const [icopeInitialDate, setIcopeInitialDate] = useState<string | null>(null)
    const [icopePostDate, setIcopePostDate] = useState<string | null>(null)
    const [bocciaPreDate, setBocciaPreDate] = useState<string | null>(null)
    const [bocciaPostDate, setBocciaPostDate] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            const { data: elderData } = await supabase
                .from('elders')
                .select('*')
                .eq('id', elderId)
                .single()

            if (elderData) {
                setElder(elderData)
                setEditForm({
                    name: elderData.name || '',
                    gender: elderData.gender || 'male',
                    birth_date: elderData.birth_date || '',
                    notes: elderData.notes || '',
                    id_number: elderData.id_number || '',
                    phone: elderData.phone || '',
                    education_level: elderData.education_level || '',
                    blood_pressure: elderData.blood_pressure || '',
                    pulse: elderData.pulse?.toString() || '',
                })
            }

            // Boccia sessions
            const { data: sessionData } = await supabase
                .from('analysis_sessions')
                .select('*')
                .eq('elder_id', elderId)
                .order('created_at', { ascending: false })

            if (sessionData) {
                setSessions(sessionData)
                const pre = sessionData.find(s => s.test_type === 'pre')
                const post = sessionData.find(s => s.test_type === 'post')
                if (pre) setBocciaPreDate(new Date(pre.created_at).toLocaleDateString('zh-TW'))
                if (post) setBocciaPostDate(new Date(post.created_at).toLocaleDateString('zh-TW'))
            }

            // ICOPE assessments (cross-check by name + birth_date)
            if (elderData) {
                let pQuery = supabase.from('patients').select('id').eq('name', elderData.name)
                if (elderData.birth_date) pQuery = pQuery.eq('birth_date', elderData.birth_date)
                const { data: patients } = await pQuery

                if (patients && patients.length > 0) {
                    const { data: assessments } = await supabase
                        .from('assessments')
                        .select('stage, assessed_at')
                        .in('patient_id', patients.map(p => p.id))
                        .order('assessed_at', { ascending: false })

                    if (assessments) {
                        const initial = assessments.find(a => a.stage === 'initial')
                        const post = assessments.find(a => a.stage === 'post')
                        if (initial) setIcopeInitialDate(new Date(initial.assessed_at).toLocaleDateString('zh-TW'))
                        if (post) setIcopePostDate(new Date(post.assessed_at).toLocaleDateString('zh-TW'))
                    }
                }
            }

            setLoading(false)
        }

        fetchData()
    }, [elderId])

    const handleExportExcel = async () => {
        setExporting(true)
        try {
            const res = await fetch(`/api/export/${elderId}`)
            if (!res.ok) throw new Error('匯出失敗')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${elder?.name || '長輩'}_前後測報告.xlsx`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Excel 匯出成功！')
            logActivity('匯出 Excel', `長輩: ${elder?.name}`, 'elder', elderId)
        } catch (err) {
            toast.error('匯出失敗，請重試')
        }
        setExporting(false)
    }

    const handleDeleteElder = async () => {
        if (!confirm(`確定要刪除「${elder?.name}」的所有資料嗎？此操作不可恢復。`)) return
        const supabase = createClient()
        const { error } = await supabase.from('elders').delete().eq('id', elderId)
        if (error) {
            toast.error('刪除失敗')
        } else {
            toast.success('已刪除')
            logActivity('刪除長輩', `姓名: ${elder?.name}`, 'elder', elderId)
            router.push('/elders')
        }
    }

    const preSessions = sessions.filter(s => s.test_type === 'pre')
    const postSessions = sessions.filter(s => s.test_type === 'post')
    const latestPre = preSessions[0]
    const latestPost = postSessions[0]

    const renderComparison = (label: string, preVal: number | null, postVal: number | null, unit: string = '°', lowerBetter: boolean = false) => {
        const pre = preVal ?? null
        const post = postVal ?? null
        if (pre === null && post === null) return null

        const diff = pre !== null && post !== null ? post - pre : null
        const isImproved = diff !== null ? (lowerBetter ? diff < 0 : diff > 0) : null

        return (
            <div className="flex items-center justify-between py-2 border-b border-[#eee] last:border-b-0">
                <span className="text-sm text-[#666]">{label}</span>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">{pre !== null ? `${pre.toFixed(1)}${unit}` : '--'}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-[#333] font-medium">{post !== null ? `${post.toFixed(1)}${unit}` : '--'}</span>
                    {diff !== null && (
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${isImproved ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit}
                        </span>
                    )}
                </div>
            </div>
        )
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
    }

    if (!elder) {
        return <div className="text-center py-20 text-[#666]">找不到此長輩資料</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/elders')} className="text-[#666] hover:text-[#333] transition-colors">
                        ← 返回
                    </button>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white ${elder.gender === 'female' ? 'bg-pink-600/60' : 'bg-blue-600/60'}`}>
                        {elder.name[0]}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#333]">{elder.name}</h1>
                        <p className="text-sm text-[#666]">
                            {elder.gender === 'female' ? '女' : '男'}
                            {elder.birth_date && ` · ${elder.birth_date}`}
                            {elder.notes && ` · ${elder.notes}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { setShowEdit(true); }} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                        <Pencil className="w-4 h-4" /> 編輯資料
                    </button>
                    <button onClick={() => setShowQR(!showQR)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 transition-colors flex items-center gap-1.5">
                        <QrCode className="w-4 h-4" /> QR Code
                    </button>
                    <Link href={`/analysis/${elderId}`} className="btn-accent text-sm">
                        🤖 開始分析
                    </Link>
                    <button onClick={handleExportExcel} disabled={exporting} className="btn-primary text-sm disabled:opacity-50">
                        {exporting ? '匯出中...' : '📥 匯出 Excel'}
                    </button>
                    <button onClick={handleDeleteElder} className="px-4 py-2.5 rounded-xl text-sm text-red-600 border border-red-200 hover:bg-red-500/10 transition-colors">
                        🗑 刪除
                    </button>
                </div>
            </div>

            {/* 🔲 個人專屬 QR Code */}
            {showQR && (
                <div className="glass-card p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-100">
                            <QRCodeSVG
                                id="elder-qr-svg"
                                value={elderQrUrl}
                                size={200}
                                level="H"
                                includeMargin
                            />
                        </div>
                        {/* 說明 & 按鈕 */}
                        <div className="flex-1 text-center sm:text-left space-y-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 justify-center sm:justify-start">
                                    <QrCode className="w-5 h-5 text-violet-500" />
                                    {elder.name} 的專屬 QR Code
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    列印此 QR Code 給長輩，活動現場由工作人員掃描即可完成簽到
                                </p>
                            </div>
                            <div className="flex gap-2 justify-center sm:justify-start">
                                <button
                                    onClick={handleDownloadQR}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> 下載 PNG
                                </button>
                                <button
                                    onClick={handlePrintQR}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 transition-colors"
                                >
                                    <Printer className="w-4 h-4" /> 列印
                                </button>
                            </div>
                            <p className="text-xs text-slate-400">
                                ※ 適用於沒有手機的長輩，可搭配活動簽到系統使用
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ✏️ 編輯基本資料 Modal */}
            {showEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">✏️ 編輯長輩資料</h2>
                            <button onClick={() => setShowEdit(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            setSaving(true)
                            const supabase = createClient()
                            const { error } = await supabase.from('elders').update({
                                name: editForm.name,
                                gender: editForm.gender,
                                birth_date: editForm.birth_date || null,
                                notes: editForm.notes || null,
                                id_number: editForm.id_number || null,
                                phone: editForm.phone || null,
                                education_level: editForm.education_level || null,
                                blood_pressure: editForm.blood_pressure || null,
                                pulse: editForm.pulse ? parseInt(editForm.pulse) : null,
                            }).eq('id', elderId)
                            if (error) {
                                toast.error('儲存失敗: ' + error.message)
                            } else {
                                toast.success('資料已更新')
                                setShowEdit(false)
                                // 刷新資料
                                const { data: updated } = await supabase.from('elders').select('*').eq('id', elderId).single()
                                if (updated) setElder(updated)
                            }
                            setSaving(false)
                        }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">姓名 *</label>
                                    <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">性別</label>
                                    <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" title="性別">
                                        <option value="male">男</option>
                                        <option value="female">女</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">身分證字號</label>
                                    <input type="text" value={editForm.id_number} onChange={e => setEditForm({...editForm, id_number: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">出生日期</label>
                                    <input type="date" value={editForm.birth_date} onChange={e => setEditForm({...editForm, birth_date: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">電話</label>
                                    <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">教育程度</label>
                                    <select value={editForm.education_level} onChange={e => setEditForm({...editForm, education_level: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" title="教育程度">
                                        <option value="">未填寫</option>
                                        <option value="不識字">不識字</option>
                                        <option value="國小">國小</option>
                                        <option value="國中">國中</option>
                                        <option value="高中職">高中職</option>
                                        <option value="專科">專科</option>
                                        <option value="大學">大學</option>
                                        <option value="研究所以上">研究所以上</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">血壓 (收縮壓/舒張壓)</label>
                                    <input type="text" placeholder="例: 120/80" value={editForm.blood_pressure} onChange={e => setEditForm({...editForm, blood_pressure: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">脈搏 (次/分)</label>
                                    <input type="number" placeholder="例: 72" value={editForm.pulse} onChange={e => setEditForm({...editForm, pulse: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">備註</label>
                                <textarea rows={2} value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">取消</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-500 transition-colors disabled:opacity-50">
                                    {saving ? '儲存中...' : '✓ 儲存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 📋 統一前後測進度追蹤器 */}
            <div className="glass-card p-6 space-y-5">
                <h2 className="text-lg font-bold text-slate-800">📋 前後測進度</h2>

                {/* ICOPE 進度 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">📋 ICOPE 評估</span>
                    </div>
                    <div className="flex items-center gap-3 pl-1">
                        {/* 初評 */}
                        <div className="flex items-center gap-2">
                            {icopeInitialDate ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-800">初評</p>
                                <p className="text-[10px] text-slate-500">{icopeInitialDate || '尚未進行'}</p>
                            </div>
                        </div>
                        {/* 連接線 */}
                        <div className={`flex-1 h-0.5 rounded-full ${icopeInitialDate ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                        {/* 後測 */}
                        <div className="flex items-center gap-2">
                            {icopePostDate ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-800">後測</p>
                                <p className="text-[10px] text-slate-500">{icopePostDate || '尚未進行'}</p>
                            </div>
                        </div>
                        {/* 快速操作 */}
                        <Link
                            href="/icope/new"
                            className="ml-2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 text-xs font-medium hover:bg-teal-100 transition-colors border border-teal-200"
                        >
                            {!icopeInitialDate ? '開始初評' : !icopePostDate ? '進行後測' : '查看紀錄'}
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* 分隔線 */}
                <div className="border-t border-slate-100" />

                {/* Boccia 進度 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">🎯 地板滾球分析</span>
                    </div>
                    <div className="flex items-center gap-3 pl-1">
                        {/* 前測 */}
                        <div className="flex items-center gap-2">
                            {bocciaPreDate ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-800">前測</p>
                                <p className="text-[10px] text-slate-500">{bocciaPreDate || '尚未進行'}</p>
                            </div>
                        </div>
                        {/* 連接線 */}
                        <div className={`flex-1 h-0.5 rounded-full ${bocciaPreDate ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                        {/* 後測 */}
                        <div className="flex items-center gap-2">
                            {bocciaPostDate ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Circle className="w-5 h-5 text-slate-300" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-800">後測</p>
                                <p className="text-[10px] text-slate-500">{bocciaPostDate || '尚未進行'}</p>
                            </div>
                        </div>
                        {/* 快速操作 */}
                        <Link
                            href={`/analysis/${elderId}`}
                            className="ml-2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors border border-amber-200"
                        >
                            {!bocciaPreDate ? '開始前測' : !bocciaPostDate ? '進行後測' : '查看紀錄'}
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* 快速操作按鈕列 */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Link href="/icope/new" className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200">
                        📋 ICOPE 評估
                    </Link>
                    <Link href={`/analysis/${elderId}`} className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                        🎯 滾球分析
                    </Link>
                    <button onClick={handleExportExcel} disabled={exporting} className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50">
                        {exporting ? '匯出中...' : '📥 匯出報告'}
                    </button>
                </div>
            </div>

            {/* Pre-Post Comparison */}
            {(latestPre || latestPost) && (
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-[#333] mb-4">📊 前後測對比</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <p className="text-xs text-amber-600 font-medium mb-1">最新前測</p>
                            <p className="text-sm text-[#333]">{latestPre ? new Date(latestPre.created_at).toLocaleDateString('zh-TW') : '尚未進行'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                            <p className="text-xs text-emerald-600 font-medium mb-1">最新後測</p>
                            <p className="text-sm text-[#333]">{latestPost ? new Date(latestPost.created_at).toLocaleDateString('zh-TW') : '尚未進行'}</p>
                        </div>
                    </div>
                    <div className="space-y-0">
                        {renderComparison('肘關節活動度 (ROM)', latestPre?.avg_elbow_rom ?? null, latestPost?.avg_elbow_rom ?? null)}
                        {renderComparison('肩關節活動度', latestPre?.avg_shoulder_rom ?? null, latestPost?.avg_shoulder_rom ?? null)}
                        {renderComparison('軀幹傾斜度', latestPre?.avg_trunk_tilt ?? null, latestPost?.avg_trunk_tilt ?? null, '°', true)}
                        {renderComparison('核心穩定性', latestPre?.avg_core_stability ?? null, latestPost?.avg_core_stability ?? null, '°', true)}
                        {renderComparison('肩部角速度', latestPre?.avg_shoulder_velocity ?? null, latestPost?.avg_shoulder_velocity ?? null, '°/s')}
                        {renderComparison('肘部角速度', latestPre?.avg_elbow_velocity ?? null, latestPost?.avg_elbow_velocity ?? null, '°/s')}
                        {renderComparison('腕部角速度', latestPre?.avg_wrist_velocity ?? null, latestPost?.avg_wrist_velocity ?? null, '°/s')}
                    </div>
                </div>
            )}

            {/* Session History */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-[#333] mb-4">📋 分析紀錄 ({sessions.length})</h2>
                {sessions.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-[#666]">尚無分析紀錄</p>
                        <Link href={`/analysis/${elderId}`} className="inline-block mt-3 btn-accent text-sm">
                            開始第一次分析
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sessions.map((session) => (
                            <div key={session.id} className="rounded-xl bg-[#f5f5f5] overflow-hidden">
                                <button
                                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-[#f5f5f5] transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${session.test_type === 'pre' ? 'bg-amber-50 text-amber-600' :
                                            session.test_type === 'post' ? 'bg-emerald-50 text-emerald-600' :
                                                'bg-slate-100 text-[#666]'
                                            }`}>
                                            {session.test_type === 'pre' ? '前測' : session.test_type === 'post' ? '後測' : '練習'}
                                        </span>
                                        <span className="text-[#333] text-sm">{new Date(session.created_at).toLocaleString('zh-TW')}</span>
                                        {session.duration_seconds && (
                                            <span className="text-xs text-slate-500">{Math.round(session.duration_seconds)}秒</span>
                                        )}
                                    </div>
                                    <span className="text-slate-500">{expandedSession === session.id ? '▲' : '▼'}</span>
                                </button>
                                {expandedSession === session.id && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                            <div className="p-2 rounded-lg bg-[#f5f5f5]">
                                                <p className="text-xs text-slate-500">肘ROM</p>
                                                <p className="text-[#333] font-medium">{session.avg_elbow_rom?.toFixed(1) ?? '--'}°</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#f5f5f5]">
                                                <p className="text-xs text-slate-500">肩ROM</p>
                                                <p className="text-[#333] font-medium">{session.avg_shoulder_rom?.toFixed(1) ?? '--'}°</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#f5f5f5]">
                                                <p className="text-xs text-slate-500">核心穩定性</p>
                                                <p className="text-[#333] font-medium">{session.avg_core_stability?.toFixed(1) ?? '--'}°</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#f5f5f5]">
                                                <p className="text-xs text-slate-500">軀幹傾斜</p>
                                                <p className="text-[#333] font-medium">{session.avg_trunk_tilt?.toFixed(1) ?? '--'}°</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#f5f5f5]">
                                                <p className="text-xs text-slate-500">震顫</p>
                                                <p className={`font-medium ${session.tremor_detected ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {session.tremor_detected ? '檢測到' : '未檢測到'}
                                                </p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#f5f5f5]">
                                                <p className="text-xs text-slate-500">代償動作</p>
                                                <p className={`font-medium ${session.compensation_detected ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {session.compensation_detected ? '檢測到' : '未檢測到'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setReportSession(session)}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-cyan-600 text-white font-bold text-sm hover:opacity-90 transition-opacity"
                                        >
                                            📊 查看 AI 運動分析報告
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Full Report Overlay */}
            {reportSession && (
                <AnalysisReport
                    metrics={{
                        elbow_rom: reportSession.avg_elbow_rom ?? 0,
                        trunk_stability: reportSession.avg_trunk_tilt ?? 0,
                        avg_velocity: reportSession.avg_wrist_velocity ?? 0,
                        max_rom: reportSession.avg_elbow_rom ?? 0,
                        min_rom: reportSession.avg_elbow_rom ?? 0,
                        avg_rom: reportSession.avg_elbow_rom ?? 0,
                        avg_trunk_tilt: reportSession.avg_trunk_tilt ?? 0,
                        throw_count: 0,
                        stable_ratio: reportSession.avg_trunk_tilt != null ? Math.max(0, Math.round(100 - reportSession.avg_trunk_tilt * 3)) : 50,
                        core_stability_angle: reportSession.avg_core_stability ?? null,
                        avg_shoulder_angular_vel: reportSession.avg_shoulder_velocity ?? null,
                        avg_elbow_angular_vel: reportSession.avg_elbow_velocity ?? null,
                        avg_wrist_angular_vel: reportSession.avg_wrist_velocity ?? null,
                        tremor_detected_ratio: reportSession.tremor_detected ? 25 : 0,
                        tremor_avg_frequency: null,
                        compensation_detected_ratio: reportSession.compensation_detected ? 30 : 0,
                        compensation_types: reportSession.compensation_detected ? ['動作代償'] : [],
                        posture_correction_avg: 0,
                        manual_throw_count: 0,
                    } as AnalysisMetrics}
                    patientName={elder?.name}
                    sessionDate={new Date(reportSession.created_at).toLocaleString('zh-TW')}
                    durationSeconds={reportSession.duration_seconds ?? undefined}
                    onClose={() => setReportSession(null)}
                />
            )}
        </div>
    )
}
