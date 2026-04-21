'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { logActivity } from '@/lib/activity-log'
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
    line_picture_url: string | null
    location_id: string | null
}

interface Location {
    id: string
    name: string
}

export default function ElderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const elderId = params.id as string
    const [elder, setElder] = useState<Elder | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '', gender: 'male', birth_date: '', notes: '',
        id_number: '', phone: '', education_level: '',
        blood_pressure: '', pulse: '', location_id: '',
    })
    const [saving, setSaving] = useState(false)
    const [locations, setLocations] = useState<Location[]>([])

    // ICOPE 前後測進度
    const [icopeInitialDate, setIcopeInitialDate] = useState<string | null>(null)
    const [icopePostDate, setIcopePostDate] = useState<string | null>(null)

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
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 800, 1000)
            ctx.fillStyle = '#1e293b'
            ctx.font = 'bold 36px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('惠生健康檢測平台', 400, 60)
            ctx.font = 'bold 48px sans-serif'
            ctx.fillText(elder?.name || '', 400, 120)
            ctx.drawImage(img, 100, 160, 600, 600)
            ctx.fillStyle = '#64748b'
            ctx.font = '24px sans-serif'
            ctx.fillText('掃描此 QR Code 即可簽到', 400, 830)
            ctx.font = '18px sans-serif'
            ctx.fillText(`ID: ${elderId.slice(0, 8)}...`, 400, 870)
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
                    location_id: elderData.location_id || '',
                })
            }

            // Fetch locations for dropdown
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: locs } = await supabase
                    .from('locations')
                    .select('id, name')
                    .eq('instructor_id', user.id)
                    .order('name')
                if (locs) setLocations(locs)
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
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden ${elder.gender === 'female' ? 'bg-pink-600/60' : 'bg-blue-600/60'}`}>
                        {elder.line_picture_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={elder.line_picture_url} alt={elder.name} className="w-full h-full object-cover" />
                        ) : (
                            elder.name[0]
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#333]">{elder.name}</h1>
                        <p className="text-sm text-[#666]">
                            {elder.gender === 'female' ? '女' : '男'}
                            {elder.birth_date && ` · ${elder.birth_date}`}
                            {elder.notes && ` · ${elder.notes}`}
                        </p>
                        {elder.location_id && locations.find(l => l.id === elder.location_id) && (
                            <p className="text-xs text-violet-500 mt-0.5">📍 {locations.find(l => l.id === elder.location_id)?.name}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { setShowEdit(true); }} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                        <Pencil className="w-4 h-4" /> 編輯資料
                    </button>
                    <button onClick={() => setShowQR(!showQR)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 transition-colors flex items-center gap-1.5">
                        <QrCode className="w-4 h-4" /> QR Code
                    </button>
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
                                location_id: editForm.location_id || null,
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
                                    <label className="block text-xs font-medium text-slate-500 mb-1">據點</label>
                                    <select value={editForm.location_id} onChange={e => setEditForm({...editForm, location_id: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" title="據點">
                                        <option value="">— 請選擇據點 —</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
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

                {/* 快速操作按鈕列 */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Link href="/icope/new" className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200">
                        📋 ICOPE 評估
                    </Link>
                    <button onClick={handleExportExcel} disabled={exporting} className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50">
                        {exporting ? '匯出中...' : '📥 匯出報告'}
                    </button>
                </div>
            </div>


        </div>
    )
}
