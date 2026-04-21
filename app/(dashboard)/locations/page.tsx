'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { MapPin, Plus, Trash2 } from 'lucide-react'

interface Location {
    id: string
    name: string
    address: string | null
    created_at: string
    elder_count?: number
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({ name: '', address: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchLocations = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('locations')
            .select('*, elders(id)')
            .eq('instructor_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setLocations(data.map(loc => ({
                ...loc,
                elder_count: (loc.elders as any[])?.length || 0,
            })))
        }
        setLoading(false)
    }

    useEffect(() => { fetchLocations() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast.error('請輸入據點名稱')
            return
        }
        setSubmitting(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSubmitting(false); return }

        const { error } = await supabase.from('locations').insert({
            instructor_id: user.id,
            name: formData.name.trim(),
            address: formData.address.trim() || null,
        })

        if (error) {
            toast.error('新增失敗: ' + error.message)
        } else {
            toast.success('據點新增成功！')
            setFormData({ name: '', address: '' })
            setShowForm(false)
            fetchLocations()
        }
        setSubmitting(false)
    }

    const handleDelete = async (loc: Location) => {
        if (loc.elder_count && loc.elder_count > 0) {
            if (!confirm(`此據點目前有 ${loc.elder_count} 位長輩，刪除後這些長輩的據點欄位將被清空。確定要刪除「${loc.name}」嗎？`)) return
        } else {
            if (!confirm(`確定要刪除據點「${loc.name}」嗎？`)) return
        }
        const supabase = createClient()
        const { error } = await supabase.from('locations').delete().eq('id', loc.id)
        if (error) {
            toast.error('刪除失敗: ' + error.message)
        } else {
            toast.success('已刪除')
            fetchLocations()
        }
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">📍 據點管理</h1>
                    <p className="text-slate-400 text-sm mt-1">管理服務據點，可在新增長輩時指定所屬據點</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
                    {showForm ? '✕ 取消' : <><Plus className="w-4 h-4" /> 新增據點</>}
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
                    <h3 className="text-slate-800 font-semibold mb-2">新增據點</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">據點名稱 *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:outline-none transition-colors"
                                placeholder="例：中正社區活動中心"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">地址</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:outline-none transition-colors"
                                placeholder="例：台北市中正區..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting} className="btn-accent text-sm disabled:opacity-50">
                            {submitting ? '儲存中...' : '✓ 儲存'}
                        </button>
                    </div>
                </form>
            )}

            {/* Locations List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 glass-card animate-pulse" />
                    ))}
                </div>
            ) : locations.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <p className="text-5xl mb-4">📍</p>
                    <p className="text-slate-800 font-medium">尚無據點資料</p>
                    <p className="text-sm text-slate-400 mt-1">點擊上方「新增據點」按鈕開始</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {locations.map(loc => (
                        <div key={loc.id} className="glass-card p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">{loc.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                        {loc.address && <span>📍 {loc.address}</span>}
                                        <span>👥 {loc.elder_count || 0} 位長輩</span>
                                        <span>{new Date(loc.created_at).toLocaleDateString('zh-TW')}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(loc)}
                                className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="刪除據點"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
